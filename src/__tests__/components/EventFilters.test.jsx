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

    expect(screen.getByPlaceholderText(/Search events by title/i)).toBeInTheDocument();
    
    const collapseButton = screen.getByText(/Collapse/i);
    await userEvent.click(collapseButton);

    expect(screen.queryByPlaceholderText(/Search events by title/i)).not.toBeInTheDocument();
  });

  it('calls onFilterChange when title search is entered', async () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);
    
    const expandButton = screen.getByText(/Expand/i);
    await userEvent.click(expandButton);

    const searchInput = screen.getByPlaceholderText(/Search events by title/i);
    await userEvent.type(searchInput, 'test event');

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('calls onFilterChange when status is selected', async () => {
    render(<EventFilters filters={{}} onFilterChange={mockOnFilterChange} onReset={mockOnReset} />);
    
    const expandButton = screen.getByText(/Expand/i);
    await userEvent.click(expandButton);

    const [statusSelect] = screen.getAllByRole('combobox');
    await userEvent.selectOptions(statusSelect, 'Active');

    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('calls onReset when clear button is clicked', async () => {
    render(
      <EventFilters 
        filters={{ titleSearch: 'test', calculatedStatus: 'active' }} 
        onFilterChange={mockOnFilterChange} 
        onReset={mockOnReset} 
      />
    );

    const clearButton = screen.getByText(/Clear/i);
    await userEvent.click(clearButton);

    expect(mockOnReset).toHaveBeenCalled();
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('shows active filters badges', async () => {
    render(
      <EventFilters 
        filters={{ titleSearch: 'test', calculatedStatus: 'active' }} 
        onFilterChange={mockOnFilterChange} 
        onReset={mockOnReset} 
      />
    );

    const expandButton = screen.getByText(/Expand/i);
    await userEvent.click(expandButton);

    expect(screen.getByText(/Title: "test"/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: Active/i)).toBeInTheDocument();
  });

  it('allows removing individual filter badges', async () => {
    render(
      <EventFilters 
        filters={{ titleSearch: 'test', calculatedStatus: 'active' }} 
        onFilterChange={mockOnFilterChange} 
        onReset={mockOnReset} 
      />
    );

    const expandButton = screen.getByText(/Expand/i);
    await userEvent.click(expandButton);

    const closeButtons = screen.getAllByRole('button', { name: '' });
    // Find the close button for title filter
    await userEvent.click(closeButtons[0]);

    expect(mockOnFilterChange).toHaveBeenCalled();
  });
});

