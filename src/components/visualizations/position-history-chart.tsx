// src/components/visualizations/position-history-chart.tsx
import React from 'react';
import {
  Box,
  Text,
  Heading,
  Flex,
  useColorModeValue,
  SimpleGrid
} from '@chakra-ui/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip
} from 'recharts';
import { getPositionColor } from '../../theme';

interface PositionData {
  position: string;
  count: number;
  percentage: number;
}

interface PositionHistoryChartProps {
  positionData: PositionData[];
  title?: string;
  subtitle?: string;
}

export const PositionHistoryChart: React.FC<PositionHistoryChartProps> = ({
  positionData,
  title = "Position Distribution",
  subtitle
}) => {
  const labelColor = useColorModeValue('gray.700', 'white');
  
  const formatTooltip = (value, name, props) => {
    return [`${value} innings (${props.payload.percentage.toFixed(1)}%)`, name];
  };
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white">
      <Box mb={4}>
        {title && <Heading size="md">{title}</Heading>}
        {subtitle && <Text color="gray.600" fontSize="sm">{subtitle}</Text>}
      </Box>
      
      {positionData.length === 0 ? (
        <Flex 
          justify="center" 
          align="center" 
          direction="column" 
          h="200px" 
          bg="gray.50" 
          borderRadius="md"
        >
          <Text color="gray.500">No position data available</Text>
        </Flex>
      ) : (
        <Box>
          <Box h="240px">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionData}
                  dataKey="count"
                  nameKey="position"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ position, percentage }) => `${position} (${percentage.toFixed(0)}%)`}
                  fill="#8884d8"
                >
                  {positionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getPositionColor(entry.position)}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={formatTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          
          <SimpleGrid columns={3} spacing={4} mt={6}>
            {positionData.map(item => (
              <Flex 
                key={item.position}
                justify="space-between"
                p={2}
                borderRadius="md"
                bg="gray.50"
              >
                <Flex align="center">
                  <Box 
                    w="3"
                    h="3"
                    borderRadius="full"
                    bg={getPositionColor(item.position)}
                    mr={2}
                  />
                  <Text fontWeight="medium">{item.position}</Text>
                </Flex>
                <Text>{item.count}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
};

export default PositionHistoryChart;