'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Heading,
  Text,
  Flex,
  useDisclosure,
  Badge,
  Avatar,
  Stack,
  HStack,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Container,
  Card,
  CardBody,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  FormHelperText,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Switch,
  useColorModeValue,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { ChevronDownIcon, CopyIcon } from '@chakra-ui/icons';
import { useAuth } from '../../../../contexts/auth-context';
import { Permission, PERMISSION_SETS } from '../../../../models/user';

// Types for team members
interface TeamMember {
  _id: string;
  userId: string;
  teamId: string;
  role: 'headCoach' | 'assistant' | 'fan';
  permissions: string[];
  status: 'active' | 'pending';
  joinedAt?: number;
  name: string;
  email: string;
}

interface Invitation {
  _id: string;
  email: string;
  teamId: string;
  role: 'headCoach' | 'assistant' | 'fan';
  createdAt: number;
  expiresAt: number;
  token: string;
  used: boolean;
}

interface TeamCode {
  _id: string;
  teamId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  maxUses?: number;
  uses: number;
  isActive: boolean;
}

const MembersPage = () => {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user, token } = useAuth();
  const teamId = params.id as string;

  // State
  const [teamName, setTeamName] = useState('');
  const [activeMembers, setActiveMembers] = useState<TeamMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [joinCodes, setJoinCodes] = useState<TeamCode[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  // Modal states
  const inviteModal = useDisclosure();
  const roleModal = useDisclosure();
  const codeModal = useDisclosure();
  const removeConfirmModal = useDisclosure();

  // Form states
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'fan',
    customPermissions: false,
    permissions: [...PERMISSION_SETS.FAN]
  });

  const [roleFormData, setRoleFormData] = useState({
    memberId: '',
    userId: '',
    name: '',
    role: '',
    customPermissions: false,
    permissions: [] as string[]
  });

  const [codeFormData, setCodeFormData] = useState({
    expiresInHours: 48,
    maxUses: 0,
    limitUses: false
  });

  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Fetch team and member data
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch team details
        const teamResponse = await fetch(`/api/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!teamResponse.ok) {
          throw new Error('Failed to fetch team data');
        }
        
        const teamData = await teamResponse.json();
        setTeamName(teamData.team.name);
        
        // Set user permissions from membership
        if (teamData.userMembership) {
          setUserPermissions(teamData.userMembership.permissions);
        }
        
        // Fetch active members
        const activeMembersResponse = await fetch(`/api/teams/${teamId}/members?status=active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (activeMembersResponse.ok) {
          const activeMembersData = await activeMembersResponse.json();
          setActiveMembers(activeMembersData.members.map((item: any) => ({
            ...item.membership,
            name: item.user.name,
            email: item.user.email
          })));
        }
        
        // Fetch pending requests if user has permission
        if (userPermissions.includes(Permission.APPROVE_FANS)) {
          const pendingResponse = await fetch(`/api/teams/${teamId}/members?status=pending`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json();
            setPendingRequests(pendingData.members.map((item: any) => ({
              ...item.membership,
              name: item.user.name,
              email: item.user.email
            })));
          }
        }
        
        // Fetch invitations if user has permission
        if (userPermissions.includes(Permission.MANAGE_USERS)) {
          const invitationsResponse = await fetch(`/api/teams/${teamId}/invitations`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (invitationsResponse.ok) {
            const invitationsData = await invitationsResponse.json();
            setInvitations(invitationsData.invitations);
          }
          
          // Fetch join codes
          const codesResponse = await fetch(`/api/teams/${teamId}/codes`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (codesResponse.ok) {
            const codesData = await codesResponse.json();
            setJoinCodes(codesData.codes);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (teamId && token) {
      fetchTeamData();
    }
  }, [teamId, token, userPermissions, toast]);

  // Handle invite submission
  const handleInviteSubmit = async () => {
    try {
      const { email, role, customPermissions, permissions } = inviteFormData;
      
      if (!email) {
        toast({
          title: 'Email required',
          description: 'Please enter an email address',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teamId,
          email,
          role,
          permissions: customPermissions ? permissions : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Invitation sent',
          description: data.warning 
            ? 'Invitation created but email could not be sent. You can resend it later.' 
            : `Invitation sent to ${email}`,
          status: data.warning ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Add new invitation to list
        if (data.invitation) {
          setInvitations(prev => [data.invitation, ...prev]);
        }
        
        // Reset form and close modal
        setInviteFormData({
          email: '',
          role: 'fan',
          customPermissions: false,
          permissions: [...PERMISSION_SETS.FAN]
        });
        
        inviteModal.onClose();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send invitation',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle resending an invitation
  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/auth/invite/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Invitation resent',
          description: data.warning 
            ? 'Invitation resent but email could not be delivered' 
            : 'Invitation resent successfully',
          status: data.warning ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to resend invitation',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle deleting an invitation
  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/auth/invite/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Invitation deleted',
          description: 'Invitation has been deleted',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to delete invitation',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invitation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Open role edit modal
  const openRoleModal = (member: TeamMember) => {
    setRoleFormData({
      memberId: member._id,
      userId: member.userId,
      name: member.name,
      role: member.role,
      customPermissions: false,
      permissions: [...member.permissions]
    });
    roleModal.onOpen();
  };

  // Handle updating member role/permissions
  const handleRoleUpdate = async () => {
    try {
      const { memberId, role, customPermissions, permissions } = roleFormData;
      
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role,
          permissions: customPermissions ? permissions : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Member updated',
          description: 'Member role and permissions updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Update member in list
        setActiveMembers(prev => 
          prev.map(member => {
            if (member._id === memberId) {
              return {
                ...member,
                role,
                permissions: customPermissions ? permissions : getDefaultPermissions(role)
              };
            }
            return member;
          })
        );
        
        roleModal.onClose();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update member',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Prepare for member removal
  const confirmRemoveMember = (member: TeamMember) => {
    setMemberToRemove(member);
    removeConfirmModal.onOpen();
  };

  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberToRemove._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Member removed',
          description: `${memberToRemove.name} has been removed from the team`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove from list
        setActiveMembers(prev => prev.filter(m => m._id !== memberToRemove._id));
        
        removeConfirmModal.onClose();
        setMemberToRemove(null);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to remove member',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle approving a join request
  const handleApproveRequest = async (requestId: string, newRole: 'fan' | 'assistant' | 'headCoach' = 'fan') => {
    try {
      const response = await fetch('/api/auth/team/join-request/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          role: newRole
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Request approved',
          description: 'Join request has been approved',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove from pending list and add to active list
        const approvedMember = pendingRequests.find(req => req._id === requestId);
        if (approvedMember) {
          const updatedMember = {
            ...approvedMember,
            status: 'active' as const,
            role: newRole,
            permissions: getDefaultPermissions(newRole)
          };
          
          setPendingRequests(prev => prev.filter(req => req._id !== requestId));
          setActiveMembers(prev => [updatedMember, ...prev]);
        }
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to approve request',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle denying a join request
  const handleDenyRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/auth/team/join-request/deny', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Request denied',
          description: 'Join request has been denied',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Remove from pending list
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to deny request',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error denying request:', error);
      toast({
        title: 'Error',
        description: 'Failed to deny request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle generating a join code
  const handleGenerateCode = async () => {
    try {
      const { expiresInHours, limitUses, maxUses } = codeFormData;
      
      const response = await fetch(`/api/teams/${teamId}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expiresInHours,
          maxUses: limitUses ? maxUses : undefined
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Code generated',
          description: `Team join code: ${data.code}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Add new code to list
        if (data.teamCode) {
          setJoinCodes(prev => [data.teamCode, ...prev]);
        }
        
        // Reset form and close modal
        setCodeFormData({
          expiresInHours: 48,
          maxUses: 0,
          limitUses: false
        });
        
        codeModal.onClose();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate code',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate code',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Copy join code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(''), 2000);
      },
      () => {
        toast({
          title: 'Copy failed',
          description: 'Failed to copy code to clipboard',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    );
  };

  // Format date for display
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // Get default permissions for a role
  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'headCoach':
        return [...PERMISSION_SETS.HEAD_COACH];
      case 'assistant':
        return [...PERMISSION_SETS.ASSISTANT_COACH];
      case 'fan':
      default:
        return [...PERMISSION_SETS.FAN];
    }
  };

  // Handle role selection change in invite form
  const handleInviteRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'headCoach' | 'assistant' | 'fan';
    setInviteFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  // Handle permission checkbox toggle in invite form
  const handleInvitePermissionToggle = (permission: string) => {
    setInviteFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      
      return {
        ...prev,
        permissions: newPermissions
      };
    });
  };

  // Handle role selection change in role edit form
  const handleRoleFormRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'headCoach' | 'assistant' | 'fan';
    setRoleFormData(prev => ({
      ...prev,
      role,
      permissions: getDefaultPermissions(role)
    }));
  };

  // Handle permission checkbox toggle in role edit form
  const handleRoleFormPermissionToggle = (permission: string) => {
    setRoleFormData(prev => {
      const newPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      
      return {
        ...prev,
        permissions: newPermissions
      };
    });
  };

  // Get human-readable role name
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

  // Get badge color for role
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'headCoach':
        return 'red';
      case 'assistant':
        return 'orange';
      case 'fan':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Check if user has a permission
  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };

  // Permission checkboxes for forms
  const permissionCheckboxes = (
    formType: 'invite' | 'role',
    permissions: string[],
    handleToggle: (permission: string) => void
  ) => (
    <Stack spacing={2} mt={4}>
      <Checkbox
        isChecked={permissions.includes(Permission.VIEW_LINEUPS)}
        onChange={() => handleToggle(Permission.VIEW_LINEUPS)}
      >
        View lineups
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.MANAGE_LINEUPS)}
        onChange={() => handleToggle(Permission.MANAGE_LINEUPS)}
      >
        Manage lineups
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.VIEW_PLAYERS)}
        onChange={() => handleToggle(Permission.VIEW_PLAYERS)}
      >
        View roster
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.MANAGE_PLAYERS)}
        onChange={() => handleToggle(Permission.MANAGE_PLAYERS)}
      >
        Manage roster
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.VIEW_GAMES)}
        onChange={() => handleToggle(Permission.VIEW_GAMES)}
      >
        View games
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.MANAGE_GAMES)}
        onChange={() => handleToggle(Permission.MANAGE_GAMES)}
      >
        Manage games
      </Checkbox>
      <Checkbox
        isChecked={permissions.includes(Permission.APPROVE_FANS)}
        onChange={() => handleToggle(Permission.APPROVE_FANS)}
      >
        Approve join requests
      </Checkbox>
      {formType === 'role' && (
        <Checkbox
          isChecked={permissions.includes(Permission.MANAGE_USERS)}
          onChange={() => handleToggle(Permission.MANAGE_USERS)}
        >
          Manage team members
        </Checkbox>
      )}
    </Stack>
  );

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" thickness="4px" color="primary.500" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">
            {teamName} - Team Members
          </Heading>
          
          {hasPermission(Permission.MANAGE_USERS) && (
            <HStack>
              <Button
                colorScheme="primary"
                onClick={inviteModal.onOpen}
                size="md"
              >
                Invite Member
              </Button>
              <Button
                colorScheme="gray"
                onClick={codeModal.onOpen}
                size="md"
              >
                Generate Join Code
              </Button>
            </HStack>
          )}
        </Flex>
        <Text color="gray.600">
          Manage team members, invitations, and access permissions
        </Text>
      </Box>

      <Tabs variant="enclosed" colorScheme="primary" isLazy>
        <TabList>
          <Tab>Active Members</Tab>
          {hasPermission(Permission.APPROVE_FANS) && pendingRequests.length > 0 && (
            <Tab>
              Pending Requests
              <Badge ml={2} colorScheme="red" borderRadius="full">
                {pendingRequests.length}
              </Badge>
            </Tab>
          )}
          {hasPermission(Permission.MANAGE_USERS) && (
            <Tab>Invitations</Tab>
          )}
          {hasPermission(Permission.MANAGE_USERS) && (
            <Tab>Join Codes</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Active Members Tab */}
          <TabPanel>
            {activeMembers.length === 0 ? (
              <Box textAlign="center" p={8}>
                <Text color="gray.500">No team members found</Text>
              </Box>
            ) : (
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                  <Tr>
                    <Th>Member</Th>
                    <Th>Role</Th>
                    <Th>Joined</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {activeMembers.map((member) => (
                    <Tr key={member._id}>
                      <Td>
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={member.name}
                            bg="primary.500"
                          />
                          <Box>
                            <Text fontWeight="medium">{member.name}</Text>
                            <Text fontSize="sm" color="gray.600">{member.email}</Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getRoleBadgeColor(member.role)}>
                          {getRoleName(member.role)}
                        </Badge>
                      </Td>
                      <Td>{formatDate(member.joinedAt)}</Td>
                      <Td>
                        {hasPermission(Permission.MANAGE_USERS) && (
                          <HStack>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRoleModal(member)}
                              isDisabled={member.userId === user?.id}
                            >
                              Edit Role
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => confirmRemoveMember(member)}
                              isDisabled={member.userId === user?.id}
                            >
                              Remove
                            </Button>
                          </HStack>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </TabPanel>

          {/* Pending Requests Tab */}
          {hasPermission(Permission.APPROVE_FANS) && (
            <TabPanel>
              {pendingRequests.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Text color="gray.500">No pending join requests</Text>
                </Box>
              ) : (
                <Stack spacing={4}>
                  {pendingRequests.map((request) => (
                    <Card key={request._id} variant="outline">
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <HStack spacing={4}>
                            <Avatar
                              size="md"
                              name={request.name}
                              bg="primary.500"
                            />
                            <Box>
                              <Text fontWeight="semibold">{request.name}</Text>
                              <Text fontSize="sm" color="gray.600">{request.email}</Text>
                            </Box>
                          </HStack>
                          <HStack>
                            <Select
                              variant="outline"
                              size="sm"
                              value="fan"
                              width="120px"
                              onChange={(e) => {
                                // Just placeholder for role selection
                              }}
                            >
                              <option value="fan">Parent/Fan</option>
                              <option value="assistant">Assistant</option>
                              <option value="headCoach">Head Coach</option>
                            </Select>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleApproveRequest(request._id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDenyRequest(request._id)}
                            >
                              Deny
                            </Button>
                          </HStack>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              )}
            </TabPanel>
          )}

          {/* Invitations Tab */}
          {hasPermission(Permission.MANAGE_USERS) && (
            <TabPanel>
              {invitations.length === 0 ? (
                <Box textAlign="center" p={8}>
                  <Text color="gray.500">No pending invitations</Text>
                  <Button
                    mt={4}
                    colorScheme="primary"
                    onClick={inviteModal.onOpen}
                  >
                    Invite Someone
                  </Button>
                </Box>
              ) : (
                <Table variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                    <Tr>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Expires</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {invitations.map((invitation) => (
                      <Tr key={invitation._id} opacity={invitation.used ? 0.6 : 1}>
                        <Td>{invitation.email}</Td>
                        <Td>
                          <Badge colorScheme={getRoleBadgeColor(invitation.role)}>
                            {getRoleName(invitation.role)}
                          </Badge>
                        </Td>
                        <Td>{formatDate(invitation.expiresAt)}</Td>
                        <Td>
                          {invitation.used ? (
                            <Badge colorScheme="green">Used</Badge>
                          ) : (
                            <Badge colorScheme="blue">Pending</Badge>
                          )}
                        </Td>
                        <Td>
                          {!invitation.used && (
                            <HStack>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendInvitation(invitation._id)}
                              >
                                Resend
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                onClick={() => handleDeleteInvitation(invitation._id)}
                              >
                                Delete
                              </Button>
                            </HStack>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </TabPanel>
          )}

          {/* Join Codes Tab */}
          {hasPermission(Permission.MANAGE_USERS) && (
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <Text fontWeight="medium" mb={2}>
                    Join Codes
                  </Text>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Create and manage team join codes that allow others to join this team.
                  </Text>
                  <Button colorScheme="primary" onClick={codeModal.onOpen}>
                    Generate New Code
                  </Button>
                </Box>

                {joinCodes.length === 0 ? (
                  <Box textAlign="center" p={6} borderWidth="1px" borderRadius="md">
                    <Text color="gray.500">No join codes created yet</Text>
                  </Box>
                ) : (
                  <Table variant="simple" borderWidth="1px" borderRadius="md">
                    <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
                      <Tr>
                        <Th>Code</Th>
                        <Th>Created</Th>
                        <Th>Expires</Th>
                        <Th>Usage</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {joinCodes.map((code) => (
                        <Tr key={code._id} opacity={!code.isActive ? 0.6 : 1}>
                          <Td>
                            <HStack>
                              <Text fontWeight="medium">{code.code}</Text>
                              <IconButton
                                aria-label="Copy code"
                                icon={<CopyIcon />}
                                size="xs"
                                onClick={() => copyToClipboard(code.code)}
                                colorScheme={copySuccess === code.code ? "green" : "gray"}
                              />
                            </HStack>
                          </Td>
                          <Td>{formatDate(code.createdAt)}</Td>
                          <Td>{formatDate(code.expiresAt)}</Td>
                          <Td>
                            {code.uses} {code.maxUses ? `/ ${code.maxUses}` : ''}
                          </Td>
                          <Td>
                            {code.isActive ? (
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => {
                                  // Deactivate code logic would go here
                                  toast({
                                    title: 'Code deactivated',
                                    status: 'info',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                }}
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Badge colorScheme="red">Inactive</Badge>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}

                <Box
                  mt={4}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  bg={useColorModeValue('gray.50', 'gray.700')}
                >
                  <Heading size="sm" mb={2}>Join Link</Heading>
                  <Text fontSize="sm" mb={3}>
                    Share this link directly with people you want to join your team:
                  </Text>
                  <InputGroup size="md">
                    <Input
                      pr="4.5rem"
                      value={`${window.location.origin}/join?team=${teamId}`}
                      readOnly
                      bg="white"
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/join?team=${teamId}`)}
                      >
                        Copy
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </Box>
              </VStack>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* Invite Member Modal */}
      <Modal isOpen={inviteModal.isOpen} onClose={inviteModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invite New Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input 
                  type="email"
                  placeholder="Enter email address"
                  value={inviteFormData.email}
                  onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={inviteFormData.role}
                  onChange={handleInviteRoleChange}
                >
                  <option value="fan">Parent/Fan</option>
                  <option value="assistant">Assistant Coach</option>
                  <option value="headCoach">Head Coach</option>
                </Select>
                <FormHelperText>
                  This determines their default permissions
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="custom-permissions" mb="0">
                  Customize permissions
                </FormLabel>
                <Switch
                  id="custom-permissions"
                  isChecked={inviteFormData.customPermissions}
                  onChange={(e) => setInviteFormData(prev => ({
                    ...prev,
                    customPermissions: e.target.checked
                  }))}
                />
              </FormControl>
              
              {inviteFormData.customPermissions && (
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  {permissionCheckboxes(
                    'invite',
                    inviteFormData.permissions,
                    handleInvitePermissionToggle
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={inviteModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleInviteSubmit}>
              Send Invitation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={roleModal.isOpen} onClose={roleModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Member Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Member</FormLabel>
                <Text fontWeight="medium">{roleFormData.name}</Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={roleFormData.role}
                  onChange={handleRoleFormRoleChange}
                >
                  <option value="fan">Parent/Fan</option>
                  <option value="assistant">Assistant Coach</option>
                  <option value="headCoach">Head Coach</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="role-custom-permissions" mb="0">
                  Customize permissions
                </FormLabel>
                <Switch
                  id="role-custom-permissions"
                  isChecked={roleFormData.customPermissions}
                  onChange={(e) => setRoleFormData(prev => ({
                    ...prev,
                    customPermissions: e.target.checked
                  }))}
                />
              </FormControl>
              
              {roleFormData.customPermissions && (
                <Box borderWidth="1px" borderRadius="md" p={3}>
                  {permissionCheckboxes(
                    'role',
                    roleFormData.permissions,
                    handleRoleFormPermissionToggle
                  )}
                </Box>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={roleModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleRoleUpdate}>
              Update Role
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Generate Join Code Modal */}
      <Modal isOpen={codeModal.isOpen} onClose={codeModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate Join Code</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Code Expiration</FormLabel>
                <Select
                  value={codeFormData.expiresInHours}
                  onChange={(e) => setCodeFormData(prev => ({
                    ...prev,
                    expiresInHours: parseInt(e.target.value)
                  }))}
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">7 days</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="limit-uses" mb="0">
                  Limit number of uses
                </FormLabel>
                <Switch
                  id="limit-uses"
                  isChecked={codeFormData.limitUses}
                  onChange={(e) => setCodeFormData(prev => ({
                    ...prev,
                    limitUses: e.target.checked
                  }))}
                />
              </FormControl>
              
              {codeFormData.limitUses && (
                <FormControl>
                  <FormLabel>Maximum Uses</FormLabel>
                  <Input
                    type="number"
                    value={codeFormData.maxUses}
                    onChange={(e) => setCodeFormData(prev => ({
                      ...prev,
                      maxUses: parseInt(e.target.value)
                    }))}
                    min={1}
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={codeModal.onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleGenerateCode}>
              Generate Code
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Member Confirmation */}
      <AlertDialog
        isOpen={removeConfirmModal.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={removeConfirmModal.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Team Member
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove {memberToRemove?.name} from the team?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={removeConfirmModal.onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleRemoveMember} ml={3}>
                Remove
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default MembersPage;