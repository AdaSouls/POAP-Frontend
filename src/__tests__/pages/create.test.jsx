import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Create from '../../jsx/pages/create';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getAllEvents } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('Create Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue([]);
  });

  it('renders POAP Event Creation header', () => {
    renderWithProviders(<Create />);
    expect(screen.getByText(/POAP EVENT CREATION/i)).toBeInTheDocument();
  });

  it('renders create event card', () => {
    renderWithProviders(<Create />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/POAP EVENT/i).length).toBeGreaterThan(0);
  });

  it('dispatches CREATE_EVENT when create button is clicked by an organizer', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'aa'.repeat(32) } },
    };

    renderWithProviders(<Create />, {
      drawerValue,
      drawerDispatch: dispatch,
      userRolesValue: { ...mockUserRoles, isIssuer: true },
    });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('shows an admin-contact message instead of creating when wallet is not an organizer', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'aa'.repeat(32) } },
    };

    renderWithProviders(<Create />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).not.toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('shows connect wallet button when no wallet is connected', () => {
    renderWithProviders(<Create />);
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('loads the organizer\'s own events when a wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'aa'.repeat(32) } },
    };

    renderWithProviders(<Create />, { drawerValue });

    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
  });
});
