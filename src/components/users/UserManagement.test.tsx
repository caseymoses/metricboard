import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserSearch } from './UserSearch';
import { UserList } from './UserList';
import { useUsers } from '../../hooks/useUsers';
import { useUserSearch } from '../../hooks/useUserSearch';
import type { User } from '../../types/user';

// Mock the hooks
vi.mock('../../hooks/useUsers');
vi.mock('../../hooks/useUserSearch');

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

const mockUseUsers = vi.mocked(useUsers);
const mockUseUserSearch = vi.mocked(useUserSearch);

// Test component that combines search and list
const TestUserManagement = () => {
  const { data: users = [] } = useUsers();
  const { searchTerm, setSearchTerm, filteredUsers } = useUserSearch(users);

  return (
    <div>
      <UserSearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultsCount={filteredUsers.length}
      />
      <UserList filteredUsers={filteredUsers} />
    </div>
  );
};

const renderWithQuery = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserManagement Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useUsers to return mock data
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
    } as any);
  });

  it('displays all users initially', () => {
    // Mock useUserSearch with no search term
    mockUseUserSearch.mockReturnValue({
      searchTerm: '',
      setSearchTerm: vi.fn(),
      filteredUsers: mockUsers,
    });

    renderWithQuery(<TestUserManagement />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows filtered results when searching', () => {
    const setSearchTermMock = vi.fn();
    
    // Mock useUserSearch with search results
    mockUseUserSearch.mockReturnValue({
      searchTerm: 'jane',
      setSearchTerm: setSearchTermMock,
      filteredUsers: [mockUsers[1]], // Only Jane Smith
    });

    renderWithQuery(<TestUserManagement />);
    
    // Should show Jane Smith
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Should not show other users
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Should show search results count
    expect(screen.getByText('1 result found')).toBeInTheDocument();
  });

  it('shows no results message when search yields no matches', () => {
    // Mock useUserSearch with empty results
    mockUseUserSearch.mockReturnValue({
      searchTerm: 'nonexistent',
      setSearchTerm: vi.fn(),
      filteredUsers: [],
    });

    renderWithQuery(<TestUserManagement />);
    
    expect(screen.getByText('No Matching Users')).toBeInTheDocument();
    expect(screen.getByText('No users match your search criteria. Try adjusting your search term.')).toBeInTheDocument();
    expect(screen.getByText('0 results found')).toBeInTheDocument();
  });

  it('calls setSearchTerm when search input changes', () => {
    const setSearchTermMock = vi.fn();
    
    mockUseUserSearch.mockReturnValue({
      searchTerm: '',
      setSearchTerm: setSearchTermMock,
      filteredUsers: mockUsers,
    });

    renderWithQuery(<TestUserManagement />);
    
    const searchInput = screen.getByPlaceholderText('Search users by name or email...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(setSearchTermMock).toHaveBeenCalledWith('test');
  });

  it('shows loading state', () => {
    // Mock loading state
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
    } as any);

    mockUseUserSearch.mockReturnValue({
      searchTerm: '',
      setSearchTerm: vi.fn(),
      filteredUsers: [],
    });

    renderWithQuery(<TestUserManagement />);
    
    // Should show loading skeletons
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('shows error state', () => {
    // Mock error state
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      isError: true,
      isSuccess: false,
    } as any);

    mockUseUserSearch.mockReturnValue({
      searchTerm: '',
      setSearchTerm: vi.fn(),
      filteredUsers: [],
    });

    renderWithQuery(<TestUserManagement />);
    
    expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
  });

  it('maintains search functionality when users are loading', () => {
    const setSearchTermMock = vi.fn();
    
    // Mock loading state but still allow search
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isSuccess: false,
    } as any);

    mockUseUserSearch.mockReturnValue({
      searchTerm: 'test',
      setSearchTerm: setSearchTermMock,
      filteredUsers: [],
    });

    renderWithQuery(<TestUserManagement />);
    
    const searchInput = screen.getByDisplayValue('test');
    expect(searchInput).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'new search' } });
    expect(setSearchTermMock).toHaveBeenCalledWith('new search');
  });
});