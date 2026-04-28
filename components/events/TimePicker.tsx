'use client'

/**
 * 12-hour AM/PM time picker.
 * Accepts and emits time as "HH:MM" (24-hour) strings so existing form
 * state and submission logic are unchanged.
 */

interface TimePickerProps {
  value: string // "HH:MM" 24-hour, e.g. "14:30"
  onChange: (value: string) => void // emits "HH:MM" 24-hour
  required?: boolean
  className?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1) // 1–12
const MINUTES = ['00', '15', '30', '45']

function to12Hour(hhmm: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const [h, m] = hhmm.split(':').map(Number)
  const period: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour: String(hour12), minute: String(m).padStart(2, '0'), period }
}

function to24Hour(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = parseInt(hour)
  if (period === 'AM' && h === 12) h = 0
  if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

export function TimePicker({ value, onChange, required, className = '' }: TimePickerProps) {
  const { hour, minute, period } = value
    ? to12Hour(value)
    : { hour: '12', minute: '00', period: 'AM' as const }

  const handleChange = (newHour: string, newMinute: string, newPeriod: 'AM' | 'PM') => {
    onChange(to24Hour(newHour, newMinute, newPeriod))
  }

  const selectClass =
    'rounded-md border border-gray-300 px-2 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:border-blue-500'

  return (
    <div className={`flex gap-1 ${className}`}>
      <select
        value={hour}
        onChange={(e) => handleChange(e.target.value, minute, period as 'AM' | 'PM')}
        required={required}
        className={`${selectClass} w-16`}
        aria-label="Hour"
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <select
        value={minute}
        onChange={(e) => handleChange(hour, e.target.value, period as 'AM' | 'PM')}
        className={`${selectClass} w-16`}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={period}
        onChange={(e) => handleChange(hour, minute, e.target.value as 'AM' | 'PM')}
        className={`${selectClass} w-16`}
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
