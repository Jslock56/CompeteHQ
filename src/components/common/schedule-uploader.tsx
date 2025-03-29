'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  useToast,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Icon,
  Heading,
  Stack,
  HStack,
  Divider,
  Link,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge
} from '@chakra-ui/react';
import { FiUploadCloud, FiCheck, FiX, FiFileText, FiCalendar, FiInfo, FiImage, FiFileSpreadsheet } from 'react-icons/fi';
import { useTeamContext } from '../../contexts/team-context';

/**
 * Schedule Uploader component props
 */
interface ScheduleUploaderProps {
  /**
   * Callback when upload is successful
   */
  onSuccess?: (results: {
    created: number;
    failed: number;
    total: number;
  }) => void;
  
  /**
   * Default import type (games or practices)
   */
  defaultImportType?: 'games' | 'practices';
}

/**
 * Schedule Uploader component
 * Allows users to upload a CSV file or image of games or practices
 */
export default function ScheduleUploader({ 
  onSuccess,
  defaultImportType = 'games'
}: ScheduleUploaderProps) {
  const toast = useToast();
  const { currentTeam } = useTeamContext();
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'games' | 'practices'>(defaultImportType);
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'image'>('csv');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    created?: number;
    failed?: number;
    total?: number;
    status?: string;
  } | null>(null);
  
  /**
   * Handle file selection for spreadsheet files (CSV, TSV, Excel)
   */
  const handleSpreadsheetFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      const fileName = selectedFile.name.toLowerCase();
      
      // Check if it's a valid file type (CSV, TSV, Excel)
      const validExtensions = ['.csv', '.tsv', '.txt', '.xls', '.xlsx', '.xlsm'];
      const validTypes = [
        'text/csv',
        'text/tab-separated-values',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet'
      ];
      
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
      const hasValidType = validTypes.some(type => selectedFile.type === type);
      
      if (!hasValidExtension && !hasValidType) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV, TSV, or Excel file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadResult(null);
    }
  };
  
  /**
   * Handle file selection for image
   */
  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Check if it's an image file
      if (!selectedFile.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (.jpg, .png, etc.)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadResult(null);
    }
  };
  
  /**
   * Handle import type change
   */
  const handleImportTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setImportType(event.target.value as 'games' | 'practices');
  };
  
  /**
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: `Please select a ${uploadMethod === 'csv' ? 'CSV' : 'image'} file to upload`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!currentTeam) {
      toast({
        title: 'No team selected',
        description: 'Please select a team before uploading',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    setUploadResult(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', currentTeam.id);
      formData.append('importType', importType);
      
      setUploadProgress(30);
      
      // Choose API endpoint based on upload method
      const endpoint = uploadMethod === 'csv' ? '/api/upload/spreadsheet' : '/api/upload/image';
      
      // Upload the file
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(80);
      
      // Handle response
      const data = await response.json();
      
      setUploadProgress(100);
      
      if (response.ok && data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          created: data.created,
          failed: data.failed,
          total: data.total,
          status: data.status
        });
        
        let toastDescription;
        if (uploadMethod === 'csv') {
          toastDescription = `Successfully imported ${data.created} ${importType}`;
        } else {
          toastDescription = data.message || 'Image received for processing';
        }
        
        toast({
          title: 'Upload successful',
          description: toastDescription,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        if (onSuccess && data.created !== undefined) {
          onSuccess({
            created: data.created,
            failed: data.failed || 0,
            total: data.total || data.created,
          });
        }
      } else {
        setUploadResult({
          success: false,
          message: data.message || 'Failed to upload file',
        });
        
        toast({
          title: 'Upload failed',
          description: data.message || 'Failed to upload file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      setUploadResult({
        success: false,
        message: 'An error occurred during upload',
      });
      
      toast({
        title: 'Upload error',
        description: 'An error occurred during upload',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * Reset the uploader
   */
  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };
  
  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Heading size="md" mb={4}>Import {importType.charAt(0).toUpperCase() + importType.slice(1)} from File</Heading>
      
      {/* Import Type */}
      <FormControl>
        <FormLabel>Import Type</FormLabel>
        <Select value={importType} onChange={handleImportTypeChange} isDisabled={isUploading}>
          <option value="games">Games</option>
          <option value="practices">Practices</option>
        </Select>
      </FormControl>
      
      {/* Upload Method Tabs */}
      <Tabs variant="enclosed" onChange={(index) => setUploadMethod(index === 0 ? 'csv' : 'image')}>
        <TabList>
          <Tab><Icon as={FiFileSpreadsheet} mr={2} /> Spreadsheet</Tab>
          <Tab><Icon as={FiImage} mr={2} /> Image <Badge ml={1} colorScheme="purple" fontSize="xs">NEW</Badge></Tab>
        </TabList>
        
        <TabPanels>
          {/* CSV Upload Panel */}
          <TabPanel p={4}>
            <VStack spacing={4} align="stretch">
              {/* CSV Format Info */}
              <Box p={4} bg="blue.50" borderRadius="md">
                <HStack spacing={3} align="flex-start">
                  <Icon as={FiInfo} color="blue.500" boxSize={5} mt={1} />
                  <Stack spacing={2}>
                    <Heading size="sm">File Format</Heading>
                    <Text fontSize="sm">
                      Your spreadsheet file should include columns for:
                    </Text>
                    {importType === 'games' ? (
                      <Text fontSize="sm">
                        <strong>For Games:</strong> Date, Time, Opponent, Location
                        (optional: Notes)
                      </Text>
                    ) : (
                      <Text fontSize="sm">
                        <strong>For Practices:</strong> Date, Time, Location
                        (optional: Title, Notes)
                      </Text>
                    )}
                    <Text fontSize="sm" color="blue.600">
                      We support CSV, TSV, and Excel files (.xlsx, .xls) with auto-detected column headers!
                    </Text>
                    <Text fontSize="sm" mb={1}>Download sample template:</Text>
                    <HStack spacing={2}>
                      <Link 
                        href={importType === 'games' ? '/templates/games_template.csv' : '/templates/practices_template.csv'} 
                        color="blue.500" 
                        fontSize="sm"
                        download
                      >
                        CSV
                      </Link>
                      <Text fontSize="sm">•</Text>
                      <Link 
                        href={importType === 'games' ? '/templates/games_template.tsv' : '/templates/practices_template.tsv'} 
                        color="blue.500" 
                        fontSize="sm"
                        download
                      >
                        TSV
                      </Link>
                      <Text fontSize="sm">•</Text>
                      <Link 
                        href={importType === 'games' ? '/templates/games_template.xlsx' : '/templates/practices_template.xlsx'} 
                        color="blue.500" 
                        fontSize="sm"
                        download
                      >
                        Excel
                      </Link>
                    </HStack>
                  </Stack>
                </HStack>
              </Box>
              
              {/* File Upload */}
              <FormControl>
                <FormLabel>Select File</FormLabel>
                <Input
                  type="file"
                  accept=".csv,.tsv,.txt,.xls,.xlsx,.xlsm,text/csv,text/tab-separated-values,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleSpreadsheetFileChange}
                  disabled={isUploading}
                  display="none"
                  id="spreadsheet-file-input"
                />
                
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={6}
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={file && uploadMethod === 'csv' ? "green.500" : "gray.300"}
                  borderRadius="md"
                  bg={file && uploadMethod === 'csv' ? "green.50" : "gray.50"}
                  transition="all 0.3s"
                  cursor={isUploading ? "not-allowed" : "pointer"}
                  onClick={() => {
                    if (!isUploading) {
                      document.getElementById('spreadsheet-file-input')?.click();
                    }
                  }}
                >
                  {file && uploadMethod === 'csv' ? (
                    <VStack spacing={2}>
                      <Icon as={FiFileText} boxSize={8} color="green.500" />
                      <Text fontWeight="medium">{file.name}</Text>
                      <Text fontSize="sm" color="gray.500">{(file.size / 1024).toFixed(2)} KB</Text>
                    </VStack>
                  ) : (
                    <VStack spacing={3}>
                      <Icon as={FiFileSpreadsheet} boxSize={10} color="gray.400" />
                      <Text fontWeight="medium">Click to select a file</Text>
                      <Text fontSize="sm" color="gray.500">CSV, TSV, Excel files supported</Text>
                    </VStack>
                  )}
                </Flex>
              </FormControl>
            </VStack>
          </TabPanel>
          
          {/* Image Upload Panel */}
          <TabPanel p={4}>
            <VStack spacing={4} align="stretch">
              {/* Image Upload Info */}
              <Box p={4} bg="purple.50" borderRadius="md">
                <HStack spacing={3} align="flex-start">
                  <Icon as={FiInfo} color="purple.500" boxSize={5} mt={1} />
                  <Stack spacing={2}>
                    <Heading size="sm">Schedule Image Upload</Heading>
                    <Text fontSize="sm">
                      Take a photo of your printed schedule or export a screenshot from:
                    </Text>
                    <Text fontSize="sm">
                      • League websites
                      • PDF schedules
                      • Email screenshots
                      • Team apps (TeamSnap, SportsEngine, etc.)
                    </Text>
                    <Text fontSize="sm" color="purple.600">
                      We'll automatically extract the {importType} information from your image!
                    </Text>
                  </Stack>
                </HStack>
              </Box>
              
              {/* Image Upload */}
              <FormControl>
                <FormLabel>Upload Schedule Image</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={isUploading}
                  display="none"
                  id="image-file-input"
                />
                
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={6}
                  borderWidth={2}
                  borderStyle="dashed"
                  borderColor={file && uploadMethod === 'image' ? "purple.500" : "gray.300"}
                  borderRadius="md"
                  bg={file && uploadMethod === 'image' ? "purple.50" : "gray.50"}
                  transition="all 0.3s"
                  cursor={isUploading ? "not-allowed" : "pointer"}
                  onClick={() => {
                    if (!isUploading) {
                      document.getElementById('image-file-input')?.click();
                    }
                  }}
                >
                  {file && uploadMethod === 'image' ? (
                    <VStack spacing={2}>
                      <Icon as={FiImage} boxSize={8} color="purple.500" />
                      <Text fontWeight="medium">{file.name}</Text>
                      <Text fontSize="sm" color="gray.500">{(file.size / 1024).toFixed(2)} KB</Text>
                    </VStack>
                  ) : (
                    <VStack spacing={3}>
                      <Icon as={FiImage} boxSize={10} color="gray.400" />
                      <Text fontWeight="medium">Click to select an image</Text>
                      <Text fontSize="sm" color="gray.500">or drag and drop here</Text>
                    </VStack>
                  )}
                </Flex>
              </FormControl>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* Upload Progress */}
      {isUploading && (
        <Box>
          <Text mb={2}>Uploading...</Text>
          <Progress value={uploadProgress} size="sm" colorScheme="blue" />
        </Box>
      )}
      
      {/* Upload Result */}
      {uploadResult && (
        <Alert
          status={uploadResult.success ? "success" : "error"}
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="md"
          p={4}
        >
          <Icon
            as={uploadResult.success ? FiCheck : FiX}
            boxSize={6}
            mr={0}
            mb={2}
          />
          <AlertTitle fontSize="lg" mb={2}>
            {uploadResult.success ? "Upload Successful" : "Upload Failed"}
          </AlertTitle>
          <AlertDescription>
            {uploadResult.message}
            
            {uploadResult.success && uploadResult.created !== undefined && (
              <Box mt={2}>
                <Text><strong>Created:</strong> {uploadResult.created}</Text>
                {uploadResult.failed !== undefined && uploadResult.failed > 0 && (
                  <Text><strong>Failed:</strong> {uploadResult.failed}</Text>
                )}
                <Text><strong>Total:</strong> {uploadResult.total}</Text>
              </Box>
            )}
            
            {uploadResult.success && uploadResult.status === 'processing' && (
              <Box mt={2} p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="sm">
                  Your image has been received. Our system is processing it to extract schedule information.
                </Text>
              </Box>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Action Buttons */}
      <HStack spacing={4} justify="flex-end">
        <Button 
          onClick={handleReset} 
          variant="outline" 
          isDisabled={isUploading || !file}
        >
          Reset
        </Button>
        <Button
          leftIcon={<Icon as={FiUploadCloud} />}
          colorScheme={uploadMethod === 'csv' ? "blue" : "purple"}
          onClick={handleUpload}
          isLoading={isUploading}
          loadingText="Uploading..."
          isDisabled={!file || !currentTeam}
        >
          Upload {uploadMethod === 'csv' ? 'File' : 'Image'}
        </Button>
      </HStack>
    </VStack>
  );
}