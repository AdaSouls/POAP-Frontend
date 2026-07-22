import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventFilters from '../../jsx/components/EventFilters';

describe('EventFilters Component', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnReset = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filters component', () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);
    expect(screen.getByText(/Filters & Sort/i)).toBeInTheDocument();
  });

  it('expands and collapses filter panel', async () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);

    const expandButton = screen.getByText(/Expand/i);
    await userEvent.click(expandButton);

    expect(screen.getByLabelText(/Event ID contains/i)).toBeInTheDocument();

    const collapseButton = screen.getByText(/Collapse/i);
    await userEvent.click(collapseButton);

    expect(screen.queryByLabelText(/Event ID contains/i)).not.toBeInTheDocument();
  });

  it('calls onFilterChange when event id search is entered', async () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);

    await userEvent.click(screen.getByText(/Expand/i));
    await userEvent.type(screen.getByLabelText(/Event ID contains/i), 'ab');

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('calls onFilterChange when status is selected', async () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);

    await userEvent.click(screen.getByText(/Expand/i));
    await userEvent.selectOptions(screen.getByLabelText(/^Status$/i), 'active');

    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('calls onReset when clear button is clicked', async () => {
    render(
      <EventFilters
        filters={{ eventIdSearch: 'ab', status: 'active' }}
        onFilterChange={mockOnFilterChange}
        onReset={mockOnReset}
      />
    );

    await userEvent.click(screen.getByText(/Clear/i));

    expect(mockOnReset).toHaveBeenCalled();
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });
});
