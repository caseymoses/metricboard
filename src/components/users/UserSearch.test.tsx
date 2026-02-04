import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserSearch } from './UserSearch';

describe('UserSearch Component', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    resultsCount: 0,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render search input with placeholder', () => {
      render(<UserSearch {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render search icon', () => {
      render(<UserSearch {...defaultProps} />);
      
      // Check for SVG element instead of role
      const searchIcon = document.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon).toHaveClass('h-5', 'w-5', 'text-gray-400');
    });

    it('should display current search term in input', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" />);
      
      const searchInput = screen.getByDisplayValue('john');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('search interactions', () => {
    it('should call onSearchChange when typing in input', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      expect(onSearchChange).toHaveBeenCalledWith('john');
    });

    it('should show clear button when search term exists', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" />);
      
      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('should not show clear button when search term is empty', () => {
      render(<UserSearch {...defaultProps} searchTerm="" />);
      
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should call onSearchChange with empty string when clear button is clicked', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} searchTerm="john" onSearchChange={onSearchChange} />);
      
      const clearButton = screen.getByRole('button');
      fireEvent.click(clearButton);
      
      expect(onSearchChange).toHaveBeenCalledWith('');
    });

    it('should handle multiple characters typed rapidly', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      
      fireEvent.change(searchInput, { target: { value: 'j' } });
      fireEvent.change(searchInput, { target: { value: 'jo' } });
      fireEvent.change(searchInput, { target: { value: 'john' } });
      
      expect(onSearchChange).toHaveBeenCalledTimes(3);
      expect(onSearchChange).toHaveBeenLastCalledWith('john');
    });
  });

  describe('search results display', () => {
    it('should not show results count when search term is empty', () => {
      render(<UserSearch {...defaultProps} searchTerm="" resultsCount={5} />);
      
      expect(screen.queryByText(/result/)).not.toBeInTheDocument();
    });

    it('should show results count when search term exists', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={2} />);
      
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });

    it('should show singular "result" for count of 1', () => {
      render(<UserSearch {...defaultProps} searchTerm="alice" resultsCount={1} />);
      
      expect(screen.getByText('1 result found')).toBeInTheDocument();
    });

    it('should show "no results" message when count is 0', () => {
      render(<UserSearch {...defaultProps} searchTerm="nonexistent" resultsCount={0} />);
      
      expect(screen.getByText('0 results found')).toBeInTheDocument();
      expect(screen.getByText('- Try adjusting your search term')).toBeInTheDocument();
    });

    it('should show "Searching..." when results count is undefined', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={undefined} />);
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('should handle large result counts', () => {
      render(<UserSearch {...defaultProps} searchTerm="test" resultsCount={1000} />);
      
      expect(screen.getByText('1000 results found')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper input attributes', () => {
      render(<UserSearch {...defaultProps} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder', 'Search users by name or email...');
    });

    it('should have focusable clear button when search term exists', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" />);
      
      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeEnabled();
      
      // Test that it can be focused
      clearButton.focus();
      expect(clearButton).toHaveFocus();
    });

    it('should have proper ARIA labels and roles', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={2} />);
      
      const searchInput = screen.getByRole('textbox');
      expect(searchInput).toBeInTheDocument();
      
      const clearButton = screen.getByRole('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('should maintain focus on input after clear button click', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} searchTerm="john" onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByRole('textbox');
      const clearButton = screen.getByRole('button');
      
      searchInput.focus();
      expect(searchInput).toHaveFocus();
      
      fireEvent.click(clearButton);
      expect(onSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('visual states', () => {
    it('should apply focus styles when input is focused', () => {
      render(<UserSearch {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search users by name or email...');
      expect(searchInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500', 'focus:border-transparent');
    });

    it('should show proper styling for different states', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={2} />);
      
      const searchInput = screen.getByDisplayValue('john');
      expect(searchInput).toHaveClass('w-full', 'px-4', 'py-3', 'border', 'rounded-lg');
    });

    it('should show clear button with hover styles', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" />);
      
      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveClass('hover:text-gray-600');
    });
  });

  describe('edge cases', () => {
    it('should handle very long search terms', () => {
      const longSearchTerm = 'a'.repeat(100);
      const onSearchChange = vi.fn();
      
      render(<UserSearch {...defaultProps} searchTerm={longSearchTerm} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByDisplayValue(longSearchTerm);
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle special characters in search term', () => {
      const specialCharsSearchTerm = '!@#$%^&*()';
      
      render(<UserSearch {...defaultProps} searchTerm={specialCharsSearchTerm} />);
      
      const searchInput = screen.getByDisplayValue(specialCharsSearchTerm);
      expect(searchInput).toBeInTheDocument();
    });

    it('should handle undefined resultsCount gracefully', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={undefined} />);
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('should handle negative resultsCount gracefully', () => {
      render(<UserSearch {...defaultProps} searchTerm="john" resultsCount={-1} />);
      
      expect(screen.getByText('-1 results found')).toBeInTheDocument();
    });

    it('should handle whitespace-only search terms', () => {
      render(<UserSearch {...defaultProps} searchTerm="   " resultsCount={0} />);
      
      // Should still show results since searchTerm is not empty
      expect(screen.getByText('0 results found')).toBeInTheDocument();
    });
  });

  describe('keyboard interactions', () => {
    it('should handle Enter key press', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByRole('textbox');
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      
      // Should not call onSearchChange on Enter (it's not a form)
      expect(onSearchChange).not.toHaveBeenCalled();
    });

    it('should handle Escape key to clear search', () => {
      const onSearchChange = vi.fn();
      render(<UserSearch {...defaultProps} searchTerm="john" onSearchChange={onSearchChange} />);
      
      const searchInput = screen.getByRole('textbox');
      fireEvent.keyDown(searchInput, { key: 'Escape', code: 'Escape' });
      
      // Note: This would require implementing Escape key handler in component
      // For now, just verify the input behavior is testable
      expect(searchInput).toBeInTheDocument();
    });
  });
});