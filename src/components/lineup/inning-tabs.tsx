'use client';

import React from 'react';
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  useColorModeValue
} from '@chakra-ui/react';

interface InningTabsProps {
  /**
   * The total number of innings in the game
   */
  innings: number;
  
  /**
   * The currently selected inning (1-based)
   */
  currentInning: number;
  
  /**
   * Callback when the selected inning changes
   */
  onInningChange: (inning: number) => void;
  
  /**
   * Children to render in each tab panel (inning content)
   */
  children: React.ReactNode[];
}

/**
 * Horizontal tabs for navigating between innings
 */
const InningTabs: React.FC<InningTabsProps> = ({
  innings,
  currentInning,
  onInningChange,
  children
}) => {
  const activeTabBg = useColorModeValue('white', 'gray.700');
  const inactiveBg = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Handle tab change
  const handleTabChange = (index: number) => {
    // Convert 0-based index to 1-based inning
    onInningChange(index + 1);
  };
  
  return (
    <Tabs 
      index={currentInning - 1} 
      onChange={handleTabChange}
      variant="enclosed"
      colorScheme="primary"
      isLazy
    >
      <TabList>
        {Array.from({ length: innings }).map((_, index) => (
          <Tab 
            key={index}
            bg={inactiveBg}
            _selected={{ 
              color: 'primary.600', 
              bg: activeTabBg,
              borderColor: borderColor,
              borderBottomColor: 'transparent',
              fontWeight: 'semibold'
            }}
            borderBottomWidth="1px"
            borderColor={borderColor}
            borderTopRadius="md"
            px={4}
            py={2}
          >
            Inning {index + 1}
          </Tab>
        ))}
      </TabList>
      
      <TabPanels 
        borderWidth="1px" 
        borderColor={borderColor} 
        borderBottomRadius="md"
        borderTop="none"
      >
        {Array.from({ length: innings }).map((_, index) => (
          <TabPanel key={index} p={4}>
            {children[index] || 
              <Box textAlign="center" py={4} color="gray.500">
                No lineup set for inning {index + 1}
              </Box>
            }
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};

export default InningTabs;