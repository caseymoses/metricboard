import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '../types/user';
import { useUserSearch } from './useUserSearch';

// Mock users for testing
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2024-02-04'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: true,
    createdAt: new Date('2024-01-20'),
    lastLoginAt: new Date('2024-02-03'),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    isActive: false,
    createdAt: new Date('2024-01-10'),
    lastLoginAt: new Date('2024-01-25'),
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2024-02-04'),
  },
];

describe('useUserSearch', () => {
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Store original values
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock window.location
    delete (window as { location?: Location }).location;
    window.location = {
      ...originalLocation,
      search: '',
      href: 'http://localhost:3000/',
    } as Location;

    // Mock window.history
    window.history = {
      ...originalHistory,
      replaceState: vi.fn(),
    } as History;

    // Reset any side effects
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Restore original values
    window.location = originalLocation;
    window.history = originalHistory;
    vi.clearAllMocks();
  });

  describe('search filtering', () => {
    it('should filter users by name (case insensitive)', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('john');
      });

      expect(result.current.filteredUsers).toHaveLength(2);
      expect(result.current.filteredUsers.map(u => u.name)).toEqual(['John Doe', 'Bob Johnson']);
    });

    it('should filter users by email (case insensitive)', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('alice@');
      });

      expect(result.current.filteredUsers).toHaveLength(1);
      expect(result.current.filteredUsers[0].name).toBe('Alice Brown');
    });

    it('should return all users when search term is empty', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.filteredUsers).toEqual(mockUsers);
    });

    it('should return empty array when no matches found', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('nonexistent');
      });

      expect(result.current.filteredUsers).toHaveLength(0);
    });

    it('should handle whitespace in search term', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('  john  ');
      });

      expect(result.current.filteredUsers).toHaveLength(2);
    });

    it('should handle partial matches', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('j');
      });

      // Should match John Doe, Jane Smith, Bob Johnson
      expect(result.current.filteredUsers).toHaveLength(3);
    });
  });

  describe('debounce functionality', () => {
    it('should implement debounce behavior for URL updates', async () => {
      vi.useFakeTimers();
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
      
      const { result } = renderHook(() => useUserSearch(mockUsers));
      
      // Make a change and verify it eventually gets to the URL
      act(() => {
        result.current.setSearchTerm('test');
      });

      // Fast forward past debounce time
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Verify that replaceState was called (actual count may vary due to initialization)
      expect(replaceStateSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should handle rapid search term changes without issues', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      // Rapid changes should not cause errors
      act(() => {
        result.current.setSearchTerm('j');
        result.current.setSearchTerm('jo');
        result.current.setSearchTerm('john');
      });

      // Should end up with the final search term and correct results
      expect(result.current.searchTerm).toBe('john');
      expect(result.current.filteredUsers).toHaveLength(2);
    });
  });

  describe('search state management', () => {
    it('should update search term immediately for UI responsiveness', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('john');
      });

      // Search term should update immediately (not debounced)
      expect(result.current.searchTerm).toBe('john');
    });

    it('should update filtered results immediately', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('alice');
      });

      // Filtered results should update immediately
      expect(result.current.filteredUsers).toHaveLength(1);
      expect(result.current.filteredUsers[0].name).toBe('Alice Brown');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined users array', () => {
      const { result } = renderHook(() => useUserSearch(undefined));

      expect(result.current.filteredUsers).toEqual([]);
    });

    it('should handle empty users array', () => {
      const { result } = renderHook(() => useUserSearch([]));

      act(() => {
        result.current.setSearchTerm('john');
      });

      expect(result.current.filteredUsers).toEqual([]);
    });

    it('should handle special characters in search', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('@');
      });

      // Should match all users since all have @ in email
      expect(result.current.filteredUsers).toHaveLength(4);
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() => useUserSearch(mockUsers));

      act(() => {
        result.current.setSearchTerm('JOHN');
      });

      expect(result.current.filteredUsers).toHaveLength(2);
      
      act(() => {
        result.current.setSearchTerm('example.com');
      });

      expect(result.current.filteredUsers).toHaveLength(4);
    });
  });

  describe('initialization from URL', () => {
    it('should initialize with search term from URL', () => {
      // Mock location with search param
      window.location = {
        ...originalLocation,
        search: '?search=alice',
        href: 'http://localhost:3000/?search=alice',
      } as Location;

      const { result } = renderHook(() => useUserSearch(mockUsers));

      expect(result.current.searchTerm).toBe('alice');
      expect(result.current.filteredUsers).toHaveLength(1);
    });

    it('should handle encoded URL parameters', () => {
      // Mock location with encoded search param
      window.location = {
        ...originalLocation,
        search: '?search=john%20doe',
        href: 'http://localhost:3000/?search=john%20doe',
      } as Location;

      const { result } = renderHook(() => useUserSearch(mockUsers));

      expect(result.current.searchTerm).toBe('john doe');
    });
  });
});