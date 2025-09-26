import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { SendFeedbackDto } from './dto/send-feedback.dto'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)
  private transporter: nodemailer.Transporter
  private fallbackTried = false

  constructor(private readonly configService: ConfigService) {
    // Parse & normalize config
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com'
    const rawPort = this.configService.get<string>('SMTP_PORT') ?? ''
    const parsedPort = parseInt(rawPort, 10)
    const port = Number.isNaN(parsedPort) ? 465 : parsedPort
    const user = this.configService.get<string>('SMTP_USER')
    const pass = this.configService.get<string>('SMTP_PASS')

    // NOTE: secure should normally be true only for 465
    const secureEnv = this.configService.get<string>('SMTP_SECURE')
    // If SMTP_SECURE explicitly set, respect it, else infer from port (465 => true)
    const secure = typeof secureEnv === 'string' ? secureEnv === 'true' : port === 465

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    })

    // Perform a lazy async verification without blocking constructor
    this.transporter.verify().then(() => {
      this.logger.log(`SMTP transporter verified (host=${host}, port=${port}, secure=${secure})`)
    }).catch(err => {
      this.logger.error(
        `SMTP transporter verification failed for host=${host} port=${port} secure=${secure}: ${err.message}`,
        err.stack,
      )
      this.tryFallbackOnTimeout(err, { host, user })
    })
  }

  private tryFallbackOnTimeout(err: any, ctx: { host: string, user?: string }) {
    const enableFallback = this.configService.get('ENABLE_SMTP_FALLBACK') !== 'false'
    if (!enableFallback || this.fallbackTried) return
    const msg = String(err?.message || '')
    // Typical nodemailer timeout errors contain 'timeout' or code ETIMEDOUT
    if (/timeout/i.test(msg) || err?.code === 'ETIMEDOUT' || err?.code === 'ECONNECTION') {
      // Current transporter settings
      // If already not port 465 secure true, no sense to fallback
      // We'll fallback to port 587 STARTTLS (secure=false)
      // Recreate transporter
      this.fallbackTried = true
      const host = this.configService.get<string>('SMTP_HOST') || ctx.host
      const user = this.configService.get<string>('SMTP_USER') || ctx.user
      const pass = this.configService.get<string>('SMTP_PASS')
      const fallbackPort = parseInt(this.configService.get('SMTP_FALLBACK_PORT') || '587', 10)
      this.logger.warn(`Attempting SMTP fallback to port=${fallbackPort} secure=false host=${host}`)
      this.transporter = nodemailer.createTransport({
        host,
        port: fallbackPort,
        secure: false,
        auth: user && pass ? { user, pass } : undefined,
      })
      this.transporter.verify().then(() => {
        this.logger.log(`SMTP fallback transporter verified (host=${host}, port=${fallbackPort}, secure=false)`) 
      }).catch(fbErr => {
        this.logger.error(`SMTP fallback verification failed: ${fbErr.message}`, fbErr.stack)
      })
    }
  }

  async sendFeedback(feedbackDto: SendFeedbackDto): Promise<void> {
    try {
      const { name, email, subject, message } = feedbackDto

      // Minimal debug (omit password)
      if (this.configService.get('DEBUG_EMAIL') === 'true') {
        this.logger.debug(
          `Preparing feedback email with SMTP_HOST=${this.configService.get('SMTP_HOST')} SMTP_PORT=${this.configService.get('SMTP_PORT')} SMTP_USER=${this.configService.get('SMTP_USER')} FROM=${this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER')} TO=${this.configService.get('SUPPORT_EMAIL')}`,
        )
      }
      const mailOptions = {
        from: this.configService.get('SMTP_FROM_EMAIL') || this.configService.get('SMTP_USER'),
        to: this.configService.get('SUPPORT_EMAIL') || 'support@transactproof.com',
        subject: `[TransactProof Feedback] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
              New Feedback from TransactProof
            </h2>
            
            <div style="margin: 20px 0;">
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Message:</h3>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #f97316; margin: 10px 0;">
                <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              <p>This email was sent from the TransactProof Help Center contact form.</p>
              <p>Reply directly to this email to respond to the user.</p>
            </div>
          </div>
        `,
        replyTo: email,
      }

      await this.transporter.sendMail(mailOptions)
      this.logger.log(`Feedback email sent successfully from ${email}`)
    } catch (error) {
      this.logger.error(
        `Failed to send feedback email: ${error?.message || 'Unknown error'}`,
        error?.stack,
      )
      // If initial send fails due to timeout and fallback not yet attempted (e.g. verify race), try fallback here as last resort
      this.tryFallbackOnTimeout(error, { host: this.configService.get('SMTP_HOST'), user: this.configService.get('SMTP_USER') })
      // Attempt a one-time verification to surface deeper SMTP issues
      try {
        await this.transporter.verify()
        this.logger.warn('Transporter verification succeeded after failure. Original sendMail error may be content-related or transient.')
      } catch (verifyErr) {
        this.logger.error(
          `Transporter verification after failure also failed: ${verifyErr?.message}`,
          verifyErr?.stack,
        )
      }
      // Re-throw with original message preserved (but hide internal details from client)
      throw new InternalServerErrorException('Failed to send feedback email')
    }
  }
}