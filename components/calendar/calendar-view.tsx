"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react"
import Link from "next/link"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  all_day: boolean
  event_type: string
  status: string
  job?: {
    job_number: string
    client: {
      first_name: string
      last_name: string
    }
  }
  assigned_user?: {
    first_name: string
    last_name: string
  }
}

interface CalendarViewProps {
  events: CalendarEvent[]
  userRole?: string
}

export default function CalendarView({ events, userRole }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day">("month")

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "job":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "appointment":
        return "bg-green-100 text-green-800 border-green-200"
      case "maintenance":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get events for current month
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const monthEvents = events.filter((event) => {
    const eventDate = new Date(event.start_time)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  })

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getEventsForDay = (day: number) => {
    return monthEvents.filter((event) => {
      const eventDate = new Date(event.start_time)
      return eventDate.getDate() === day
    })
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{formatDate(currentDate)}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex rounded-lg border">
            {["month", "week", "day"].map((viewType) => (
              <Button
                key={viewType}
                variant={view === viewType ? "default" : "ghost"}
                size="sm"
                onClick={() => setView(viewType as "month" | "week" | "day")}
                className="rounded-none first:rounded-l-lg last:rounded-r-lg"
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </Button>
            ))}
          </div>

          {(userRole === "admin" || userRole === "manager") && (
            <Button asChild>
              <Link href="/calendar/new">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Link>
            </Button>
          )}
        </div>
      </div>

      {view === "month" && (
        <Card>
          <CardContent className="p-0">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-4 text-center font-medium text-gray-500 border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => (
                <div key={index} className="min-h-[120px] p-2 border-r border-b last:border-r-0 last:border-b-0">
                  {day && (
                    <>
                      <div className="font-medium text-gray-900 mb-2">{day}</div>
                      <div className="space-y-1">
                        {getEventsForDay(day)
                          .slice(0, 3)
                          .map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded border ${getEventTypeColor(event.event_type)} cursor-pointer hover:opacity-80`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {!event.all_day && (
                                <div className="text-xs opacity-75">{formatTime(event.start_time)}</div>
                              )}
                            </div>
                          ))}
                        {getEventsForDay(day).length > 3 && (
                          <div className="text-xs text-gray-500">+{getEventsForDay(day).length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event List View for Week/Day */}
      {(view === "week" || view === "day") && (
        <div className="grid grid-cols-1 gap-4">
          {monthEvents
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{event.title}</h3>
                        <Badge className={getEventTypeColor(event.event_type)} variant="secondary">
                          {event.event_type}
                        </Badge>
                        <Badge className={getStatusColor(event.status)} variant="secondary">
                          {event.status}
                        </Badge>
                      </div>

                      {event.description && <p className="text-sm text-gray-600 mb-2">{event.description}</p>}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(event.start_time).toLocaleDateString()}
                        </div>
                        {!event.all_day && (
                          <div>
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </div>
                        )}
                      </div>

                      {event.job && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Job:</span> {event.job.job_number} -{" "}
                          {event.job.client.first_name} {event.job.client.last_name}
                        </div>
                      )}

                      {event.assigned_user && (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Assigned:</span> {event.assigned_user.first_name}{" "}
                          {event.assigned_user.last_name}
                        </div>
                      )}
                    </div>

                    {(userRole === "admin" || userRole === "manager") && (
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/calendar/events/${event.id}`}>Edit</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

          {monthEvents.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
                <p className="text-gray-600">No events found for this time period.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
