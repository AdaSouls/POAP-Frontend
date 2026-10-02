import React from 'react';
import { render, screen } from '@testing-library/react';
import OrganizerLabel, { shortKeyId } from '../../jsx/components/OrganizerLabel';

const PK = 'a1b2c3'.padEnd(64, 'f');

describe('OrganizerLabel', () => {
  it('shows the name with the short key id next to it', () => {
    render(<OrganizerLabel name="Acme" issuerPk={PK} />);
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText(`· ${shortKeyId(PK)}`)).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('falls back to the shortened key when there is no name', () => {
    render(<OrganizerLabel name="  " issuerPk={PK} />);
    expect(screen.getByText(`${PK.slice(0, 8)}…${PK.slice(-6)}`)).toBeInTheDocument();
  });

  it('marks admin-registered organizers as Verified', () => {
    render(<OrganizerLabel name="Acme" issuerPk={PK} verified />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });
});
