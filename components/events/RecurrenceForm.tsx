'use client'

/**
 * RecurrenceForm - Configuration UI for recurring events
 *
 * Supports patterns: DAILY, WEEKLY, MONTHLY, WEEKDAYS
 */

import React, { useState, useEffect } from 'react'
import { RecurrencePattern, RecurrenceConfig } from '@/types/event'

interface RecurrenceFormProps {
  isRecurring: boolean
  onRecurringChange: (isRecurring: boolean) => void
  pattern: RecurrencePattern
  onPatternChange: (pattern: RecurrencePattern) => void
  config: RecurrenceConfig
  onConfigChange: (config: RecurrenceConfig) => void
  seriesEndDate: string
  onSeriesEndDateChange: (date: string) => void
  startDate: string // Used to calculate max end date (1 year)
}

const PATTERN_OPTIONS: { value: RecurrencePattern; label: string; description: string }[] = [
  { value: 'WEEKLY', label: 'Weekly', description: 'On specific days of the week' },
  { value: 'DAILY', label: 'Daily', description: 'Every day or every N days' },
  { value: 'MONTHLY', label: 'Monthly', description: 'Same day each month' },
  { value: 'WEEKDAYS', label: 'Weekdays', description: 'Monday through Friday' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FULL_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
const WEEK_ORDINALS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: 'Last' },
]

export default function RecurrenceForm({
  isRecurring,
  onRecurringChange,
  pattern,
  onPatternChange,
  config,
  onConfigChange,
  seriesEndDate,
  onSeriesEndDateChange,
  startDate,
}: RecurrenceFormProps) {
  // Monthly sub-pattern: 'dayOfMonth' or 'nthWeekday'
  const [monthlyType, setMonthlyType] = useState<'dayOfMonth' | 'nthWeekday'>(
    config.weekOfMonth !== undefined ? 'nthWeekday' : 'dayOfMonth'
  )

  // Calculate max end date (1 year from start)
  const getMaxEndDate = () => {
    if (!startDate) return ''
    const start = new Date(startDate)
    start.setFullYear(start.getFullYear() + 1)
    return start.toISOString().split('T')[0]
  }

  // Default end date to 3 months from start if not set
  useEffect(() => {
    if (isRecurring && !seriesEndDate && startDate) {
      const defaultEnd = new Date(startDate)
      defaultEnd.setMonth(defaultEnd.getMonth() + 3)
      onSeriesEndDateChange(defaultEnd.toISOString().split('T')[0])
    }
  }, [isRecurring, startDate])

  // Update config when monthly type changes
  useEffect(() => {
    if (pattern === 'MONTHLY') {
      if (monthlyType === 'dayOfMonth') {
        // Default to 15th if not set
        onConfigChange({
          dayOfMonth: config.dayOfMonth || 15,
        })
      } else {
        // Default to 1st Saturday if not set
        onConfigChange({
          weekOfMonth: config.weekOfMonth || 1,
          dayOfWeek: config.dayOfWeek !== undefined ? config.dayOfWeek : 6,
        })
      }
    }
  }, [monthlyType, pattern])

  const handleDayOfWeekToggle = (day: number) => {
    const currentDays = config.daysOfWeek || []
    let newDays: number[]

    if (currentDays.includes(day)) {
      newDays = currentDays.filter((d) => d !== day)
    } else {
      newDays = [...currentDays, day].sort((a, b) => a - b)
    }

    // Ensure at least one day is selected
    if (newDays.length === 0) {
      return
    }

    onConfigChange({ ...config, daysOfWeek: newDays })
  }

  if (!isRecurring) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recurring Event</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Create a series of repeating events
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => onRecurringChange(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 shadow-sm dark:border-blue-800 dark:bg-blue-950">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recurring Event</h2>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
            This event will repeat based on your settings
          </p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="peer sr-only"
          />
          <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
        </label>
      </div>

      <div className="space-y-4">
        {/* Pattern Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Repeat Pattern
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PATTERN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onPatternChange(option.value)
                  // Reset config when pattern changes
                  if (option.value === 'WEEKLY') {
                    onConfigChange({ daysOfWeek: [6] }) // Default to Saturday
                  } else if (option.value === 'DAILY') {
                    onConfigChange({ interval: 1 })
                  } else if (option.value === 'MONTHLY') {
                    onConfigChange({ dayOfMonth: 15 })
                    setMonthlyType('dayOfMonth')
                  } else {
                    onConfigChange({})
                  }
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  pattern === option.value
                    ? 'border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-200'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {PATTERN_OPTIONS.find((p) => p.value === pattern)?.description}
          </p>
        </div>

        {/* Pattern-specific Configuration */}
        {pattern === 'WEEKLY' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeat on
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayOfWeekToggle(index)}
                  className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                    config.daysOfWeek?.includes(index)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600 dark:hover:bg-gray-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {pattern === 'DAILY' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={config.interval || 1}
                onChange={(e) =>
                  onConfigChange({ ...config, interval: parseInt(e.target.value) || 1 })
                }
                className="w-20 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="text-gray-700 dark:text-gray-300">day(s)</span>
            </div>
          </div>
        )}

        {pattern === 'MONTHLY' && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="monthlyType"
                  checked={monthlyType === 'dayOfMonth'}
                  onChange={() => setMonthlyType('dayOfMonth')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">On day</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="monthlyType"
                  checked={monthlyType === 'nthWeekday'}
                  onChange={() => setMonthlyType('nthWeekday')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">On the</span>
              </label>
            </div>

            {monthlyType === 'dayOfMonth' ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-700 dark:text-gray-300">Day</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={config.dayOfMonth || 15}
                  onChange={(e) => onConfigChange({ dayOfMonth: parseInt(e.target.value) || 15 })}
                  className="w-20 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-gray-700 dark:text-gray-300">of each month</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={config.weekOfMonth || 1}
                  onChange={(e) =>
                    onConfigChange({
                      weekOfMonth: parseInt(e.target.value),
                      dayOfWeek: config.dayOfWeek !== undefined ? config.dayOfWeek : 6,
                    })
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  {WEEK_ORDINALS.map((ord) => (
                    <option key={ord.value} value={ord.value}>
                      {ord.label}
                    </option>
                  ))}
                </select>
                <select
                  value={config.dayOfWeek !== undefined ? config.dayOfWeek : 6}
                  onChange={(e) =>
                    onConfigChange({
                      weekOfMonth: config.weekOfMonth || 1,
                      dayOfWeek: parseInt(e.target.value),
                    })
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                >
                  {FULL_DAY_NAMES.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
                <span className="text-gray-700 dark:text-gray-300">of each month</span>
              </div>
            )}
          </div>
        )}

        {pattern === 'WEEKDAYS' && (
          <div className="rounded-md bg-blue-100 p-3 dark:bg-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Events will occur every weekday (Monday through Friday)
            </p>
          </div>
        )}

        {/* Series End Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Series ends on
          </label>
          <input
            type="date"
            value={seriesEndDate}
            onChange={(e) => onSeriesEndDateChange(e.target.value)}
            min={startDate}
            max={getMaxEndDate()}
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum 1 year from start date
          </p>
        </div>
      </div>
    </div>
  )
}
