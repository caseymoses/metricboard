import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSearch } from './UserSearch';

describe('UserSearch', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    resultsCount: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with correct placeholder', () => {
    render(<UserSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search users by name or email...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('displays the current search term', () => {
    render(<UserSearch {...defaultProps} searchTerm="john" />);
    
    const input = screen.getByDisplayValue('john');
    expect(input).toBeInTheDocument();
  });

  it('calls onSearchChange when user types', async () => {
    const mockOnSearchChange = vi.fn();
    
    render(<UserSearch {...defaultProps} onSearchChange={mockOnSearchChange} />);
    
    const input = screen.getByPlaceholderText('Search users by name or email...');
    
    // Use fireEvent for more predictable testing
    fireEvent.change(input, { target: { value: 'test' } });
    
    expect(mockOnSearchChange).toHaveBeenCalledWith('test');
  });

  it('shows clear button when search term is not empty', () => {
    render(<UserSearch {...defaultProps} searchTerm="test" />);
    
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('does not show clear button when search term is empty', () => {
    render(<UserSearch {...defaultProps} searchTerm="" />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onSearchChange with empty string when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSearchChange = vi.fn();
    
    render(<UserSearch {...defaultProps} searchTerm="test" onSearchChange={mockOnSearchChange} />);
    
    const clearButton = screen.getByRole('button');
    await user.click(clearButton);
    
    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  it('shows search icon', () => {
    render(<UserSearch {...defaultProps} />);
    
    // Look for SVG by class instead of role since SVG doesn't have img role by default
    const container = document.querySelector('.h-5.w-5.text-gray-400');
    expect(container).toBeInTheDocument();
    expect(container?.tagName).toBe('svg');
  });

  it('shows "Searching..." when resultsCount is undefined and search term exists', () => {
    render(<UserSearch {...defaultProps} searchTerm="test" resultsCount={undefined} />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('shows results count when provided', () => {
    render(<UserSearch {...defaultProps} searchTerm="test" resultsCount={5} />);
    
    expect(screen.getByText('5 results found')).toBeInTheDocument();
  });

  it('shows singular "result" when count is 1', () => {
    render(<UserSearch {...defaultProps} searchTerm="test" resultsCount={1} />);
    
    expect(screen.getByText('1 result found')).toBeInTheDocument();
  });

  it('shows help text when no results found', () => {
    render(<UserSearch {...defaultProps} searchTerm="test" resultsCount={0} />);
    
    expect(screen.getByText('0 results found')).toBeInTheDocument();
    expect(screen.getByText('- Try adjusting your search term')).toBeInTheDocument();
  });

  it('does not show results info when search term is empty', () => {
    render(<UserSearch {...defaultProps} searchTerm="" resultsCount={10} />);
    
    expect(screen.queryByText(/results found/)).not.toBeInTheDocument();
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<UserSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search users by name or email...');
    
    expect(input).toHaveClass(
      'w-full', 'px-4', 'py-3', 'pl-10', 'pr-4', 
      'border', 'border-gray-300', 'rounded-lg', 
      'focus:ring-2', 'focus:ring-blue-500', 
      'focus:border-transparent', 'outline-none', 
      'transition-colors'
    );
  });

  it('handles input change via fireEvent (alternative test)', () => {
    const mockOnSearchChange = vi.fn();
    
    render(<UserSearch {...defaultProps} onSearchChange={mockOnSearchChange} />);
    
    const input = screen.getByPlaceholderText('Search users by name or email...');
    
    fireEvent.change(input, { target: { value: 'new search' } });
    
    expect(mockOnSearchChange).toHaveBeenCalledWith('new search');
  });
});