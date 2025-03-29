'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Image,
  Input,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  Card,
  CardBody,
  Divider,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiImage, FiTrash2, FiDownload, FiCheck } from 'react-icons/fi';
import Logo from '../../../components/common/logo';
import { useTeamContext } from '../../../contexts/team-context';

interface AssetFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: number;
}

/**
 * Asset Management Page
 * For uploading and managing site assets like logos and images
 */
export default function AssetsPage() {
  const toast = useToast();
  const router = useRouter();
  
  // State for all assets
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    // For demo purposes, we'll simulate loading some assets
    // In a real app, you would fetch these from an API
    const demoAssets: AssetFile[] = [
      {
        id: '1',
        name: 'default-logo.png',
        url: '/assets/images/logo.png',
        type: 'image/png',
        size: 24500,
        createdAt: Date.now()
      }
    ];
    
    setAssets(demoAssets);
    
    // Check if logo exists
    const checkLogo = async () => {
      try {
        const res = await fetch('/assets/images/logo.png');
        if (res.ok) {
          setCurrentLogo('/assets/images/logo.png');
        }
      } catch (error) {
        console.log('No custom logo found');
      }
    };
    
    checkLogo();
  }, []);
  
  // Get the current team context
  const { currentTeam } = useTeamContext();
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, assetType: 'teamLogo' | 'image' = 'image') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, SVG, etc.)',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    // For team logo uploads, verify a team is selected
    if (assetType === 'teamLogo' && !currentTeam?.id) {
      toast({
        title: 'No team selected',
        description: 'Please select a team to upload a logo for',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create form data for API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetType', assetType);
      
      // For team logo uploads, include the team ID
      if (assetType === 'teamLogo' && currentTeam?.id) {
        formData.append('teamId', currentTeam.id);
      }
      
      // Upload the file to our API
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      
      // Add to assets list
      const newAsset: AssetFile = {
        id: Date.now().toString(),
        name: file.name,
        url: data.file.url,
        type: file.type,
        size: file.size,
        createdAt: Date.now()
      };
      
      setAssets(prev => [newAsset, ...prev]);
      
      // If it was a team logo upload, update the current team state
      if (assetType === 'teamLogo') {
        toast({
          title: 'Team logo updated',
          description: `Logo for ${currentTeam?.name} has been updated`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Force reload in 1 second to allow for browser cache to update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // For regular image uploads
        toast({
          title: 'File uploaded',
          description: `${file.name} has been uploaded successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'There was an error uploading your file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle setting image as logo
  const handleSetAsLogo = (asset: AssetFile) => {
    // In a real app, you would call an API to set this as the logo
    // Here we'll just update the state
    setCurrentLogo(asset.url);
    
    toast({
      title: 'Logo updated',
      description: 'Your site logo has been updated',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // Handle deleting an asset
  const handleDeleteAsset = (assetId: string) => {
    // In a real app, you would call an API to delete the asset
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
    
    toast({
      title: 'Asset deleted',
      description: 'The asset has been deleted',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Asset Management</Heading>
          <Text color="gray.600">
            Upload and manage your site assets like logos and images
          </Text>
        </Box>
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Team Logo</Tab>
            <Tab>Images</Tab>
          </TabList>
          
          <TabPanels>
            {/* Team Logo Management Tab */}
            <TabPanel p={4}>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardBody>
                    <Box mb={4}>
                      <Heading size="md">Team Logo</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        Upload your team logo to be displayed on team pages and materials
                      </Text>
                    </Box>
                    <Divider mb={4} />
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      {/* Current Team Logo Preview */}
                      <Box>
                        <Text fontWeight="medium" mb={2}>Current Team Logo</Text>
                        <Flex 
                          direction="column" 
                          align="center" 
                          justify="center"
                          bg="gray.50"
                          border="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          p={8}
                          minH="150px"
                        >
                          {currentTeam?.logoUrl ? (
                            <Image 
                              src={currentTeam.logoUrl + `?v=${new Date().getTime()}`}
                              alt={currentTeam.name}
                              width={100}
                              height={100}
                              objectFit="contain"
                            />
                          ) : (
                            <Box 
                              width={100} 
                              height={100} 
                              borderRadius="md" 
                              bg="gray.200" 
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="gray.500"
                            >
                              No logo
                            </Box>
                          )}
                          <Text mt={4} fontSize="sm" color="gray.500">
                            {currentTeam?.name || "Select a team to upload a logo"}
                          </Text>
                        </Flex>
                      </Box>
                      
                      {/* Team Logo Upload */}
                      <Box>
                        <Text fontWeight="medium" mb={2}>Upload Team Logo</Text>
                        <VStack spacing={4}>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              display="none"
                              id="team-logo-upload"
                            />
                            <Flex
                              direction="column"
                              align="center"
                              justify="center"
                              p={6}
                              borderWidth={2}
                              borderStyle="dashed"
                              borderColor="gray.300"
                              borderRadius="md"
                              bg="gray.50"
                              transition="all 0.3s"
                              cursor="pointer"
                              onClick={() => {
                                if (!currentTeam) {
                                  toast({
                                    title: "No team selected",
                                    description: "Please select a team to upload a logo for",
                                    status: "warning",
                                    duration: 5000,
                                    isClosable: true,
                                  });
                                  return;
                                }
                                const element = document.getElementById('team-logo-upload');
                                if (element) {
                                  element.onchange = (e) => handleFileUpload(e as React.ChangeEvent<HTMLInputElement>, 'teamLogo');
                                  element.click();
                                }
                              }}
                            >
                              <Icon as={FiUpload} boxSize={8} color="gray.400" mb={2} />
                              <Text fontWeight="medium">Click to upload team logo</Text>
                              <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
                                PNG, JPG, or SVG (max. 2MB)
                              </Text>
                            </Flex>
                          </FormControl>
                          
                          <Box w="100%">
                            <Text fontSize="sm" fontWeight="medium" mb={1}>Requirements:</Text>
                            <Text fontSize="xs" color="gray.600">
                              • Recommended size: 400×400px (square)
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              • Transparent background recommended
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              • PNG or SVG format preferred
                            </Text>
                          </Box>
                        </VStack>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* competeHQ Logo Information */}
                <Card>
                  <CardBody>
                    <Box mb={4}>
                      <Heading size="md">Application Logo</Heading>
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        The competeHQ logo appears in the header and footer of the application
                      </Text>
                    </Box>
                    <Divider mb={4} />

                    <Flex 
                      direction="column" 
                      align="center" 
                      p={6}
                      bg="gray.50"
                      borderRadius="md"
                    >
                      <Logo size="lg" />
                      <Text mt={4} textAlign="center" fontSize="sm" color="gray.600">
                        This is the competeHQ application logo and is not customizable.
                        <br />
                        It is separate from your team logo and appears across the entire application.
                      </Text>
                    </Flex>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
            
            {/* Image Assets Tab */}
            <TabPanel p={4}>
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardBody>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="md">Image Library</Heading>
                      <FormControl w="auto">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          display="none"
                          id="image-upload"
                        />
                        <Button
                          leftIcon={<FiUpload />}
                          colorScheme="blue"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          isLoading={isUploading}
                        >
                          Upload Image
                        </Button>
                      </FormControl>
                    </Flex>
                    
                    <Divider mb={4} />
                    
                    {assets.length === 0 ? (
                      <Flex 
                        direction="column" 
                        align="center" 
                        justify="center"
                        bg="gray.50"
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        p={8}
                        minH="200px"
                      >
                        <Icon as={FiImage} boxSize={10} color="gray.400" mb={2} />
                        <Text fontWeight="medium">No images uploaded yet</Text>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Upload images to use across your site
                        </Text>
                        <Button
                          leftIcon={<FiUpload />}
                          colorScheme="blue"
                          size="sm"
                          mt={4}
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          Upload First Image
                        </Button>
                      </Flex>
                    ) : (
                      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                        {assets.map((asset) => (
                          <Box
                            key={asset.id}
                            borderWidth="1px"
                            borderRadius="md"
                            overflow="hidden"
                          >
                            <Box position="relative" h="150px" bg="gray.100">
                              <Image
                                src={asset.url}
                                alt={asset.name}
                                objectFit="contain"
                                w="100%"
                                h="100%"
                              />
                            </Box>
                            <Box p={3}>
                              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {asset.name}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {formatFileSize(asset.size)}
                              </Text>
                              <HStack mt={2} spacing={1} justifyContent="flex-end">
                                <IconButton
                                  aria-label="Set as logo"
                                  icon={<FiCheck />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  onClick={() => handleSetAsLogo(asset)}
                                />
                                <IconButton
                                  aria-label="Download"
                                  icon={<FiDownload />}
                                  size="sm"
                                  variant="ghost"
                                  as="a"
                                  href={asset.url}
                                  download={asset.name}
                                />
                                <IconButton
                                  aria-label="Delete"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleDeleteAsset(asset.id)}
                                />
                              </HStack>
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}