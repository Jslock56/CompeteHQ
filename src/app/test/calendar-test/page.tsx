'use client'

import React, { useState } from 'react'
import Calendar from '@/components/common/calendar'
import { Box, Container, Heading, VStack, Button } from '@chakra-ui/react'

// Sample calendar events
const sampleEvents = [
  {
    date: 15,  // Events are for the 15th of the current month
    guest: "John Doe",
    nights: 2,
    guests: 3
  },
  {
    date: 15,
    guest: "Jane Smith",
    nights: 1,
    guests: 2
  },
  {
    date: 20,
    guest: "Bob Johnson",
    nights: 3,
    guests: 4
  }
]

export default function CalendarTestPage() {
  const [events, setEvents] = useState(sampleEvents)
  
  // Function to add a random event
  const addRandomEvent = () => {
    const randomDay = Math.floor(Math.random() * 28) + 1  // Random day between 1-28
    const randomGuest = [
      "Alex Taylor", 
      "Sam Parker", 
      "Chris Morgan", 
      "Jordan Lee",
      "Casey Brown"
    ][Math.floor(Math.random() * 5)]
    
    const newEvent = {
      date: randomDay,
      guest: randomGuest,
      nights: Math.floor(Math.random() * 5) + 1,
      guests: Math.floor(Math.random() * 4) + 1
    }
    
    setEvents([...events, newEvent])
  }
  
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="lg">Calendar Component Test</Heading>
        
        <Box mb={4}>
          <Button onClick={addRandomEvent} colorScheme="blue">
            Add Random Event
          </Button>
        </Box>
        
        <Box border="1px" borderColor="gray.200" borderRadius="md" maxW="md">
          <Calendar events={events} />
        </Box>
      </VStack>
    </Container>
  )
}