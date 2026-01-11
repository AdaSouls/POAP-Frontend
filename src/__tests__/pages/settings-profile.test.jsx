import React from 'react';
import { render, screen } from '@testing-library/react';
import SettingsProfile from '../../jsx/pages/settings-profile';
import { renderWithProviders } from '../utils/testUtils';

describe('Settings Profile Page', () => {
  it('renders under construction message', () => {
    renderWithProviders(<SettingsProfile />);
    expect(screen.getByText(/Section under construction/i)).toBeInTheDocument();
  });

  it('renders construction image', () => {
    renderWithProviders(<SettingsProfile />);
    const image = screen.getByAltText('');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('construct.png'));
  });
});

