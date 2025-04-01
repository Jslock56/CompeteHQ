'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Stack,
  Divider,
  Badge,
  Icon,
  Select,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Spinner,
  useToast,
  useColorModeValue,
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  StarIcon, 
  SettingsIcon, 
  PlusSquareIcon, 
  ViewIcon,
  EditIcon,
  AtSignIcon,
  ChevronRightIcon
} from '@chakra-ui/icons';
import { FaBaseballBall, FaUsers, FaUserCog, FaClipboardList } from 'react-icons/fa';
import NextLink from 'next/link';
import { useAuth } from '../../../contexts/auth-context';
import { Permission } from '../../../models/user';
import { useTeamContext } from '../../../contexts/team-context';
import SportIcon from '../../../components/common/sport-icon';
import TeamBadges from '../../../components/common/team-badges';
import LoadingSpinner from '../../../components/common/loading-spinner';
import Calendar from '../../../components/common/calendar';

// Interface for team data
interface Team {
  id: string;
  name: string;
  ageGroup: string;
  sport: string;
  season: string;
  description?: string;
  role: string;
  isActive: boolean;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
}

interface GameSummary {
  id: string;
  opponent: string;
  date: string;
  location: string;
  isHome: boolean;
  result?: 'win' | 'loss' | 'tie';
  score?: string;
}

