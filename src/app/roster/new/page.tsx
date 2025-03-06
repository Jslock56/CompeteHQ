"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { withTeam } from '../../../contexts/team-context';
import { useTeamContext } from '../../../contexts/team-context';
import PlayerForm from '../../../components/forms/player-form';
import { PageContainer } from '../../../components/layout/page-container';
import { Card } from '../../../components/common/card';

/**
 * Page for creating a new player
 */
function NewPlayerPage() {
  const { currentTeam } = useTeamContext();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('teamId') || currentTeam?.id;
  
  return (
    <PageContainer
      title="Add New Player"
      subtitle="Enter player information to add to your roster."
      breadcrumbs={[
        { label: 'Roster', href: '/roster' },
        { label: 'Add New Player' }
      ]}
    >
      {/* Form Card */}
      <Card>
        <PlayerForm />
      </Card>
    </PageContainer>
  );
}

export default withTeam(NewPlayerPage);