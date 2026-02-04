import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSearch } from './UserSearch';

// Mock console.warn to avoid URL manipulation warnings in tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

describe('UserSearch', () => {
  const mockProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    resultsCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with correct placeholder', () => {
    render(<UserSearch {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users by name or email...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays the search term in the input', () => {
    render(<UserSearch {...mockProps} searchTerm="john" />);
    
    const searchInput = screen.getByDisplayValue('john');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when input value changes', () => {
    render(<UserSearch {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search users by name or email...');
    fireEvent.change(searchInput, { target: { value: 'jane' } });
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('jane');
  });

  it('shows clear button when search term exists', () => {
    render(<UserSearch {...mockProps} searchTerm="test" />);
    
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when search term is empty', () => {
    render(<UserSearch {...mockProps} searchTerm="" />);
    
    const clearButton = screen.queryByRole('button');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('calls onSearchChange with empty string when clear button is clicked', () => {
    render(<UserSearch {...mockProps} searchTerm="test" />);
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('shows results count when search term exists', () => {
    render(<UserSearch {...mockProps} searchTerm="test" resultsCount={3} />);
    
    expect(screen.getByText('3 results found')).toBeInTheDocument();
  });

  it('shows singular result text for one result', () => {
    render(<UserSearch {...mockProps} searchTerm="test" resultsCount={1} />);
    
    expect(screen.getByText('1 result found')).toBeInTheDocument();
  });

  it('shows no results message when resultsCount is 0', () => {
    render(<UserSearch {...mockProps} searchTerm="test" resultsCount={0} />);
    
    expect(screen.getByText('0 results found')).toBeInTheDocument();
    expect(screen.getByText('- Try adjusting your search term')).toBeInTheDocument();
  });

  it('does not show results count when search term is empty', () => {
    render(<UserSearch {...mockProps} searchTerm="" resultsCount={5} />);
    
    expect(screen.queryByText(/results? found/)).not.toBeInTheDocument();
  });

  it('shows searching message when resultsCount is undefined', () => {
    render(<UserSearch {...mockProps} searchTerm="test" resultsCount={undefined} />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('has correct input styling and accessibility', () => {
    render(<UserSearch {...mockProps} />);
    
    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toHaveClass('w-full', 'px-4', 'py-3', 'pl-10', 'pr-4');
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('shows search icon', () => {
    render(<UserSearch {...mockProps} />);
    
    const searchIcon = document.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveClass('h-5', 'w-5', 'text-gray-400');
  });
});