const DashboardPage = () => {
  // Get all context hooks and colorMode first
  const router = useRouter();
  const toast = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { currentTeam, setCurrentTeam } = useTeamContext();
  // Pre-fetch color mode values that will be used later
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  // Then declare all state hooks
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [recentGames, setRecentGames] = useState<GameSummary[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<GameSummary[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user teams on load
  useEffect(() => {
    const fetchTeams = async () => {
      if (authLoading || !user) return;

      try {
        console.log('Dashboard: Fetching team memberships');
        const response = await fetch('/api/teams/memberships');
        
        if (!response.ok) {
          console.error('Dashboard: Failed to fetch teams, status:', response.status);
          throw new Error(`Failed to fetch teams: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dashboard: Team memberships data:', data);
        
        if (data.success && data.teams && data.teams.length > 0) {
          console.log('Dashboard: User has teams:', data.teams);
          
          setTeams(data.teams.map((team: any) => {
            const membership = data.memberships.find((m: any) => m.teamId === team.id);
            return {
              ...team,
              role: membership?.role || 'fan',
              isActive: membership?.status === 'active'
            };
          }));
          
          // If there's a currentTeam in context, use that
          if (currentTeam) {
            const team = data.teams.find((t: any) => t.id === currentTeam);
            if (team) {
              setSelectedTeam(team);
              fetchTeamDetails(team.id);
            } else if (data.teams.length > 0) {
              // If current team not found, use first team
              setSelectedTeam(data.teams[0]);
              setCurrentTeam(data.teams[0].id);
              fetchTeamDetails(data.teams[0].id);
            }
          } else if (data.teams.length > 0) {
            // No current team, use first team
            setSelectedTeam(data.teams[0]);
            setCurrentTeam(data.teams[0].id);
            fetchTeamDetails(data.teams[0].id);
          } else {
            setIsLoading(false);
          }
        } else {
          console.log('Dashboard: User has no teams, redirecting to team creation');
          router.push('/teams/new');
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teams',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [authLoading, user, currentTeam, setCurrentTeam, toast, router]);

  // Fetch team details when selected team changes
  const fetchTeamDetails = async (teamId: string) => {
    setIsLoading(true);
    
    try {
      console.log(`Fetching team details for team ID: ${teamId}`);
      
      // Fetch games using the team-specific endpoint
      let gamesPromise = fetch(`/api/teams/${teamId}/games`);
      
      // Fetch team details, games, and members
      const [teamResponse, membersResponse, gamesResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/members?status=active`),
        gamesPromise
      ]);
      
      // Process team details (including user permissions)
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        if (teamData.userMembership) {
          setUserPermissions(teamData.userMembership.permissions);
        }
      }
      
      // Process team members
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setTeamMembers(membersData.members.map((item: any) => ({
          _id: item.membership._id,
          name: item.user.name,
          role: item.membership.role
        })).sort((a: TeamMember, b: TeamMember) => {
          // Sort by role priority: head coach -> assistant -> fan
          const rolePriority = { headCoach: 1, assistant: 2, fan: 3 };
          return (rolePriority[a.role as keyof typeof rolePriority] || 4) - 
                 (rolePriority[b.role as keyof typeof rolePriority] || 4);
        }).slice(0, 5)); // Just get the first 5 for display
      }
      
      // Process games
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        console.log("Games data from API:", gamesData);
        
        if (gamesData.games) {
          // Since we're using the team-specific endpoint, all games should already be for this team
          // We don't need to filter by teamId anymore
          
          // Ensure all dates are numbers for consistent comparison
          const gamesWithValidDates = gamesData.games.map((game: any) => {
            // Convert string or Date objects to number timestamps if needed
            if (game.date && typeof game.date !== 'number') {
              try {
                game.date = new Date(game.date).getTime();
                console.log(`Converted date for game ${game.id} to timestamp: ${game.date}`);
              } catch (e) {
                console.error(`Failed to convert date for game ${game.id}:`, e);
              }
            }
            return game;
          });
          
          const now = Date.now(); // Use timestamp for comparison
          
          // Debug log to see what's in the games array
          console.log(`Processing ${gamesWithValidDates.length} games from API for team ${teamId}. Current timestamp: ${now}`);
          gamesWithValidDates.forEach((game: any) => {
            console.log(`Game: ${game.id}, Team: ${game.teamId}, Opponent: ${game.opponent}, Date: ${game.date}, Now: ${now}, IsUpcoming: ${game.date >= now}`);
          });
          
          const upcoming = gamesWithValidDates
            .filter((game: any) => typeof game.date === 'number' && game.date >= now) // Ensure date is a number and compare
            .sort((a: any, b: any) => a.date - b.date) // Sort ascending for upcoming
            .slice(0, 3);
            
          const recent = gamesWithValidDates
            .filter((game: any) => typeof game.date === 'number' && game.date < now && game.result)
            .sort((a: any, b: any) => b.date - a.date) // Sort descending for recent
            .slice(0, 3);
            
          console.log(`Found ${upcoming.length} upcoming games and ${recent.length} recent games`);
            
          setUpcomingGames(upcoming.map((game: any) => ({
            id: game.id,
            opponent: game.opponent,
            date: new Date(game.date).toLocaleDateString(),
            location: game.location,
            isHome: game.isHome,
            result: game.result,
            score: game.homeScore !== undefined && game.awayScore !== undefined 
              ? `${game.homeScore} - ${game.awayScore}` 
              : undefined
          })));
          
          setRecentGames(recent.map((game: any) => ({
            id: game.id,
            opponent: game.opponent,
            date: new Date(game.date).toLocaleDateString(),
            location: game.location,
            isHome: game.isHome,
            result: game.result,
            score: game.homeScore !== undefined && game.awayScore !== undefined 
              ? `${game.homeScore} - ${game.awayScore}` 
              : undefined
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle team change
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    const team = teams.find(t => t.id === teamId) || null;
    setSelectedTeam(team);
    if (team) {
      setCurrentTeam(team.id);
      fetchTeamDetails(team.id);
    }
  };

  // Check if user has permission
  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };

  // Get role name for display
  const getRoleName = (role: string) => {
    switch (role) {
      case 'headCoach':
        return 'Head Coach';
      case 'assistant':
        return 'Assistant Coach';
      case 'fan':
        return 'Parent/Fan';
      default:
        return 'Team Member';
    }
  };

  // Show create team button if no teams
  if (!authLoading && teams.length === 0) {
    return (
      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="center" justify="center" minH="60vh">
          <Heading size="lg">Welcome to CompeteHQ</Heading>
          <Text textAlign="center" maxW="md">
            You don't have any teams yet. Create your first team to start managing your roster, 
            lineups, and games.
          </Text>
          <Button 
            colorScheme="primary" 
            size="lg"
            leftIcon={<Icon as={PlusSquareIcon} />}
            onClick={() => router.push('/teams/new')}
          >
            Create Your First Team
          </Button>
        </VStack>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="60vh" direction="column">
        <LoadingSpinner 
          type="baseball" 
          size="xl" 
          animation="pulse" 
          text="Loading your team..." 
        />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Team Selector removed - using only the header dropdown */}

      {/* Team Header */}
      {selectedTeam && (
        <>
          <Box mb={8}>
            <Flex
              justify="space-between"
              align={{ base: "flex-start", md: "center" }}
              direction={{ base: "column", md: "row" }}
              bg={bgColor}
              p={6}
              borderRadius="lg"
              boxShadow="md"
            >
              <Box mb={{ base: 4, md: 0 }}>
                <Flex align="center" mb={2}>
                  <Heading size="lg" mr={2}>{selectedTeam.name}</Heading>
                  <SportIcon sport={selectedTeam.sport as 'baseball' | 'softball'} size="1.5rem" />
                </Flex>
                <Flex>
                  <TeamBadges 
                    ageGroup={selectedTeam.ageGroup}
                    season={selectedTeam.season}
                    role={selectedTeam.role}
                    size="md"
                  />
                </Flex>
                {selectedTeam.description && (
                  <Text mt={2} color={textColor}>{selectedTeam.description}</Text>
                )}
              </Box>
              <HStack spacing={3}>
                {hasPermission(Permission.CREATE_LINEUPS) && (
                  <Button
                    leftIcon={<Icon as={PlusSquareIcon} />}
                    colorScheme="primary"
                    onClick={() => router.push('/lineup/new')}
                  >
                    New Lineup
                  </Button>
                )}
                {hasPermission(Permission.CREATE_GAMES) && (
                  <Button
                    leftIcon={<Icon as={CalendarIcon} />}
                    variant="outline"
                    colorScheme="primary"
                    onClick={() => router.push('/games/new')}
                  >
                    Add Game
                  </Button>
                )}
              </HStack>
            </Flex>
          </Box>

          {/* Dashboard Grids */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
            {/* Quick Links Card */}
            <Card>
              <CardHeader pb={0}>
                <Heading size="md">Quick Links</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {hasPermission(Permission.VIEW_STATS) && (
                    <LinkBox as="div">
                      <Flex 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        align="center"
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Icon as={FaUsers} color="blue.500" mr={3} />
                        <NextLink href={`/roster/${selectedTeam.id}`} passHref>
                          <LinkOverlay>
                            View Roster
                          </LinkOverlay>
                        </NextLink>
                        <ChevronRightIcon ml="auto" />
                      </Flex>
                    </LinkBox>
                  )}
                  
                  {hasPermission(Permission.VIEW_STATS) && (
                    <LinkBox as="div">
                      <Flex 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        align="center"
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Icon as={FaClipboardList} color="green.500" mr={3} />
                        <NextLink href="/lineup" passHref>
                          <LinkOverlay>
                            View Lineups
                          </LinkOverlay>
                        </NextLink>
                        <ChevronRightIcon ml="auto" />
                      </Flex>
                    </LinkBox>
                  )}
                  
                  {hasPermission(Permission.VIEW_SCHEDULE) && (
                    <LinkBox as="div">
                      <Flex 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        align="center"
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Icon as={CalendarIcon} color="purple.500" mr={3} />
                        <NextLink href="/games" passHref>
                          <LinkOverlay>
                            Games Schedule
                          </LinkOverlay>
                        </NextLink>
                        <ChevronRightIcon ml="auto" />
                      </Flex>
                    </LinkBox>
                  )}
                  
                  {hasPermission(Permission.MANAGE_USERS) && (
                    <LinkBox as="div">
                      <Flex 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        align="center"
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Icon as={FaUserCog} color="red.500" mr={3} />
                        <NextLink href={`/teams/${selectedTeam.id}/members`} passHref>
                          <LinkOverlay>
                            Manage Team
                          </LinkOverlay>
                        </NextLink>
                        <ChevronRightIcon ml="auto" />
                      </Flex>
                    </LinkBox>
                  )}
                  
                  {hasPermission(Permission.EDIT_ROSTER) && (
                    <LinkBox as="div">
                      <Flex 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        align="center"
                        _hover={{ bg: 'gray.50' }}
                      >
                        <Icon as={PlusSquareIcon} color="teal.500" mr={3} />
                        <NextLink href={`/roster/new?teamId=${selectedTeam.id}`} passHref>
                          <LinkOverlay>
                            Add Player
                          </LinkOverlay>
                        </NextLink>
                        <ChevronRightIcon ml="auto" />
                      </Flex>
                    </LinkBox>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Calendar Card */}
            <Box>
              <Calendar 
                events={
                  [...(upcomingGames || []), ...(recentGames || [])].map(game => {
                    try {
                      const gameDate = new Date(game.date);
                      return {
                        date: gameDate.getDate(),       // Day of month
                        month: gameDate.getMonth(),     // Month (0-11)
                        year: gameDate.getFullYear(),   // Year
                        title: `vs ${game.opponent}`,
                        opponent: game.opponent,
                        location: game.location || "TBD",
                        isHome: game.isHome || false,
                      };
                    } catch (error) {
                      console.error("Error processing game data:", error);
                      return null;
                    }
                  }).filter(Boolean)
                }
              />
            </Box>

            {/* Team Members Card */}
            <Card>
              <CardHeader pb={0}>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Team Members</Heading>
                  <Button
                    as={NextLink}
                    href={`/teams/${selectedTeam.id}/members`}
                    size="sm"
                    variant="ghost"
                    rightIcon={<ChevronRightIcon />}
                  >
                    View All
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack spacing={2} align="stretch">
                  {teamMembers.length === 0 ? (
                    <Text color="gray.500">No team members found</Text>
                  ) : (
                    teamMembers.map(member => (
                      <Flex 
                        key={member._id}
                        p={2}
                        borderWidth="1px"
                        borderRadius="md"
                        justify="space-between"
                        align="center"
                      >
                        <Text fontWeight="medium">{member.name}</Text>
                        <Badge colorScheme={
                          member.role === 'headCoach' ? 'red' : 
                          member.role === 'assistant' ? 'orange' : 'blue'
                        }>
                          {getRoleName(member.role)}
                        </Badge>
                      </Flex>
                    ))
                  )}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Upcoming Games Section */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Upcoming Games</Heading>
                  <Button
                    as={NextLink}
                    href="/games"
                    size="sm"
                    variant="ghost"
                    rightIcon={<ChevronRightIcon />}
                  >
                    View All
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                {upcomingGames.length === 0 ? (
                  <Text color="gray.500">No upcoming games scheduled</Text>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {upcomingGames.map(game => (
                      <LinkBox as="div" key={game.id}>
                        <Flex
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Box>
                            <HStack mb={1}>
                              <Badge colorScheme={game.isHome ? 'green' : 'purple'}>
                                {game.isHome ? 'Home' : 'Away'}
                              </Badge>
                              <Text fontWeight="medium">vs {game.opponent}</Text>
                            </HStack>
                            <HStack spacing={4} fontSize="sm" color="gray.600">
                              <Text>{game.date}</Text>
                              <Text>{game.location}</Text>
                            </HStack>
                          </Box>
                          <NextLink href={`/games/${game.id}`} passHref>
                            <LinkOverlay>
                              <ChevronRightIcon ml="auto" />
                            </LinkOverlay>
                          </NextLink>
                        </Flex>
                      </LinkBox>
                    ))}
                  </VStack>
                )}
              </CardBody>
              <CardFooter pt={0}>
                {hasPermission(Permission.CREATE_GAMES) && (
                  <Button
                    leftIcon={<PlusSquareIcon />}
                    onClick={() => router.push('/games/new')}
                    size="sm"
                    variant="outline"
                    width="full"
                  >
                    Add Game
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Recent Games Section */}
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Recent Results</Heading>
                  <Button
                    as={NextLink}
                    href="/games"
                    size="sm"
                    variant="ghost"
                    rightIcon={<ChevronRightIcon />}
                  >
                    View All
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                {recentGames.length === 0 ? (
                  <Text color="gray.500">No recent game results</Text>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {recentGames.map(game => (
                      <LinkBox as="div" key={game.id}>
                        <Flex
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                          _hover={{ bg: 'gray.50' }}
                        >
                          <Box>
                            <HStack mb={1}>
                              <Badge colorScheme={
                                game.result === 'win' ? 'green' : 
                                game.result === 'loss' ? 'red' : 'gray'
                              }>
                                {game.result === 'win' ? 'Win' : game.result === 'loss' ? 'Loss' : 'Tie'}
                              </Badge>
                              <Text fontWeight="medium">vs {game.opponent}</Text>
                              {game.score && (
                                <Text fontWeight="bold">{game.score}</Text>
                              )}
                            </HStack>
                            <HStack spacing={4} fontSize="sm" color="gray.600">
                              <Text>{game.date}</Text>
                              <Text>{game.location}</Text>
                            </HStack>
                          </Box>
                          <NextLink href={`/games/${game.id}`} passHref>
                            <LinkOverlay>
                              <ChevronRightIcon ml="auto" />
                            </LinkOverlay>
                          </NextLink>
                        </Flex>
                      </LinkBox>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;