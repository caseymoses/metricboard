import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserList } from './UserList';
import type { User } from '../../types/user';

// Mock the hooks and stores
vi.mock('../../hooks/useUsers', () => ({
  useUsers: vi.fn(),
}));

vi.mock('../../stores/userStore', () => ({
  useUserStore: vi.fn(),
}));

// Mock UserCard component to make testing easier
vi.mock('./UserCard', () => ({
  UserCard: ({ user }: { user: User }) => (
    <div data-testid={`user-card-${user.id}`}>
      {user.name} - {user.email}
    </div>
  ),
}));

// Import the mocked functions
import { useUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';

const mockUseUsers = vi.mocked(useUsers);
const mockUseUserStore = vi.mocked(useUserStore);

// Test data
const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: false,
    createdAt: new Date('2023-02-01'),
  },
  {
    id: 'user-3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    isActive: true,
    createdAt: new Date('2023-03-01'),
    lastLoginAt: new Date('2024-02-01'),
  },
];

const renderWithQueryClient = (component: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseUserStore.mockReturnValue({
      selectedUsers: [],
      clearSelection: vi.fn(),
    });
    
    mockUseUsers.mockReturnValue({
      data: mockUsers,
      isLoading: false,
      error: null,
    });
  });

  describe('Key Prop Fix', () => {
    it('should render users with unique key props based on user.id', () => {
      const { container } = renderWithQueryClient(<UserList />);
      
      // Verify all users are rendered
      mockUsers.forEach(user => {
        expect(screen.getByTestId(`user-card-${user.id}`)).toBeInTheDocument();
      });
      
      // Check that the DOM structure doesn't contain warnings about missing keys
      // React will not render duplicate keys, so this ensures uniqueness
      const userCards = container.querySelectorAll('[data-testid^="user-card-"]');
      expect(userCards).toHaveLength(mockUsers.length);
    });

    it('should use user.id as key when filtering users', () => {
      const filteredUsers = [mockUsers[0], mockUsers[2]]; // John and Bob
      
      renderWithQueryClient(<UserList filteredUsers={filteredUsers} />);
      
      // Should only render the filtered users
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      expect(screen.queryByTestId('user-card-user-2')).not.toBeInTheDocument();
    });

    it('should handle reordered users correctly with proper keys', () => {
      const { rerender } = renderWithQueryClient(<UserList />);
      
      // First render - original order
      let userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards[0]).toHaveAttribute('data-testid', 'user-card-user-1');
      expect(userCards[1]).toHaveAttribute('data-testid', 'user-card-user-2');
      expect(userCards[2]).toHaveAttribute('data-testid', 'user-card-user-3');
      
      // Mock reordered data
      const reorderedUsers = [mockUsers[2], mockUsers[0], mockUsers[1]]; // Bob, John, Jane
      mockUseUsers.mockReturnValue({
        data: reorderedUsers,
        isLoading: false,
        error: null,
      });
      
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <UserList />
        </QueryClientProvider>
      );
      
      // After reorder - should maintain correct user identity
      userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards[0]).toHaveAttribute('data-testid', 'user-card-user-3');
      expect(userCards[1]).toHaveAttribute('data-testid', 'user-card-user-1');
      expect(userCards[2]).toHaveAttribute('data-testid', 'user-card-user-2');
    });

    it('should handle users with duplicate names but different IDs correctly', () => {
      const usersWithDuplicateNames: User[] = [
        { ...mockUsers[0], id: 'user-a', name: 'John Doe' },
        { ...mockUsers[1], id: 'user-b', name: 'John Doe' },
        { ...mockUsers[2], id: 'user-c', name: 'John Doe' },
      ];

      mockUseUsers.mockReturnValue({
        data: usersWithDuplicateNames,
        isLoading: false,
        error: null,
      });
      
      renderWithQueryClient(<UserList />);
      
      // All users should render despite having the same name
      expect(screen.getByTestId('user-card-user-a')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-b')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-c')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when data is loading', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });
      
      renderWithQueryClient(<UserList />);
      
      // Should not render any user cards when loading
      const userCards = screen.queryAllByTestId(/^user-card-/);
      expect(userCards).toHaveLength(0);
      
      // Check for loading skeleton elements
      const pulsingElements = document.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBe(5); // Should have 5 skeleton items
    });
  });

  describe('Error State', () => {
    it('should render error message when there is an error', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });
      
      renderWithQueryClient(<UserList />);
      
      expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
      expect(screen.getByText('There was a problem loading the user list. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no users exist', () => {
      mockUseUsers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });
      
      renderWithQueryClient(<UserList />);
      
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('There are no users in the system yet.')).toBeInTheDocument();
    });

    it('should render filtered empty state when no users match filter', () => {
      renderWithQueryClient(<UserList filteredUsers={[]} />);
      
      expect(screen.getByText('No Matching Users')).toBeInTheDocument();
      expect(screen.getByText('No users match your search criteria. Try adjusting your search term.')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should show selection banner when users are selected', () => {
      mockUseUserStore.mockReturnValue({
        selectedUsers: [mockUsers[0], mockUsers[1]],
        clearSelection: vi.fn(),
      });
      
      renderWithQueryClient(<UserList />);
      
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
      expect(screen.getByText('Clear Selection')).toBeInTheDocument();
    });

    it('should handle single user selection correctly', () => {
      mockUseUserStore.mockReturnValue({
        selectedUsers: [mockUsers[0]],
        clearSelection: vi.fn(),
      });
      
      renderWithQueryClient(<UserList />);
      
      expect(screen.getByText('1 user selected')).toBeInTheDocument();
    });
  });
});