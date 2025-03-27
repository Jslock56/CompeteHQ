import React, { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Flex,
  Text,
  VStack,
  Heading,
  Badge,
  Alert,
  AlertIcon,
  Divider,
  useColorModeValue,
  Icon,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

interface FairPlayCheckerProps {
  /**
   * Function to run validation and get issues
   */
  validateLineup: () => string[];

  /**
   * Current fair play issues (if already validated)
   */
  fairPlayIssues?: string[];
  
  /**
   * Whether to initially validate and show results
   */
  initialValidation?: boolean;
}

/**
 * A component that provides on-demand fair play checking
 * with collapsible results
 */
const FairPlayChecker: React.FC<FairPlayCheckerProps> = ({
  validateLineup,
  fairPlayIssues: initialIssues = [],
  initialValidation = false
}) => {
  // State for issues
  const [fairPlayIssues, setFairPlayIssues] = useState<string[]>(initialIssues);
  
  // Validation state
  const [hasValidated, setHasValidated] = useState<boolean>(initialValidation);
  
  // Visibility state for the issues panel
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const alertWarningBg = useColorModeValue('yellow.50', 'yellow.900');
  const alertSuccessBg = useColorModeValue('green.50', 'green.900');
  
  // Run validation and show results
  const handleCheckFairPlay = () => {
    const issues = validateLineup();
    setFairPlayIssues(issues);
    setHasValidated(true);
    setIsExpanded(true); // Auto-expand when checking
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Group issues by type to make them more organized
  const categorizeIssues = (issues: string[]): Record<string, string[]> => {
    const categories: Record<string, string[]> = {
      'Bench Time': [],
      'Position Variety': [],
      'Playing Time': [],
      'Other Issues': [],
    };
    
    issues.forEach(issue => {
      if (issue.includes('bench') || issue.includes('consecutive innings')) {
        categories['Bench Time'].push(issue);
      } else if (issue.includes('position') || issue.includes('infield')) {
        categories['Position Variety'].push(issue);
      } else if (issue.includes('play') || issue.includes('innings')) {
        categories['Playing Time'].push(issue);
      } else {
        categories['Other Issues'].push(issue);
      }
    });
    
    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([, issues]) => issues.length > 0)
    );
  };
  
  const categorizedIssues = categorizeIssues(fairPlayIssues);
  const categoryCount = Object.keys(categorizedIssues).length;
  
  return (
    <Box 
      borderWidth="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      bg={cardBg}
      mb={4}
      overflow="hidden"
    >
      {/* Fair Play Check Button */}
      <Flex 
        justify="space-between" 
        align="center" 
        p={3} 
        bg={headerBg}
        borderBottomWidth={hasValidated && fairPlayIssues.length > 0 ? "1px" : "0px"}
        borderColor={borderColor}
      >
        <Flex align="center">
          <Heading size="sm">Fair Play Status</Heading>
          {hasValidated && (
            <Badge 
              ml={2} 
              colorScheme={fairPlayIssues.length > 0 ? 'yellow' : 'green'}
              variant="subtle"
            >
              {fairPlayIssues.length} {fairPlayIssues.length === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
        </Flex>
        
        <Button 
          size="sm" 
          colorScheme="blue" 
          onClick={handleCheckFairPlay}
          leftIcon={<Icon as={CheckCircleIcon} />}
        >
          Check Fair Play
        </Button>
      </Flex>
      
      {/* Results Section - Only visible if validated */}
      {hasValidated && (
        <>
          {/* Summary Section - Always visible after validation */}
          <Box 
            p={3} 
            bg={fairPlayIssues.length > 0 ? alertWarningBg : alertSuccessBg}
            borderBottomWidth={isExpanded && fairPlayIssues.length > 0 ? "1px" : "0px"}
            borderColor={borderColor}
          >
            <Flex justify="space-between" align="center">
              <Flex align="center">
                <Icon 
                  as={fairPlayIssues.length > 0 ? WarningIcon : CheckCircleIcon} 
                  color={fairPlayIssues.length > 0 ? "yellow.500" : "green.500"} 
                  mr={2} 
                />
                <Text fontWeight="medium">
                  {fairPlayIssues.length === 0 
                    ? "No fair play issues detected" 
                    : `${fairPlayIssues.length} fair play ${fairPlayIssues.length === 1 ? 'issue' : 'issues'} detected`
                  }
                </Text>
              </Flex>
              
              {fairPlayIssues.length > 0 && (
                <Button 
                  size="xs" 
                  variant="ghost" 
                  onClick={toggleExpanded}
                  rightIcon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                >
                  {isExpanded ? "Hide Details" : "Show Details"}
                </Button>
              )}
            </Flex>
            
            {fairPlayIssues.length > 0 && !isExpanded && (
              <Grid templateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2} mt={2}>
                {Object.entries(categorizedIssues).map(([category, issues]) => (
                  <GridItem key={category}>
                    <Badge colorScheme="yellow" mr={1}>{issues.length}</Badge>
                    <Text as="span" fontSize="xs">{category}</Text>
                  </GridItem>
                ))}
              </Grid>
            )}
          </Box>
          
          {/* Detailed Issues - Collapsible */}
          <Collapse in={isExpanded && fairPlayIssues.length > 0} animateOpacity>
            <Box p={4}>
              {categoryCount > 0 ? (
                <VStack spacing={4} align="stretch">
                  {Object.entries(categorizedIssues).map(([category, issues]) => (
                    <Box key={category}>
                      <Heading size="xs" mb={2}>{category} ({issues.length})</Heading>
                      <VStack align="stretch" spacing={1}>
                        {issues.map((issue, index) => (
                          <Flex key={index} align="flex-start">
                            <Text fontSize="sm" as="span" mr={1}>•</Text>
                            <Text fontSize="sm">{issue}</Text>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Alert status="success" variant="subtle">
                  <AlertIcon />
                  <Text>This lineup follows fair play principles with balanced position assignments.</Text>
                </Alert>
              )}
              
              <Divider my={3} />
              
              <Box>
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.500">
                    Improve your lineup by addressing these issues, or save it as is.
                  </Text>
                  <Button 
                    size="xs" 
                    variant="ghost" 
                    onClick={toggleExpanded}
                    rightIcon={<ChevronUpIcon />}
                  >
                    Hide Details
                  </Button>
                </Flex>
              </Box>
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
};

export default FairPlayChecker;