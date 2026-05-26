/**
 * Email Service
 *
 * Centralized email sending functionality using Resend.
 * Handles email verification, welcome emails, and security notifications.
 */

import { Resend } from 'resend'
import { headers } from 'next/headers'
import { detectEnvironment } from './env-config'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Read env vars at runtime (not module load time) to avoid caching issues
function getFromEmail() {
  return process.env.EMAIL_FROM || 'Piano Blog <onboarding@resend.dev>'
}

async function getAppUrl() {
  // Derive URL from the incoming request host so email links
  // point to the correct deployment (staging, preview, production)
  try {
    const h = await headers()
    const host = h.get('host')
    if (host) {
      const protocol = host.startsWith('localhost') ? 'http' : 'https'
      return `${protocol}://${host}`
    }
  } catch {
    // headers() unavailable outside of a request context
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Add environment prefix to email subject
 * Helps distinguish staging/development emails from production
 */
function getEmailSubject(subject: string): string {
  const env = detectEnvironment()

  if (env === 'development') return `[LOCAL] ${subject}`
  if (env === 'staging') return `[STAGING] ${subject}`
  return subject // Production: no prefix
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const fromEmail = getFromEmail()
  console.log('📧 Sending email with FROM:', fromEmail, 'TO:', to, 'SUBJECT:', subject)

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    })

    console.log('✅ Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error }
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string, username?: string) {
  const appUrl = await getAppUrl()
  const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Piano Blog</h1>
        </div>

        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>

          ${username ? `<p>Hi ${username},</p>` : '<p>Hi there,</p>'}

          <p>Thanks for signing up for Piano Blog! Please verify your email address to activate your account and unlock all features.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Piano Blog. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
    Verify Your Email Address

    ${username ? `Hi ${username},` : 'Hi there,'}

    Thanks for signing up for Piano Blog! Please verify your email address to activate your account and unlock all features.

    Click here to verify: ${verificationUrl}

    This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

    © ${new Date().getFullYear()} Piano Blog. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject: getEmailSubject('Verify your email address - Piano Blog'),
    html,
    text,
  })
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, username: string) {
  const appUrl = await getAppUrl()
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Piano Blog</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎵 Welcome to Piano Blog!</h1>
        </div>

        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Your account is verified!</h2>

          <p>Hi ${username},</p>

          <p>Welcome to Piano Blog - your community for discovering piano venues, musicians, and events!</p>

          <h3 style="color: #1f2937; margin-top: 30px;">What's next?</h3>

          <ul style="color: #4b5563;">
            <li style="margin-bottom: 10px;">✨ <strong>Complete your profile</strong> - Add bio, location, and musical interests</li>
            <li style="margin-bottom: 10px;">🎹 <strong>Discover venues</strong> - Find piano-friendly locations near you</li>
            <li style="margin-bottom: 10px;">🎵 <strong>Join events</strong> - RSVP to jam sessions, concerts, and workshops</li>
            <li style="margin-bottom: 10px;">🔗 <strong>Link your wallet</strong> - Unlock blockchain features and earn PXP tokens</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/profile" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Complete Your Profile
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our help center.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Piano Blog. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
    Welcome to Piano Blog!

    Hi ${username},

    Your account is verified! Welcome to Piano Blog - your community for discovering piano venues, musicians, and events!

    What's next?
    - Complete your profile - Add bio, location, and musical interests
    - Discover venues - Find piano-friendly locations near you
    - Join events - RSVP to jam sessions, concerts, and workshops
    - Link your wallet - Unlock blockchain features and earn PXP tokens

    Get started: ${appUrl}/profile

    Need help? Reply to this email or visit our help center.

    © ${new Date().getFullYear()} Piano Blog. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject: getEmailSubject('Welcome to Piano Blog! 🎵'),
    html,
    text,
  })
}

/**
 * Send security alert email
 */
