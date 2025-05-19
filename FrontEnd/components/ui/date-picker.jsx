"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function DatePicker({ value, onChange, className, placeholder = "Select date" }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(value || null)
  const [year, setYear] = React.useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())
  const [month, setMonth] = React.useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
  const containerRef = React.useRef(null)

  // Close the date picker when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = []
    const prevMonthDays = getDaysInMonth(year, month - 1)

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      })
    }

    // Next month days
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const handleSelectDate = (day) => {
    const date = new Date(day.year, day.month, day.day)
    setSelectedDate(date)
    onChange && onChange(date)
    setIsOpen(false)
  }

  const isToday = (day) => {
    const today = new Date()
    return day.day === today.getDate() && day.month === today.getMonth() && day.year === today.getFullYear()
  }

  const isSelected = (day) => {
    if (!selectedDate) return false
    return (
      day.day === selectedDate.getDate() &&
      day.month === selectedDate.getMonth() &&
      day.year === selectedDate.getFullYear()
    )
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        variant="outline"
        className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate ? format(selectedDate, "PPP") : placeholder}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-full bg-popover p-2 rounded-md border shadow-md">
          <div className="flex justify-between items-center mb-2">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              &lt;
            </Button>
            <div className="font-medium">
              {monthNames[month]} {year}
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              &gt;
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1 mt-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                className={cn(
                  "h-8 w-8 rounded-md flex items-center justify-center text-sm",
                  !day.isCurrentMonth && "text-muted-foreground opacity-50",
                  isToday(day) && "bg-accent text-accent-foreground",
                  isSelected(day) && "bg-primary text-primary-foreground",
                  !isSelected(day) && "hover:bg-muted",
                )}
                onClick={() => handleSelectDate(day)}
              >
                {day.day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple date input that uses the browser's native date picker
export function DateInput({ value, onChange, className, ...props }) {
  const handleChange = (e) => {
    const date = e.target.value ? new Date(e.target.value) : null
    onChange && onChange(date)
  }

  const formattedValue = value ? format(value, "yyyy-MM-dd") : ""

  return <Input type="date" value={formattedValue} onChange={handleChange} className={className} {...props} />
}
