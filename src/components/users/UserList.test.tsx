import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';
import * as useUsersHook from '../../hooks/useUsers';
import * as userStore from '../../stores/userStore';
import type { User } from '../../types/user';

// Mock the hooks
vi.mock('../../hooks/useUsers');
vi.mock('../../stores/userStore');

// Mock UserCard component to isolate the UserList testing
vi.mock('./UserCard', () => ({
  UserCard: ({ user }: { user: User }) => (
    <div data-testid={`user-card-${user.id}`}>
      {user.name}
    </div>
  ),
}));

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'user-2', 
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: false,
    createdAt: new Date('2023-01-02'),
  },
  {
    id: 'user-3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    isActive: true,
    createdAt: new Date('2023-01-03'),
  },
];

const MockWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UserList', () => {
  const mockUseUsers = vi.mocked(useUsersHook.useUsers);
  const mockUseUserStore = vi.mocked(userStore.useUserStore);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    mockUseUserStore.mockReturnValue({
      selectedUsers: [],
      clearSelection: vi.fn(),
    });
  });

  it('renders users with unique keys (no console warnings)', async () => {
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    // Spy on console.warn to check for React key warnings
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();  
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    // Verify no React key warnings were logged
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Each child in a list should have a unique "key" prop')
    );

    consoleSpy.mockRestore();
  });

  it('renders loading state with unique keys', () => {
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    // Spy on console.warn
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    // Check that loading skeleton items are rendered
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems).toHaveLength(5);

    // Verify no React key warnings for loading state
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Each child in a list should have a unique "key" prop')
    );

    consoleSpy.mockRestore();
  });

  it('renders error state correctly', () => {
    mockUseUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
    expect(screen.getByText(/There was a problem loading the user list/)).toBeInTheDocument();
  });

  it('renders empty state when no users', () => {
    mockUseUsers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    expect(screen.getByText('No Users Found')).toBeInTheDocument();
    expect(screen.getByText(/There are no users in the system yet/)).toBeInTheDocument();
  });

  it('renders filtered users when provided', () => {
    const filteredUsers = [mockUsers[0]]; // Only first user
    
    mockUseUsers.mockReturnValue({
      data: mockUsers, // Full list available
      isLoading: false,
      error: null,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <MockWrapper>
        <UserList filteredUsers={filteredUsers} />
      </MockWrapper>
    );

    // Should only show the filtered user
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();

    // Verify no key warnings
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Each child in a list should have a unique "key" prop')
    );

    consoleSpy.mockRestore();
  });

  it('shows no matching users message when filtered list is empty', () => {
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    render(
      <MockWrapper>
        <UserList filteredUsers={[]} />
      </MockWrapper>
    );

    expect(screen.getByText('No Matching Users')).toBeInTheDocument();
    expect(screen.getByText(/No users match your search criteria/)).toBeInTheDocument();
  });

  it('shows selection info and clear button when users are selected', () => {
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });

    const mockClearSelection = vi.fn();
    mockUseUserStore.mockReturnValue({
      selectedUsers: ['user-1', 'user-2'],
      clearSelection: mockClearSelection,
    });

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    expect(screen.getByText('2 users selected')).toBeInTheDocument();
    expect(screen.getByText('Clear Selection')).toBeInTheDocument();
  });

  it('handles unique IDs correctly to prevent key conflicts', () => {
    // Test with users having different IDs to ensure key uniqueness
    const usersWithIds: User[] = [
      { ...mockUsers[0], id: 'unique-id-1' },
      { ...mockUsers[1], id: 'unique-id-2' },
      { ...mockUsers[2], id: 'unique-id-3' },
    ];

    mockUseUsers.mockReturnValue({
      data: usersWithIds,
      isLoading: false,
      error: null,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <MockWrapper>
        <UserList />
      </MockWrapper>
    );

    // Verify all users render
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    // Most importantly: no key warnings
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Each child in a list should have a unique "key" prop')
    );

    consoleSpy.mockRestore();
  });
});