export async function sendSecurityAlertEmail(
  email: string,
  username: string,
  alertType:
    | 'email_changed'
    | 'password_changed'
    | 'wallet_linked'
    | 'wallet_unlinked'
    | 'sessions_logged_out'
) {
  const appUrl = await getAppUrl()
  const alertMessages = {
    email_changed: {
      title: 'Email Address Changed',
      message:
        'Your email address has been changed. If you did not make this change, please contact support immediately.',
    },
    password_changed: {
      title: 'Password Changed',
      message:
        'Your password has been changed successfully. All active sessions have been logged out for security.',
    },
    wallet_linked: {
      title: 'Wallet Linked',
      message:
        'A cryptocurrency wallet has been linked to your account. You can now use blockchain features and earn PXP tokens.',
    },
    wallet_unlinked: {
      title: 'Wallet Unlinked',
      message: 'A cryptocurrency wallet has been unlinked from your account.',
    },
    sessions_logged_out: {
      title: 'All Sessions Logged Out',
      message:
        'All active sessions were logged out from your account. If you did not make this change, please reset your password immediately.',
    },
  }

  const alert = alertMessages[alertType]

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Security Alert</h1>
        </div>

        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">${alert.title}</h2>

          <p>Hi ${username},</p>

          <p>${alert.message}</p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">
              If you did not make this change, please secure your account immediately.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/account/settings" style="background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Review Account Settings
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Time: ${new Date().toLocaleString()}<br>
            If you have any concerns, please contact support immediately.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Piano Blog. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
    Security Alert: ${alert.title}

    Hi ${username},

    ${alert.message}

    ⚠️ If you did not make this change, please secure your account immediately.

    Time: ${new Date().toLocaleString()}

    Review your account settings: ${appUrl}/account/settings

    If you have any concerns, please contact support immediately.

    © ${new Date().getFullYear()} Piano Blog. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject: getEmailSubject(`Security Alert: ${alert.title}`),
    html,
    text,
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, username?: string) {
  const appUrl = await getAppUrl()
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Reset Your Password</h1>
        </div>

        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>

          ${username ? `<p>Hi ${username},</p>` : '<p>Hi there,</p>'}

          <p>We received a request to reset your password for your Piano Blog account. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">
              This link will expire in 1 hour.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Piano Blog. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
    Reset Your Password

    ${username ? `Hi ${username},` : 'Hi there,'}

    We received a request to reset your password for your Piano Blog account. Click the link below to create a new password:

    ${resetUrl}

    ⚠️ This link will expire in 1 hour.

    If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

    © ${new Date().getFullYear()} Piano Blog. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject: getEmailSubject('Reset your password - Piano Blog'),
    html,
    text,
  })
}

/**
 * Send magic link login email
 */
export async function sendMagicLinkEmail(email: string, token: string, username?: string) {
  const appUrl = await getAppUrl()
  const loginUrl = `${appUrl}/api/auth/magic-link/verify?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Magic Link Login</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✨ Magic Link Login</h1>
        </div>

        <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0;">Sign in to Piano Blog</h2>

          ${username ? `<p>Hi ${username},</p>` : '<p>Hi there,</p>'}

          <p>Click the button below to securely sign in to your Piano Blog account. No password needed!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Sign In to Piano Blog
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Or copy and paste this link into your browser:<br>
            <a href="${loginUrl}" style="color: #667eea; word-break: break-all;">${loginUrl}</a>
          </p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">
              This link will expire in 15 minutes.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you didn't request this login link, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Piano Blog. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  const text = `
    Magic Link Login

    ${username ? `Hi ${username},` : 'Hi there,'}

    Click the link below to securely sign in to your Piano Blog account. No password needed!

    ${loginUrl}

    ⚠️ This link will expire in 15 minutes.

    If you didn't request this login link, you can safely ignore this email.

    © ${new Date().getFullYear()} Piano Blog. All rights reserved.
  `

  return sendEmail({
    to: email,
    subject: getEmailSubject('Sign in to Piano Blog - Magic Link'),
    html,
    text,
  })
}

/**
 * Send a collaboration message notification email
 */
export async function sendCollabMessageEmail({
  recipientEmail,
  recipientName,
  senderName,
  message,
  sessionId,
}: {
  recipientEmail: string
  recipientName: string
  senderName: string
  message: string
  sessionId: number
}) {
  const appUrl = await getAppUrl()
  const messageUrl = `${appUrl}/messages/${sessionId}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #7c3aed; font-size: 24px; margin: 0;">🎹 Global Piano Network</h1>
      </div>

      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; color: #374151; font-size: 16px;">
          Hi ${recipientName},
        </p>
        <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">
          <strong>${senderName}</strong> sent you a message on Global Piano Network:
        </p>
        <blockquote style="margin: 0; padding: 16px; background: #fff; border-left: 4px solid #7c3aed; border-radius: 4px; color: #1f2937; font-size: 15px; font-style: italic;">
          "${message}"
        </blockquote>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${messageUrl}"
           style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 15px; font-weight: 600;">
          Reply on GPN
        </a>
      </div>

      <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
        You're receiving this because someone messaged you on
        <a href="${appUrl}" style="color: #7c3aed;">Global Piano Network</a>.
      </p>
    </div>
  `

  const text = `
Hi ${recipientName},

${senderName} sent you a message on Global Piano Network:

"${message}"

Reply here: ${messageUrl}

---
Global Piano Network
  `

  return sendEmail({
    to: recipientEmail,
    subject: getEmailSubject(`${senderName} sent you a message on GPN`),
    html,
    text,
  })
}
