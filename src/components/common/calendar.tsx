"use client"

import { useState } from "react"
import { 
  Box, 
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Flex,
  Text,
  Avatar,
  Grid,
  GridItem,
  AvatarBadge,
  HStack,
  VStack,
  Badge,
  useColorModeValue
} from "@chakra-ui/react"
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons"

interface CalendarEvent {
  date: number     // Day of the month
  month: number    // Month (0-11)
  year: number     // Year
  title: string
  opponent: string
  location: string
  isHome: boolean
}

interface CalendarProps {
  events?: CalendarEvent[]
  className?: string
}

export default function Calendar({ events = [], className = "" }: CalendarProps) {
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

  // Previous month's last days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()

  // Calculate days to display from previous month
  const prevMonthDaysToShow = firstDayOfMonth

  // Calculate total cells needed (previous month days + current month days)
  const totalCells = prevMonthDaysToShow + daysInMonth

  // Calculate rows needed (ceil to ensure we have enough rows)
  const rows = Math.ceil(totalCells / 7)

  // Calculate days to display from next month
  const nextMonthDaysToShow = rows * 7 - totalCells

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Find events for the selected date - requiring exact day, month, and year match
  const getEventsForDate = (date: number) => {
    return safeEvents.filter((event) => 
      event.date === date && 
      event.month === currentMonth && 
      event.year === currentYear
    );
  }

  // Check if a date has events - requiring exact day, month, and year match
  const hasEvents = (date: number) => {
    return safeEvents.some((event) => 
      event.date === date && 
      event.month === currentMonth && 
      event.year === currentYear
    );
  }

  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []
  
  // Style values
  const dayHoverBg = useColorModeValue("gray.100", "gray.700")
  const selectedDayBg = useColorModeValue("gray.100", "gray.700")
  const inactiveDayColor = useColorModeValue("gray.400", "gray.600")
  const eventDotColor = useColorModeValue("blue.500", "blue.300")

  return (
    <Card variant="outline" className={className}>
      <CardHeader pb={0}>
        <Heading size="md">Calendar</Heading>
      </CardHeader>
      <CardBody>
        <Flex justify="space-between" align="center" mb={4}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToPreviousMonth}
            leftIcon={<ChevronLeftIcon />}
          >
            Prev
          </Button>
          <Text fontWeight="medium">
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goToNextMonth}
            rightIcon={<ChevronRightIcon />}
          >
            Next
          </Button>
        </Flex>

        {/* Day headers */}
        <Grid templateColumns="repeat(7, 1fr)" gap={1} textAlign="center" mb={2}>
          <GridItem py={1} fontWeight="medium" fontSize="xs">SU</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">MO</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">TU</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">WE</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">TH</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">FR</GridItem>
          <GridItem py={1} fontWeight="medium" fontSize="xs">SA</GridItem>
        </Grid>

        {/* Calendar grid */}
        <Grid templateColumns="repeat(7, 1fr)" gap={1} textAlign="center">
          {/* Previous month days */}
          {Array.from({ length: prevMonthDaysToShow }).map((_, index) => (
            <GridItem 
              key={`prev-${index}`} 
              py={1} 
              color={inactiveDayColor}
              fontSize="xs"
            >
              {prevMonthDays - prevMonthDaysToShow + index + 1}
            </GridItem>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1
            const hasEventForDay = hasEvents(day)

            return (
              <GridItem
                key={`current-${index}`}
                py={1}
                position="relative"
                cursor="pointer"
                _hover={{ bg: dayHoverBg }}
                bg={selectedDate === day ? selectedDayBg : undefined}
                borderRadius="md"
                onClick={() => setSelectedDate(day)}
                fontSize="xs"
              >
                {day}
                {hasEventForDay && (
                  <Box 
                    position="absolute" 
                    bottom="1px" 
                    left="50%" 
                    transform="translateX(-50%)" 
                    w="4px" 
                    h="4px" 
                    borderRadius="full" 
                    bg={eventDotColor} 
                  />
                )}
              </GridItem>
            )
          })}

          {/* Next month days */}
          {Array.from({ length: nextMonthDaysToShow }).map((_, index) => (
            <GridItem 
              key={`next-${index}`} 
              py={1} 
              color={inactiveDayColor}
              fontSize="xs"
            >
              {index + 1}
            </GridItem>
          ))}
        </Grid>

        {/* Event details section */}
        {selectedDate && selectedDateEvents.length > 0 && (
          <Box mt={6} borderWidth="1px" borderRadius="md" p={3}>
            <Heading size="sm" mb={2}>
              {monthNames[currentMonth]} {selectedDate}, {currentYear} Games
            </Heading>
            <Text fontSize="xs" color="gray.500" mb={3}>({selectedDateEvents.length} Games)</Text>

            <VStack spacing={3} align="stretch">
              {selectedDateEvents.map((event, index) => (
                <Flex key={index} align="center">
                  <Avatar size="sm" bg={event.isHome ? "green.100" : "purple.100"} mr={3}>
                    <Text fontWeight="bold" color={event.isHome ? "green.800" : "purple.800"}>
                      {event.isHome ? "H" : "A"}
                    </Text>
                  </Avatar>
                  <Box>
                    <Text fontWeight="medium" fontSize="sm">{event.title || `vs ${event.opponent}`}</Text>
                    <HStack spacing={2} fontSize="xs" color="gray.500">
                      <Text>{event.location}</Text>
                      <Badge colorScheme={event.isHome ? "green" : "purple"} size="sm">
                        {event.isHome ? "Home" : "Away"}
                      </Badge>
                    </HStack>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}
      </CardBody>
    </Card>
  )
}