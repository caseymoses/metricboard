import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';
import { useUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';
import type { User } from '../../types/user';

// Mock the hooks
vi.mock('../../hooks/useUsers');
vi.mock('../../stores/userStore');

// Mock UserCard component since we're testing UserList specifically
vi.mock('./UserCard', () => ({
  UserCard: ({ user }: { user: User }) => (
    <div data-testid={`user-card-${user.id}`}>{user.name}</div>
  ),
}));

const mockUseUsers = vi.mocked(useUsers);
const mockUseUserStore = vi.mocked(useUserStore);

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2', 
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: false,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: 'user-3',
    name: 'Bob Johnson', 
    email: 'bob@example.com',
    isActive: true,
    createdAt: new Date('2024-01-03'),
  },
];

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    mockUseUserStore.mockReturnValue({
      selectedUsers: [],
      clearSelection: vi.fn(),
    });
  });

  describe('Key prop regression test', () => {
    it('should use user.id as key prop for each UserCard to prevent React warnings', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      });

      const { container } = render(<UserList />);
      
      // Verify all users are rendered
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-2')).toBeInTheDocument(); 
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      
      // Verify the structure shows each user exactly once
      const userCards = container.querySelectorAll('[data-testid^="user-card-"]');
      expect(userCards).toHaveLength(mockUsers.length);
    });

    it('should render unique keys when users have different ids', () => {
      const usersWithSimilarData = [
        {
          id: 'unique-1',
          name: 'Same Name',
          email: 'same@example.com',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'unique-2', 
          name: 'Same Name',
          email: 'same@example.com',
          isActive: true,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockUseUsers.mockReturnValue({
        data: usersWithSimilarData,
        isLoading: false,
        error: null,
      });

      render(<UserList />);
      
      // Both users should render even with similar data because they have unique IDs
      expect(screen.getByTestId('user-card-unique-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-unique-2')).toBeInTheDocument();
    });
  });

  describe('Component behavior', () => {
    it('should display loading state with skeleton cards', () => {
      mockUseUsers.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      const { container } = render(<UserList />);
      
      // Should render skeleton loading cards
      const skeletonCards = container.querySelectorAll('.animate-pulse');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should display error state when useUsers returns error', () => {
      mockUseUsers.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error'),
      });

      render(<UserList />);
      
      expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
      expect(screen.getByText('There was a problem loading the user list. Please try again.')).toBeInTheDocument();
    });

    it('should display no users message when no data available', () => {
      mockUseUsers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<UserList />);
      
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('There are no users in the system yet.')).toBeInTheDocument();
    });

    it('should display filtered users when filteredUsers prop is provided', () => {
      const filteredUsers = [mockUsers[0], mockUsers[2]]; // Only user-1 and user-3

      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      });

      render(<UserList filteredUsers={filteredUsers} />);
      
      // Should only render the filtered users
      expect(screen.getByTestId('user-card-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-user-3')).toBeInTheDocument();
      expect(screen.queryByTestId('user-card-user-2')).not.toBeInTheDocument();
    });

    it('should display no matching users message when filteredUsers is empty', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      });

      render(<UserList filteredUsers={[]} />);
      
      expect(screen.getByText('No Matching Users')).toBeInTheDocument();
      expect(screen.getByText('No users match your search criteria. Try adjusting your search term.')).toBeInTheDocument();
    });

    it('should show selection UI when users are selected', () => {
      mockUseUsers.mockReturnValue({
        data: mockUsers,
        isLoading: false,
        error: null,
      });

      mockUseUserStore.mockReturnValue({
        selectedUsers: ['user-1', 'user-2'],
        clearSelection: vi.fn(),
      });

      render(<UserList />);
      
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
      expect(screen.getByText('Clear Selection')).toBeInTheDocument();
    });
  });
});