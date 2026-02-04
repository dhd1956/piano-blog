/**
 * Event Series Date Generation Utility
 *
 * Generates event occurrence dates based on recurrence patterns.
 * Supports DAILY, WEEKLY, MONTHLY, and WEEKDAYS patterns.
 */

import { RecurrencePattern, RecurrenceConfig } from '@/types/event'

// Maximum limits to prevent runaway generation
const MAX_OCCURRENCES = 365 // Maximum events to generate
const MAX_SERIES_DAYS = 366 // Maximum 1 year + 1 day

export interface DateGeneratorOptions {
  pattern: RecurrencePattern
  config: RecurrenceConfig
  startDate: Date // Series start date
  endDate: Date // Series end date
  startTime: string // "19:00" - time portion
  endTime: string // "21:00" - time portion
  timezone: string
}

export interface GeneratedEvent {
  startDate: Date
  endDate: Date
  occurrence: number // 1-based occurrence number
}

/**
 * Parse time string "HH:MM" into hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours: hours || 0, minutes: minutes || 0 }
}

/**
 * Combine a date with a time string to create a full DateTime
 */
function combineDateAndTime(date: Date, time: string): Date {
  const { hours, minutes } = parseTime(time)
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/**
 * Check if a date is a weekday (Monday-Friday)
 */
function isWeekday(date: Date): boolean {
  const day = getDayOfWeek(date)
  return day >= 1 && day <= 5
}

/**
 * Get the Nth occurrence of a weekday in a month
 * weekOfMonth: 1-4 (or 5 for "last")
 * dayOfWeek: 0-6 (Sunday-Saturday)
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number
): Date | null {
  // Start from the first day of the month
  const firstOfMonth = new Date(year, month, 1)
  const firstDayOfWeek = firstOfMonth.getDay()

  // Calculate the first occurrence of the target day
  let dayOffset = dayOfWeek - firstDayOfWeek
  if (dayOffset < 0) dayOffset += 7

  const firstOccurrence = 1 + dayOffset

  // Handle "last" week (weekOfMonth = 5)
  if (weekOfMonth === 5) {
    // Find the last occurrence
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let lastOccurrence = firstOccurrence
    while (lastOccurrence + 7 <= daysInMonth) {
      lastOccurrence += 7
    }
    return new Date(year, month, lastOccurrence)
  }

  // Calculate the Nth occurrence
  const targetDay = firstOccurrence + (weekOfMonth - 1) * 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  if (targetDay > daysInMonth) {
    return null // This occurrence doesn't exist in this month
  }

  return new Date(year, month, targetDay)
}

/**
 * Generate DAILY pattern dates
 */
function generateDailyDates(options: DateGeneratorOptions): Date[] {
  const { config, startDate, endDate } = options
  const interval = config.interval || 1
  const dates: Date[] = []

  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const endDateNormalized = new Date(endDate)
  endDateNormalized.setHours(23, 59, 59, 999)

  while (currentDate <= endDateNormalized && dates.length < MAX_OCCURRENCES) {
    dates.push(new Date(currentDate))
    currentDate = addDays(currentDate, interval)
  }

  return dates
}

/**
 * Generate WEEKLY pattern dates
 */
function generateWeeklyDates(options: DateGeneratorOptions): Date[] {
  const { config, startDate, endDate } = options
  const daysOfWeek = config.daysOfWeek || [getDayOfWeek(startDate)]
  const dates: Date[] = []

  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const endDateNormalized = new Date(endDate)
  endDateNormalized.setHours(23, 59, 59, 999)

  while (currentDate <= endDateNormalized && dates.length < MAX_OCCURRENCES) {
    if (daysOfWeek.includes(getDayOfWeek(currentDate))) {
      dates.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Generate MONTHLY pattern dates
 */
function generateMonthlyDates(options: DateGeneratorOptions): Date[] {
  const { config, startDate, endDate } = options
  const dates: Date[] = []

  const endDateNormalized = new Date(endDate)
  endDateNormalized.setHours(23, 59, 59, 999)

  let currentYear = startDate.getFullYear()
  let currentMonth = startDate.getMonth()

  // Limit to 12 months max
  const maxMonths = 12

  for (let i = 0; i < maxMonths && dates.length < MAX_OCCURRENCES; i++) {
    let targetDate: Date | null = null

    if (config.dayOfMonth !== undefined) {
      // Fixed day of month (e.g., 15th of each month)
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      const day = Math.min(config.dayOfMonth, daysInMonth) // Handle months with fewer days
      targetDate = new Date(currentYear, currentMonth, day)
    } else if (config.weekOfMonth !== undefined && config.dayOfWeek !== undefined) {
      // Nth weekday of month (e.g., 1st Saturday)
      targetDate = getNthWeekdayOfMonth(
        currentYear,
        currentMonth,
        config.weekOfMonth,
        config.dayOfWeek
      )
    }

    if (targetDate && targetDate >= startDate && targetDate <= endDateNormalized) {
      dates.push(targetDate)
    }

    // Move to next month
    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear++
    }
  }

  return dates
}

/**
 * Generate WEEKDAYS pattern dates (Monday-Friday)
 */
function generateWeekdaysDates(options: DateGeneratorOptions): Date[] {
  const { startDate, endDate } = options
  const dates: Date[] = []

  let currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const endDateNormalized = new Date(endDate)
  endDateNormalized.setHours(23, 59, 59, 999)

  while (currentDate <= endDateNormalized && dates.length < MAX_OCCURRENCES) {
    if (isWeekday(currentDate)) {
      dates.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

/**
 * Main function to generate event dates based on recurrence pattern
 */
export function generateEventDates(options: DateGeneratorOptions): GeneratedEvent[] {
  const { pattern, startTime, endTime } = options

  // Validate date range
  const daysDiff = Math.ceil(
    (options.endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysDiff > MAX_SERIES_DAYS) {
    throw new Error(`Series duration cannot exceed ${MAX_SERIES_DAYS} days (1 year)`)
  }

  let dates: Date[]

  switch (pattern) {
    case 'DAILY':
      dates = generateDailyDates(options)
      break
    case 'WEEKLY':
      dates = generateWeeklyDates(options)
      break
    case 'MONTHLY':
      dates = generateMonthlyDates(options)
      break
    case 'WEEKDAYS':
      dates = generateWeekdaysDates(options)
      break
    default:
      throw new Error(`Unknown recurrence pattern: ${pattern}`)
  }

  // Convert dates to GeneratedEvent objects with full datetime
  return dates.map((date, index) => ({
    startDate: combineDateAndTime(date, startTime),
    endDate: combineDateAndTime(date, endTime),
    occurrence: index + 1,
  }))
}

/**
 * Validate recurrence configuration
 */
export function validateRecurrenceConfig(
  pattern: RecurrencePattern,
  config: RecurrenceConfig
): string | null {
  switch (pattern) {
    case 'DAILY':
      if (config.interval !== undefined && (config.interval < 1 || config.interval > 365)) {
        return 'Daily interval must be between 1 and 365'
      }
      break

    case 'WEEKLY':
      if (!config.daysOfWeek || config.daysOfWeek.length === 0) {
        return 'Weekly pattern requires at least one day of the week'
      }
      if (config.daysOfWeek.some((d) => d < 0 || d > 6)) {
        return 'Days of week must be between 0 (Sunday) and 6 (Saturday)'
      }
      break

    case 'MONTHLY':
      if (config.dayOfMonth !== undefined) {
        if (config.dayOfMonth < 1 || config.dayOfMonth > 31) {
          return 'Day of month must be between 1 and 31'
        }
      } else if (config.weekOfMonth !== undefined && config.dayOfWeek !== undefined) {
        if (config.weekOfMonth < 1 || config.weekOfMonth > 5) {
          return 'Week of month must be between 1 and 5 (5 = last)'
        }
        if (config.dayOfWeek < 0 || config.dayOfWeek > 6) {
          return 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
        }
      } else {
        return 'Monthly pattern requires either dayOfMonth or weekOfMonth+dayOfWeek'
      }
      break

    case 'WEEKDAYS':
      // No config needed
      break

    default:
      return `Unknown recurrence pattern: ${pattern}`
  }

  return null
}

/**
 * Get human-readable description of recurrence pattern
 */
export function getRecurrenceDescription(
  pattern: RecurrencePattern,
  config: RecurrenceConfig
): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const ordinals = ['', '1st', '2nd', '3rd', '4th', 'last']

  switch (pattern) {
    case 'DAILY':
      if (config.interval === 1 || !config.interval) {
        return 'Every day'
      }
      return `Every ${config.interval} days`

    case 'WEEKLY':
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const days = config.daysOfWeek.map((d) => dayNames[d]).join(', ')
        return `Weekly on ${days}`
      }
      return 'Weekly'

    case 'MONTHLY':
      if (config.dayOfMonth !== undefined) {
        return `Monthly on the ${config.dayOfMonth}${getOrdinalSuffix(config.dayOfMonth)}`
      }
      if (config.weekOfMonth !== undefined && config.dayOfWeek !== undefined) {
        return `Monthly on the ${ordinals[config.weekOfMonth]} ${dayNames[config.dayOfWeek]}`
      }
      return 'Monthly'

    case 'WEEKDAYS':
      return 'Every weekday (Monday-Friday)'

    default:
      return 'Custom recurrence'
  }
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

/**
 * Calculate the next occurrence date from a series
 */
export function getNextOccurrence(
  options: DateGeneratorOptions,
  afterDate: Date = new Date()
): Date | null {
  const events = generateEventDates(options)
  const futureEvents = events.filter((e) => e.startDate > afterDate)
  return futureEvents.length > 0 ? futureEvents[0].startDate : null
}

/**
 * Validate that series end date is within 1 year of start date
 */
export function validateSeriesDuration(startDate: Date, endDate: Date): string | null {
  const oneYearFromStart = new Date(startDate)
  oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1)

  if (endDate > oneYearFromStart) {
    return 'Series duration cannot exceed 1 year'
  }

  if (endDate <= startDate) {
    return 'End date must be after start date'
  }

  return null
}
