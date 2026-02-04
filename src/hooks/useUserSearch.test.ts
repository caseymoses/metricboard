import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserSearch } from './useUserSearch';
import type { User } from '../types/user';

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
];

// Mock window.location and history
const mockLocation = {
  href: 'http://localhost:3000',
  search: '',
};

const mockHistory = {
  replaceState: vi.fn(),
};

beforeEach(() => {
  vi.useFakeTimers();
  
  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
  });
  
  // Mock window.history
  Object.defineProperty(window, 'history', {
    value: mockHistory,
    writable: true,
  });
  
  // Mock URL constructor
  global.URL = vi.fn().mockImplementation((url) => ({
    href: url,
    searchParams: {
      set: vi.fn(),
      delete: vi.fn(),
    },
    toString: () => url,
  })) as any;
  
  // Mock URLSearchParams
  global.URLSearchParams = vi.fn().mockImplementation((search) => ({
    get: vi.fn((key) => {
      if (key === 'search' && search === '?search=test') return 'test';
      return null;
    }),
  })) as any;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('useUserSearch', () => {
  it('initializes with empty search term when no URL param', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    expect(result.current.searchTerm).toBe('');
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  it('initializes with search term from URL params', () => {
    // Mock URLSearchParams to return 'test'
    global.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: vi.fn().mockReturnValue('test'),
    })) as any;
    
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    expect(result.current.searchTerm).toBe('test');
  });

  it('updates search term when setSearchTerm is called', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('jane');
    });
    
    expect(result.current.searchTerm).toBe('jane');
  });

  it('filters users by name (case insensitive)', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('john');
    });
    
    expect(result.current.filteredUsers).toHaveLength(2); // John Doe and Bob Johnson
    expect(result.current.filteredUsers[0].name).toBe('John Doe');
    expect(result.current.filteredUsers[1].name).toBe('Bob Johnson');
  });

  it('filters users by email (case insensitive)', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('JANE@');
    });
    
    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].email).toBe('jane@example.com');
  });

  it('returns all users when search term is empty', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('john');
    });
    
    act(() => {
      result.current.setSearchTerm('');
    });
    
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });

  it('returns empty array when no users match search', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('xyz123');
    });
    
    expect(result.current.filteredUsers).toHaveLength(0);
  });

  it('handles empty user list', () => {
    const { result } = renderHook(() => useUserSearch([]));
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.filteredUsers).toHaveLength(0);
  });

  it('handles undefined user list', () => {
    const { result } = renderHook(() => useUserSearch());
    
    act(() => {
      result.current.setSearchTerm('test');
    });
    
    expect(result.current.filteredUsers).toHaveLength(0);
  });

  it('debounces URL updates by 300ms', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('john');
    });
    
    // URL should not be updated immediately
    expect(mockHistory.replaceState).not.toHaveBeenCalled();
    
    // Fast-forward time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    // Now URL should be updated
    expect(mockHistory.replaceState).toHaveBeenCalled();
  });

  it('cancels previous timeout when search term changes quickly', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('j');
    });
    
    act(() => {
      result.current.setSearchTerm('jo');
    });
    
    act(() => {
      result.current.setSearchTerm('john');
    });
    
    // Fast-forward by less than 300ms
    act(() => {
      vi.advanceTimersByTime(299);
    });
    
    expect(mockHistory.replaceState).not.toHaveBeenCalled();
    
    // Fast-forward by 1ms more to complete the timeout
    act(() => {
      vi.advanceTimersByTime(1);
    });
    
    expect(mockHistory.replaceState).toHaveBeenCalledTimes(1);
  });

  it('handles partial matches in name and email', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('do');
    });
    
    expect(result.current.filteredUsers).toHaveLength(1);
    expect(result.current.filteredUsers[0].name).toBe('John Doe');
  });

  it('trims whitespace from search term', () => {
    const { result } = renderHook(() => useUserSearch(mockUsers));
    
    act(() => {
      result.current.setSearchTerm('   ');
    });
    
    expect(result.current.filteredUsers).toEqual(mockUsers);
  });
});