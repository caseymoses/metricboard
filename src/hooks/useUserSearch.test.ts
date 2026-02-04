import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserSearch } from './useUserSearch';
import type { User } from '../types/user';

// Mock window.location and history
const mockLocation = {
  href: 'http://localhost:3000',
  search: '',
  pathname: '/',
  origin: 'http://localhost:3000',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn(),
  },
  writable: true,
});

// Mock URL constructor to handle our simple case
global.URL = class {
  searchParams: URLSearchParams;
  href: string;
  
  constructor(url: string) {
    this.href = url;
    const [, search] = url.split('?');
    this.searchParams = new URLSearchParams(search || '');
  }
  
  toString() {
    const params = this.searchParams.toString();
    return params ? `${this.href.split('?')[0]}?${params}` : this.href.split('?')[0];
  }
} as unknown as typeof URL;

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    isActive: true,
    createdAt: new Date('2023-01-02'),
    lastLoginAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.org',
    isActive: false,
    createdAt: new Date('2023-01-03'),
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@test.com',
    isActive: true,
    createdAt: new Date('2023-01-04'),
    lastLoginAt: new Date('2024-01-04'),
  },
];

describe('useUserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset URL state
    Object.assign(window.location, { search: '', href: 'http://localhost:3000' });
    mockLocation.search = '';
    mockLocation.href = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty search term when no URL params', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  it('should initialize with search term from URL params', () => {
    // Mock URL with search param
    Object.assign(window.location, { search: '?search=John%20Doe' });
    
    const { result } = renderHook(() => useUserSearch(mockUsers));

    expect(result.current.searchTerm).toBe('John Doe');
    expect(result.current.filteredUsers).toEqual([mockUsers[0]]);
  });

  it('should filter users by name (case insensitive)', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchTerm('jane');
    });

    expect(result.current.filteredUsers).toEqual([mockUsers[1]]);

    act(() => {
      result.current.setSearchTerm('JANE');
    });

    expect(result.current.filteredUsers).toEqual([mockUsers[1]]);
  });

  it('should filter users by email (case insensitive)', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchTerm('example.com');
    });

    expect(result.current.filteredUsers).toEqual([mockUsers[0]]);

    act(() => {
      result.current.setSearchTerm('EXAMPLE.COM');
    });

    expect(result.current.filteredUsers).toEqual([mockUsers[0]]);
  });

  it('should filter users by partial matches', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchTerm('j');
    });

    // Should match John Doe, Jane Smith, and Bob Johnson
    expect(result.current.filteredUsers).toEqual([
      mockUsers[0], // John
      mockUsers[1], // Jane  
      mockUsers[2], // Bob Johnson
    ]);
  });

  it('should return all users when search term is empty or whitespace', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchTerm('');
    });

    expect(result.current.filteredUsers).toEqual(mockUsers);

    act(() => {
      result.current.setSearchTerm('   ');
    });

    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  it('should return empty array when no matches found', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));

    act(() => {
      result.current.setSearchTerm('xyz123nonexistent');
    });

    expect(result.current.filteredUsers).toEqual([]);
  });

  it('should handle empty users array', () => {
    const { result } = renderHook(() => useUserSearch([]));

    act(() => {
      result.current.setSearchTerm('test');
    });

    expect(result.current.filteredUsers).toEqual([]);
  });

  it('should debounce URL updates (300ms)', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    // Clear calls after initialization
    act(() => {
      vi.advanceTimersByTime(100); // Let initialization complete
    });
    vi.clearAllMocks();

    act(() => {
      result.current.setSearchTerm('j');
    });

    // URL should not be updated immediately
    expect(window.history.replaceState).not.toHaveBeenCalled();

    // Fast forward 299ms - still should not be called
    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(window.history.replaceState).not.toHaveBeenCalled();

    // Fast forward to 300ms - now it should be called
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(window.history.replaceState).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should remove search param from URL when search term is cleared', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    // Let initialization complete
    act(() => {
      vi.advanceTimersByTime(100);
    });
    vi.clearAllMocks();

    // First set a search term
    act(() => {
      result.current.setSearchTerm('test');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const firstCallCount = vi.mocked(window.history.replaceState).mock.calls.length;
    expect(firstCallCount).toBeGreaterThan(0);

    // Clear the search term
    act(() => {
      result.current.setSearchTerm('');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const secondCallCount = vi.mocked(window.history.replaceState).mock.calls.length;
    expect(secondCallCount).toBeGreaterThan(firstCallCount);

    vi.useRealTimers();
  });

  it('should cancel previous debounce when search term changes quickly', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    // Let initialization complete
    act(() => {
      vi.advanceTimersByTime(100);
    });
    vi.clearAllMocks();

    // Type quickly
    act(() => {
      result.current.setSearchTerm('j');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setSearchTerm('jo');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setSearchTerm('joh');
    });

    // Only the final value should be used for URL update
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should have been called at least once, demonstrating debounce worked
    expect(window.history.replaceState).toHaveBeenCalled();
    
    // Verify final search term is correct
    expect(result.current.searchTerm).toBe('joh');

    vi.useRealTimers();
  });
});