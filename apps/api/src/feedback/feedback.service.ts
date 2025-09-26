import { Injectable, Logger } from '@nestjs/common'
import { SendFeedbackDto } from './dto/send-feedback.dto'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name)
  private transporter: nodemailer.Transporter

  constructor(private readonly configService: ConfigService) {

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
      port: parseInt(this.configService.get('SMTP_PORT')) || 465,
      secure: true,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    })
  }

  async sendFeedback(feedbackDto: SendFeedbackDto): Promise<void> {
    try {
      const { name, email, subject, message } = feedbackDto
     this.logger.log(
      'FeedbackService initialized',
       this.configService.get('SMTP_HOST') ,
         parseInt(this.configService.get('SMTP_PORT')),
         this.configService.get('SMTP_USER'),
         this.configService.get('SMTP_PASS'),
          this.configService.get('SMTP_FROM_EMAIL'),
          this.configService.get('SUPPORT_EMAIL'),
          this.transporter
         )
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
      this.logger.error('Failed to send feedback email', error)
      throw new Error('Failed to send feedback email')
    }
  }
}