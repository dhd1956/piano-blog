/**
 * Temporary debug endpoint - DELETE AFTER TESTING
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    EMAIL_FROM: process.env.EMAIL_FROM || '(not set)',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '(not set)',
    NODE_ENV: process.env.NODE_ENV || '(not set)',
  })
}
