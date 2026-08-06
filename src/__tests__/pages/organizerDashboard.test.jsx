import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import OrganizerDashboard from '../../jsx/pages/organizerDashboard';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getAllEvents } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('OrganizerDashboard', () => {
  const mockEvents = [
    { eventId: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 10, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 1 },
    { eventId: 'cc'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 100, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 2 },
    { eventId: 'ee'.repeat(32), issuerPk: 'ff'.repeat(32), maxSupply: 50, minted: 5, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('shows wallet-not-connected state when no wallet is connected', () => {
    renderWithProviders(<OrganizerDashboard />);
    expect(getAllEvents).not.toHaveBeenCalled();
  });

  it('shows an access-required message for a connected wallet without organizer role', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'zz'.repeat(32) } },
    };
    renderWithProviders(<OrganizerDashboard />, { drawerValue, userRolesValue: { ...mockUserRoles, isAdmin: false, isIssuer: false } });
    expect(screen.getByText(/organizer access required/i)).toBeInTheDocument();
  });

  it('shows only my events and their aggregate mint count for an issuer', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32) } },
    };
    renderWithProviders(<OrganizerDashboard />, {
      drawerValue,
      userRolesValue: { ...mockUserRoles, isIssuer: true },
    });

    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText('2 Events')).toBeInTheDocument();
    });
    expect(screen.getByText('110')).toBeInTheDocument();
  });

  it('shows all events for an admin', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'zz'.repeat(32) } },
    };
    renderWithProviders(<OrganizerDashboard />, {
      drawerValue,
      userRolesValue: { ...mockUserRoles, isAdmin: true },
    });

    await waitFor(() => {
      expect(screen.getByText('3 Events')).toBeInTheDocument();
    });
  });
});
