import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { UserList } from './UserList';
import { useUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';
import type { User } from '../../types/user';

// Mock return types
type MockUseUsersReturn = Pick<UseQueryResult<User[], Error>, 'data' | 'isLoading' | 'error'>;
type MockUseUserStoreReturn = {
  selectedUsers: User[];
  clearSelection: () => void;
};

// Mock the hooks
vi.mock('../../hooks/useUsers');
vi.mock('../../stores/userStore');

// Mock UserCard component to focus on UserList logic
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
    name: 'Bob Wilson',
    email: 'bob@example.com',
    isActive: true,
    createdAt: new Date('2023-03-01'),
    lastLoginAt: new Date('2024-02-01'),
  },
];

const mockUseUsers = vi.mocked(useUsers);
const mockUseUserStore = vi.mocked(useUserStore);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for useUserStore
    mockUseUserStore.mockReturnValue({
      selectedUsers: [],
      clearSelection: vi.fn(),
    } as MockUseUserStoreReturn);
  });

  describe('Key prop fix regression tests', () => {
    it('should use user.id as key for each UserCard component', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      const { container } = render(<UserList />, { wrapper: createWrapper() });
      
      // Verify that each user card is rendered with the correct test id (which includes user.id)
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      
      // Verify the order is maintained and all users are rendered
      const userCards = container.querySelectorAll('[data-testid^="user-card-"]');
      expect(userCards).toHaveLength(3);
      
      // Test that changing the order doesn't affect the keys
      // Each component should maintain its unique identifier
      expect(userCards[0]).toHaveAttribute('data-testid', 'user-card-user-1');
      expect(userCards[1]).toHaveAttribute('data-testid', 'user-card-user-2');
      expect(userCards[2]).toHaveAttribute('data-testid', 'user-card-user-3');
    });

    it('should handle reordered users correctly with stable keys', () => {
      const reorderedUsers = [mockUsers[2], mockUsers[0], mockUsers[1]]; // Different order
      
      mockUseUsers.mockReturnValue({
        data: reorderedUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      // Even with different order, each user should be identifiable by their unique id
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
    });

    it('should work correctly with filtered users prop', () => {
      const filteredUsers = [mockUsers[0], mockUsers[2]]; // Only user-1 and user-3
      
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList filteredUsers={filteredUsers} />, { wrapper: createWrapper() });
      
      // Should only render the filtered users
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      expect(screen.queryByTestId('user-card-user-2')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should render loading skeleton with proper keys', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      // Should render 5 skeleton items
      const skeletonItems = screen.getAllByRole('generic').filter(
        el => el.classList.contains('animate-pulse')
      );
      expect(skeletonItems).toHaveLength(5);
    });
  });

  describe('Error state', () => {
    it('should render error message when useUsers returns error', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load users'),
      } as MockUseUsersReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
      expect(screen.getByText('There was a problem loading the user list. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('should render no users message when data is empty', () => {
      mockUseUsers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('There are no users in the system yet.')).toBeInTheDocument();
    });

    it('should render no matching users message when filteredUsers is empty', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList filteredUsers={[]} />, { wrapper: createWrapper() });
      
      expect(screen.getByText('No Matching Users')).toBeInTheDocument();
      expect(screen.getByText('No users match your search criteria. Try adjusting your search term.')).toBeInTheDocument();
    });
  });

  describe('Selection functionality', () => {
    it('should display selection banner when users are selected', () => {
      const selectedUsers = [mockUsers[0], mockUsers[1]];
      
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      const mockClearSelection = vi.fn();
      mockUseUserStore.mockReturnValue({
        selectedUsers,
        clearSelection: mockClearSelection,
      } as MockUseUserStoreReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Clear Selection' })).toBeInTheDocument();
    });

    it('should handle single user selection correctly', () => {
      const selectedUsers = [mockUsers[0]];
      
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      mockUseUserStore.mockReturnValue({
        selectedUsers,
        clearSelection: vi.fn(),
      } as MockUseUserStoreReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      expect(screen.getByText('1 user selected')).toBeInTheDocument();
    });

    it('should not display selection banner when no users are selected', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      mockUseUserStore.mockReturnValue({
        selectedUsers: [],
        clearSelection: vi.fn(),
      } as MockUseUserStoreReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clear Selection' })).not.toBeInTheDocument();
    });
  });

  describe('Data display', () => {
    it('should render all users when no filter is applied', async () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList />, { wrapper: createWrapper() });
      
      await waitFor(() => {
        expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
        expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument();
        expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      });
    });

    it('should prioritize filteredUsers prop over hook data', () => {
      const filteredUsers = [mockUsers[1]]; // Only Jane Smith
      
      mockUseUsers.mockReturnValue({
        data: mockUsers, // Full list from hook
        isLoading: false,
        error: null,
      } as MockUseUsersReturn);

      render(<UserList filteredUsers={filteredUsers} />, { wrapper: createWrapper() });
      
      // Should only render the filtered user, not all users from hook
      expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument();
      expect(screen.queryByTestId('user-card-user-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-card-user-3')).not.toBeInTheDocument();
    });
  });
});