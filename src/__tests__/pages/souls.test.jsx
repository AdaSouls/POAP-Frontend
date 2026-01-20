import React from 'react';
import { render, screen } from '@testing-library/react';
import Souls from '../../jsx/pages/souls';
import { renderWithProviders } from '../../testUtils';

// Mock Events component
jest.mock('../../jsx/components/events', () => {
  return function MockEvents() {
    return <div data-testid="events-component">Events Component</div>;
  };
});

describe('Souls Page', () => {
  it('renders souls page with Events component', () => {
    renderWithProviders(<Souls />);
    expect(screen.getByTestId('events-component')).toBeInTheDocument();
  });
});

