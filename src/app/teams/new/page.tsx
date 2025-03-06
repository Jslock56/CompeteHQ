"use client";

import React from 'react';
import NextLink from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from '@chakra-ui/react';
import TeamForm from '../../../components/forms/team-form';
import { PageContainer } from '../../../components/layout/page-container';

/**
 * Page for creating a new team
 */
export default function NewTeamPage() {
  return (
    <PageContainer
      title="Create New Team"
      subtitle="Enter your team information to get started."
      breadcrumbs={[
        { label: 'Teams', href: '/teams' },
        { label: 'Create New Team' }
      ]}
    >
      {/* Form Card */}
      <TeamForm />
    </PageContainer>
  );
}