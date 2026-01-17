/**
 * Authentication Helper Functions
 * Utilities for email detection and username generation
 */

/**
 * Check if a string looks like an email address
 */
export function isEmail(input: string): boolean {
  return input.includes('@') && input.includes('.')
}

/**
 * Generate a clean username from an email address
 * Example: "mal.davies14@gmail.com" → "mal_davies14"
 *
 * Rules:
 * - Extract the part before @
 * - Replace dots with underscores
 * - Remove any other invalid characters
 * - Ensure minimum 3 characters
 */
export function generateUsernameFromEmail(email: string): string {
  // Get the part before @
  const localPart = email.split('@')[0]

  // Replace dots with underscores, remove other invalid chars
  let username = localPart
    .replace(/\./g, '_') // Replace dots with underscores
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove invalid characters
    .toLowerCase()

  // Ensure minimum length
  if (username.length < 3) {
    username = username + '_user'
  }

  return username
}

/**
 * Process user input and detect if it's an email
 * Returns appropriate values for username and email fields
 */
export function processIdentifierInput(input: string): {
  isEmail: boolean
  suggestedUsername: string
  email: string | null
} {
  const trimmed = input.trim()

  if (isEmail(trimmed)) {
    return {
      isEmail: true,
      suggestedUsername: generateUsernameFromEmail(trimmed),
      email: trimmed.toLowerCase(),
    }
  }

  return {
    isEmail: false,
    suggestedUsername: trimmed.toLowerCase(),
    email: null,
  }
}

/**
 * Check if a username is available (client-side validation only)
 * Actual uniqueness check happens on the server
 */
export function isValidUsername(username: string): {
  valid: boolean
  error: string | null
} {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username must be at most 50 characters' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    }
  }

  return { valid: true, error: null }
}
