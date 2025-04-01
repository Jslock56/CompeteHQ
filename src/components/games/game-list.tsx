"use client"

import { useState } from "react"
import Link from "next/link"
import NextLink from "next/link"
import { 
  SearchIcon, 
  AddIcon, 
  CalendarIcon, 
  RepeatIcon, 
  ChevronDownIcon, 
  EditIcon, 
  DeleteIcon 
} from "@chakra-ui/icons"
import { FaMapMarkerAlt } from "react-icons/fa"
import { format } from "date-fns"
import type { Game } from "../../types/game"
import { 
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Skeleton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
  Heading,
  VStack,
  Text,
  Flex,
  HStack,
  Select,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@chakra-ui/react"

interface GameListProps {
  games: Game[]
  title: string
  isLoading?: boolean
  error?: string | null
  onDeleteGame?: (gameId: string) => void
  isUpcoming?: boolean
  teamId?: string
  showEmptyState?: boolean
}

export default function GameList({
  games,
  title,
  isLoading = false,
  error = null,
  onDeleteGame,
  isUpcoming = false,
  teamId,
  showEmptyState = true,
}: GameListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [dayFilter, setDayFilter] = useState("")
  const [timeFilter, setTimeFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [opponentFilter, setOpponentFilter] = useState("")

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setDayFilter("")
    setTimeFilter("")
    setLocationFilter("")
    setOpponentFilter("")
  }

  // Apply filters to games
  const filteredGames = games.filter((game) => {
    const gameDate = new Date(game.date)
    const matchesSearch =
      !searchQuery.trim() ||
      game.opponent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDay =
      !dayFilter || dayFilter === new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(gameDate)

    const matchesTime = !timeFilter // Implement time filtering logic if needed

    const matchesLocation =
      !locationFilter || (locationFilter === "home" && game.isHome) || (locationFilter === "away" && !game.isHome)

    const matchesOpponent = !opponentFilter || game.opponent.toLowerCase().includes(opponentFilter.toLowerCase())

    return matchesSearch && matchesDay && matchesTime && matchesLocation && matchesOpponent
  })

  if (isLoading) {
    return (
      <Card mb={6} variant="outline" borderColor="gray.200">
        <CardHeader pb={2}>
          <Skeleton height="24px" width="200px" mb={2} />
          <Skeleton height="40px" width="100%" />
        </CardHeader>
        <CardBody>
          <Skeleton height="60px" width="100%" mb={3} />
          <Skeleton height="60px" width="100%" mb={3} />
          <Skeleton height="60px" width="100%" />
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card mb={6} borderColor="red.200" bg="red.50">
        <CardBody>
          <Flex alignItems="center" color="red.700">
            <Text mr={2}>⚠️</Text>
            <Text>{error}</Text>
          </Flex>
        </CardBody>
      </Card>
    )
  }

  if (games.length === 0 && showEmptyState) {
    return (
      <Card mb={6} variant="outline" borderColor="gray.200">
        <CardHeader>
          <Flex alignItems="center" justifyContent="space-between" pb={2}>
            <Heading size="md">{title}</Heading>
            {isUpcoming && teamId && (
              <Button
                as={Link}
                href={`/games/new?teamId=${teamId}`}
                size="sm"
                colorScheme="blue"
                leftIcon={<AddIcon boxSize={4} />}
              >
                Add Game
              </Button>
            )}
          </Flex>
        </CardHeader>
        <CardBody textAlign="center" py={8}>
          <Text color="gray.500" mb={6}>
            {isUpcoming 
              ? "Get started by scheduling your first game." 
              : "Past games will appear here when available."
            }
          </Text>
          {isUpcoming && teamId && (
            <Button
              as={Link}
              href={`/games/new?teamId=${teamId}`}
              leftIcon={<AddIcon boxSize={4} />}
              colorScheme="blue"
            >
              Schedule Game
            </Button>
          )}
        </CardBody>
      </Card>
    )
  }

  return (
    <Card mb={6} variant="outline" borderColor="gray.200" shadow="sm">
      <CardHeader pb={4}>
        <Flex alignItems="center" justifyContent="space-between" mb={4}>
          <Heading size="md">{title}</Heading>
          {isUpcoming && teamId && (
            <Button
              as={Link}
              href={`/games/new?teamId=${teamId}`}
              size="sm"
              colorScheme="blue"
              leftIcon={<AddIcon boxSize={4} />}
            >
              Add Game
            </Button>
          )}
        </Flex>

        {/* Search and filters */}
        <Box mb={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="search"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Box>

        <Flex wrap="wrap" gap={2}>
          <Select
            placeholder="Day of the Week"
            size="sm"
            maxW="180px"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
          >
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </Select>

          <Select
            placeholder="Time"
            size="sm"
            maxW="150px"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </Select>

          <Select
            placeholder="Home/Away"
            size="sm"
            maxW="150px"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="home">Home</option>
            <option value="away">Away</option>
          </Select>

          <Select
            placeholder="Opponent"
            size="sm"
            maxW="180px"
            value={opponentFilter}
            onChange={(e) => setOpponentFilter(e.target.value)}
          >
            {/* Dynamically generate options from unique opponents */}
            {Array.from(new Set(games.map((game) => game.opponent))).map((opponent) => (
              <option key={opponent} value={opponent}>
                {opponent}
              </option>
            ))}
          </Select>

          {(dayFilter || timeFilter || locationFilter || opponentFilter || searchQuery) && (
            <IconButton
              aria-label="Clear filters"
              icon={<RepeatIcon />}
              size="sm"
              variant="ghost"
              onClick={resetFilters}
            />
          )}
        </Flex>
      </CardHeader>

      <CardBody p={0}>
        {/* Column headers */}
        <Flex
          bg="gray.50"
          py={2}
          px={4}
          borderBottom="1px solid"
          borderColor="gray.200"
          fontWeight="medium"
          fontSize="sm"
          color="gray.600"
        >
          <Box w="60px" mr={4}>
            Date
          </Box>
          <Box w="100px" mr={4}>
            Time
          </Box>
          <Box w="80px" mr={4}>
            Location
          </Box>
          <Box flex="1">Opponent</Box>
          <Box w="120px" textAlign="center" fontWeight="medium" color="gray.600">
            Lineup
          </Box>
          <Box w="200px" display={{ base: "none", md: "block" }}>
            Venue
          </Box>
          <Box w="100px" textAlign="right">
            Actions
          </Box>
        </Flex>

        {filteredGames.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text color="gray.500">No games match your search criteria.</Text>
            <Button size="sm" variant="outline" mt={4} onClick={resetFilters}>
              Clear Filters
            </Button>
          </Box>
        ) : (
          filteredGames.map((game) => <GameItem key={game.id} game={game} onDelete={onDeleteGame} />)
        )}
      </CardBody>
    </Card>
  )
}

interface GameItemProps {
  game: Game
  onDelete?: (gameId: string) => void
}

function GameItem({ game, onDelete }: GameItemProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Format date and time
  const gameDate = new Date(game.date)
  const formattedTime = format(gameDate, "h:mm a")
  const dayOfWeek = format(gameDate, "EEE")
  const dayOfMonth = format(gameDate, "d")

  // Determine status and result
  const isPast = gameDate < new Date()
  const hasLineup = Boolean(game.lineupId)
  // Log lineup status for debugging
  console.log(`Game ${game.id} vs ${game.opponent} has lineup: ${hasLineup}, lineupId: ${game.lineupId || 'none'}`)

  // Get status badge
  const getStatusBadge = () => {
    if (game.status === "canceled") {
      return <Badge colorScheme="red">Canceled</Badge>
    }

    if (isPast && game.result) {
      if (game.result === "win") {
        return <Badge colorScheme="green">Win</Badge>
      } else if (game.result === "loss") {
        return <Badge colorScheme="red">Loss</Badge>
      } else {
        return <Badge colorScheme="yellow">Tie</Badge>
      }
    }

    if (game.status === "in-progress") {
      return <Badge colorScheme="yellow">Live</Badge>
    }

    return null
  }

  // Handle delete action
  const handleDelete = () => {
    if (onDelete) {
      onDelete(game.id)
    }
    onClose()
  }

  return (
    <Flex
      borderBottom="1px solid"
      borderColor="gray.100"
      py={4}
      px={2}
      align="center"
      transition="background 0.2s"
      _hover={{ bg: "gray.50" }}
      role="group"
    >
      {/* Date column */}
      <Flex direction="column" align="center" justify="center" w="60px" mr={4}>
        <Text fontSize="sm" color="gray.500">
          {dayOfWeek}
        </Text>
        <Text fontSize="xl" fontWeight="bold">
          {dayOfMonth}
        </Text>
      </Flex>

      {/* Time column */}
      <Box w="100px" mr={4}>
        <Text fontSize="sm">{formattedTime}</Text>
      </Box>

      {/* Home/Away indicator */}
      <Box w="80px" mr={4}>
        <Text fontSize="sm">{game.isHome ? "Home" : "Away"}</Text>
      </Box>

      {/* Opponent column */}
      <Flex flex="1" align="center">
        <Text fontWeight="semibold" mr={2}>
          {game.isHome ? "vs" : "@"} {game.opponent}
        </Text>
        {getStatusBadge()}
      </Flex>

      {/* Lineup Status Column - Made simpler */}
      <Box w="120px" textAlign="center">
        <Badge 
          colorScheme={hasLineup ? "green" : "orange"}
          py={1}
          px={2}
          borderRadius="md"
          fontSize="xs"
          cursor="pointer"
          as={NextLink}
          href={`/games/${game.id}/lineup/create`}
          _hover={{ opacity: 0.8 }}
        >
          {hasLineup ? "Lineup Ready" : "Create Lineup"}
        </Badge>
      </Box>

      {/* Additional info */}
      <HStack spacing={4} mr={4} color="gray.500" display={{ base: "none", md: "flex" }}>
        <Flex align="center">
          <Icon as={FaMapMarkerAlt} mr={1} boxSize={3} />
          <Text fontSize="sm" noOfLines={1} maxW="150px">
            {game.location}
          </Text>
        </Flex>

        {game.status === "scheduled" && (
          <Badge 
            colorScheme={hasLineup ? "teal" : "orange"} 
            cursor="pointer" 
            as={NextLink} 
            href={`/games/${game.id}/lineup/create`}
            px={2}
            py={1}
            fontSize="sm"
            fontWeight="medium"
            borderRadius="md"
            display="flex"
            alignItems="center"
          >
            {hasLineup ? "✓ View/Edit Lineup" : "! Create Lineup"}
          </Badge>
        )}
      </HStack>

      {/* Actions */}
      <HStack spacing={2}>
        <HStack spacing={2} display={{ base: "none", md: "flex" }}>
          <NextLink href={`/games/${game.id}`} passHref>
            <Button as="a" colorScheme="blue" size="sm" variant="solid">
              View Details
            </Button>
          </NextLink>
          <NextLink href={`/games/${game.id}/lineup/create`} passHref>
            <Button 
              as="a" 
              colorScheme={hasLineup ? "teal" : "green"} 
              size="sm" 
              variant="solid"
              leftIcon={hasLineup ? <EditIcon /> : <AddIcon />}
            >
              {hasLineup ? "Edit Lineup" : "Create Lineup"}
            </Button>
          </NextLink>
        </HStack>

        <Menu>
          <MenuButton as={IconButton} aria-label="Options" icon={<ChevronDownIcon />} variant="ghost" size="sm" />
          <MenuList>
            <MenuItem as={NextLink} href={`/games/${game.id}`}>
              View Details
            </MenuItem>

            {game.status === "scheduled" && (
              <MenuItem 
                as={NextLink} 
                href={`/games/${game.id}/lineup/create`}
                icon={hasLineup ? <EditIcon /> : <AddIcon />}
                color={hasLineup ? "teal.500" : "green.500"}
                fontWeight="medium"
              >
                {hasLineup ? "Edit Lineup" : "Create Lineup"}
              </MenuItem>
            )}

            <MenuItem as={NextLink} href={`/games/${game.id}/edit`} icon={<EditIcon />}>
              Edit Game
            </MenuItem>

            <MenuDivider />

            <MenuItem color="red.500" icon={<DeleteIcon />} onClick={onOpen}>
              Delete Game
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete this game against {game.opponent}? This action cannot be undone.
            {hasLineup && " This will also delete the associated lineup."}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

