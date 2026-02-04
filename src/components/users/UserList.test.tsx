import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { UserList } from './UserList';
import { useUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';
import type { User } from '../../types/user';

// Mock the hooks
vi.mock('../../hooks/useUsers');
vi.mock('../../stores/userStore');
vi.mock('./UserCard', () => ({
  UserCard: ({ user }: { user: User }) => (
    <div data-testid={`user-card-${user.id}`} data-user-id={user.id}>
      {user.name}
    </div>
  ),
}));

const mockUseUsers = useUsers as ReturnType<typeof vi.fn>;
const mockUseUserStore = useUserStore as ReturnType<typeof vi.fn>;

// Create test user data
const createTestUser = (id: string, name: string): User => ({
  id,
  name,
  email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
  isActive: true,
  createdAt: new Date(),
  lastLoginAt: new Date(),
});

const testUsers: User[] = [
  createTestUser('user-1', 'John Doe'),
  createTestUser('user-2', 'Jane Smith'),
  createTestUser('user-3', 'Bob Johnson'),
];

describe('UserList', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock for useUserStore
    mockUseUserStore.mockReturnValue({
      selectedUsers: [],
      clearSelection: vi.fn(),
    });
  });

  const renderUserList = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <UserList {...props} />
      </QueryClientProvider>
    );
  };

  describe('Key Prop Tests (Regression Prevention)', () => {
    it('should use user.id as key for each UserCard, not array index', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      // Check that each UserCard is rendered with the correct user.id
      testUsers.forEach(user => {
        const userCard = screen.getByTestId(`user-card-${user.id}`);
        expect(userCard).toBeInTheDocument();
        expect(userCard).toHaveAttribute('data-user-id', user.id);
      });
    });

    it('should render UserCards in the same order as provided users', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      const userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards).toHaveLength(testUsers.length);
      
      // Verify the order matches the input order
      testUsers.forEach((user, index) => {
        expect(userCards[index]).toHaveAttribute('data-user-id', user.id);
      });
    });

    it('should maintain stable keys when user list order changes', () => {
      const reorderedUsers = [testUsers[2], testUsers[0], testUsers[1]]; // Different order

      mockUseUsers.mockReturnValue({
        data: reorderedUsers,
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      // Each user should still be rendered with their stable ID as key
      reorderedUsers.forEach(user => {
        const userCard = screen.getByTestId(`user-card-${user.id}`);
        expect(userCard).toBeInTheDocument();
        expect(userCard).toHaveAttribute('data-user-id', user.id);
      });
    });

    it('should work correctly with filtered users prop', () => {
      const filteredUsers = [testUsers[0], testUsers[2]]; // Only first and third users

      mockUseUsers.mockReturnValue({
        data: testUsers, // Full data available
        isLoading: false,
        error: null,
      });

      renderUserList({ filteredUsers });
      
      // Should only render the filtered users
      const userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards).toHaveLength(filteredUsers.length);
      
      // Check that correct users are rendered with correct keys
      filteredUsers.forEach(user => {
        const userCard = screen.getByTestId(`user-card-${user.id}`);
        expect(userCard).toBeInTheDocument();
        expect(userCard).toHaveAttribute('data-user-id', user.id);
      });

      // Check that non-filtered user is NOT rendered
      expect(screen.queryByTestId(`user-card-${testUsers[1].id}`)).not.toBeInTheDocument();
    });
  });

  describe('Component States', () => {
    it('should render loading state with unique keys for skeleton items', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { container } = renderUserList();
      
      // Should render 5 skeleton loading items
      const skeletonItems = container.querySelectorAll('.animate-pulse');
      expect(skeletonItems).toHaveLength(5);
    });

    it('should render error state', () => {
      mockUseUsers.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load users'),
      });

      renderUserList();
      
      expect(screen.getByText('Error Loading Users')).toBeInTheDocument();
      expect(screen.getByText('There was a problem loading the user list. Please try again.')).toBeInTheDocument();
    });

    it('should render empty state when no users available', () => {
      mockUseUsers.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      expect(screen.getByText('No Users Found')).toBeInTheDocument();
      expect(screen.getByText('There are no users in the system yet.')).toBeInTheDocument();
    });

    it('should render filtered empty state when filtered users is empty', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      renderUserList({ filteredUsers: [] });
      
      expect(screen.getByText('No Matching Users')).toBeInTheDocument();
      expect(screen.getByText('No users match your search criteria. Try adjusting your search term.')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should display selection count and clear button when users are selected', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      const mockClearSelection = vi.fn();
      mockUseUserStore.mockReturnValue({
        selectedUsers: [testUsers[0], testUsers[1]], // 2 users selected
        clearSelection: mockClearSelection,
      });

      renderUserList();
      
      expect(screen.getByText('2 users selected')).toBeInTheDocument();
      expect(screen.getByText('Clear Selection')).toBeInTheDocument();
    });

    it('should display singular text when one user is selected', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      mockUseUserStore.mockReturnValue({
        selectedUsers: [testUsers[0]], // 1 user selected
        clearSelection: vi.fn(),
      });

      renderUserList();
      
      expect(screen.getByText('1 user selected')).toBeInTheDocument();
    });

    it('should not display selection banner when no users are selected', () => {
      mockUseUsers.mockReturnValue({
        data: testUsers,
        isLoading: false,
        error: null,
      });

      mockUseUserStore.mockReturnValue({
        selectedUsers: [], // No users selected
        clearSelection: vi.fn(),
      });

      renderUserList();
      
      expect(screen.queryByText(/users? selected/)).not.toBeInTheDocument();
      expect(screen.queryByText('Clear Selection')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle users with duplicate names but unique IDs', () => {
      const usersWithDuplicateNames = [
        createTestUser('user-1', 'John Smith'),
        createTestUser('user-2', 'John Smith'), // Same name, different ID
        createTestUser('user-3', 'John Smith'), // Same name, different ID
      ];

      mockUseUsers.mockReturnValue({
        data: usersWithDuplicateNames,
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      // All should render with unique keys based on ID
      const userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards).toHaveLength(3);
      
      usersWithDuplicateNames.forEach(user => {
        const userCard = screen.getByTestId(`user-card-${user.id}`);
        expect(userCard).toBeInTheDocument();
        expect(userCard).toHaveAttribute('data-user-id', user.id);
      });
    });

    it('should handle single user correctly', () => {
      const singleUser = [testUsers[0]];

      mockUseUsers.mockReturnValue({
        data: singleUser,
        isLoading: false,
        error: null,
      });

      renderUserList();
      
      const userCards = screen.getAllByTestId(/^user-card-/);
      expect(userCards).toHaveLength(1);
      expect(userCards[0]).toHaveAttribute('data-user-id', singleUser[0].id);
    });
  });
});