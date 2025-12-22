import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

async function testForgotPassword() {
  const email = 'mal.davies14@gmail.com'

  console.log('🔍 Testing forgot password flow for:', email)
  console.log('='.repeat(60))

  // 1. Check Resend API key
  console.log('\n1️⃣ Checking Resend API key...')
  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment')
    return
  }
  console.log('✅ RESEND_API_KEY found:', process.env.RESEND_API_KEY.substring(0, 10) + '...')

  // 2. Find user
  console.log('\n2️⃣ Finding user...')
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.toLowerCase() }, { username: email.toLowerCase() }],
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      email: true,
      passwordHash: true,
      displayName: true,
    },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  console.log('✅ User found:')
  console.log('   ID:', user.id)
  console.log('   Email:', user.email)
  console.log('   Username:', user.username)
  console.log('   Has password:', user.passwordHash ? '✅ Yes' : '❌ No')

  // 3. Generate token
  console.log('\n3️⃣ Generating password reset token...')
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)

  console.log('✅ Token generated:', token.substring(0, 20) + '...')
  console.log('   Expires at:', expiresAt.toLocaleString())

  // 4. Update database
  console.log('\n4️⃣ Storing token in database...')
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiresAt,
    },
  })
  console.log('✅ Token stored in database')

  // 5. Send email
  console.log('\n5️⃣ Sending password reset email...')
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`
  const FROM_EMAIL = process.env.EMAIL_FROM || 'Piano Blog <onboarding@resend.dev>'

  console.log('   From:', FROM_EMAIL)
  console.log('   To:', user.email)
  console.log('   Reset URL:', resetUrl)

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: 'Reset your password - Piano Blog',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Reset Your Password</h2>
            <p>Hi ${user.username || 'there'},</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
            <p>Or copy this link: ${resetUrl}</p>
            <p style="color: #999; margin-top: 30px;">This link expires in 1 hour.</p>
          </body>
        </html>
      `,
      text: `
        Reset Your Password

        Hi ${user.username || 'there'},

        Click the link below to reset your password:
        ${resetUrl}

        This link expires in 1 hour.
      `,
    })

    console.log('\n✅ Email sent successfully!')
    console.log('   Resend Response:', JSON.stringify(result, null, 2))
  } catch (error) {
    console.log('\n❌ Failed to send email')
    console.error('   Error:', error)
  }

  await prisma.$disconnect()
  console.log('\n' + '='.repeat(60))
  console.log('✅ Test complete!')
}

testForgotPassword().catch(console.error)
