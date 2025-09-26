import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'


function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

const transporter = (() => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = port === 465
  if (!user || !pass) {
    console.warn('[send-email] SMTP_USER or SMTP_PASS not set; email route will fail until provided.')
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  })
})()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { to, subject, message } = body || {}

    if (!to || !/^[^<>@\s]+@[^<>@\s]+\.[^<>@\s]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid or missing "to" email' }, { status: 400 })
    }
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'Missing subject' }, { status: 400 })
    }
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }


    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SUPPORT_EMAIL,
      subject,
      text: message,
      html: `<pre style="font-size:14px; line-height:1.4;">${escapeHtml(message)}</pre>`
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-email] error', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const dynamic = 'force-dynamic'
