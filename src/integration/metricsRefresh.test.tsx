import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsDashboard } from '../components/dashboard/MetricsCard';
import { AddUser } from '../components/users/AddUser';
import { UserCard } from '../components/users/UserCard';
import { mockApi } from '../api/mockApi';
import type { User } from '../types/user';

// Mock the mockApi module
vi.mock('../api/mockApi');

// Mock the userStore
vi.mock('../stores/userStore', () => ({
  useUserStore: () => ({
    toggleUserSelection: vi.fn(),
    selectedUsers: [],
  }),
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Metrics Refresh Integration', () => {
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(mockApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(mockApi.getMetrics).mockResolvedValue({
      totalUsers: 2,
      activeUsers: 2,
      newSignups: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should refresh metrics when a user is added', async () => {
    const newUser: User = {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      isActive: true,
      createdAt: new Date(),
    };

    // Mock the add user API call
    vi.mocked(mockApi.addUser).mockResolvedValue(newUser);

    // Mock updated metrics after user addition
    vi.mocked(mockApi.getMetrics)
      .mockResolvedValueOnce({
        totalUsers: 2,
        activeUsers: 2,
        newSignups: 1,
      })
      .mockResolvedValueOnce({
        totalUsers: 3,
        activeUsers: 3,
        newSignups: 2,
      });

    const Wrapper = createTestWrapper();

    const TestApp = () => (
      <div>
        <MetricsDashboard />
        <AddUser />
      </div>
    );

    render(
      <Wrapper>
        <TestApp />
      </Wrapper>
    );

    // Wait for initial metrics to load using more specific selector
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard).toBeInTheDocument();
      expect(totalUsersCard?.textContent).toContain('2');
    });

    // Open the add user form
    fireEvent.click(screen.getByText('+ Add User'));

    // Fill out the form
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /add user/i });

    fireEvent.change(nameInput, { target: { value: 'Bob Wilson' } });
    fireEvent.change(emailInput, { target: { value: 'bob@example.com' } });

    // Submit the form
    fireEvent.click(submitButton);

    // Wait for the user to be added and metrics to refresh
    await waitFor(() => {
      expect(mockApi.addUser).toHaveBeenCalledWith({
        name: 'Bob Wilson',
        email: 'bob@example.com',
        isActive: true,
      }, expect.any(Object));
    });

    // Verify that metrics were called twice (initial load + refresh)
    await waitFor(() => {
      expect(mockApi.getMetrics).toHaveBeenCalledTimes(2);
    });

    // Wait for metrics to update to new values
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('3');
    });
  });

  it('should refresh metrics when a user is deleted', async () => {
    const testUser = mockUsers[0];

    // Mock the delete user API call
    vi.mocked(mockApi.deleteUser).mockResolvedValue(undefined);

    // Mock updated metrics after user deletion
    vi.mocked(mockApi.getMetrics)
      .mockResolvedValueOnce({
        totalUsers: 2,
        activeUsers: 2,
        newSignups: 1,
      })
      .mockResolvedValueOnce({
        totalUsers: 1,
        activeUsers: 1,
        newSignups: 1,
      });

    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const Wrapper = createTestWrapper();

    const TestApp = () => (
      <div>
        <MetricsDashboard />
        <UserCard user={testUser} />
      </div>
    );

    render(
      <Wrapper>
        <TestApp />
      </Wrapper>
    );

    // Wait for initial metrics to load
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('2');
    });

    // Find and click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Wait for the user to be deleted and metrics to refresh
    await waitFor(() => {
      expect(mockApi.deleteUser).toHaveBeenCalledWith(testUser.id, expect.any(Object));
    });

    // Verify that metrics were called twice (initial load + refresh)
    await waitFor(() => {
      expect(mockApi.getMetrics).toHaveBeenCalledTimes(2);
    });

    // Wait for metrics to update to new values
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('1');
    });

    confirmSpy.mockRestore();
  });

  it('should handle multiple rapid mutations correctly', async () => {
    const newUser1: User = {
      id: '3',
      name: 'User 1',
      email: 'user1@example.com',
      isActive: true,
      createdAt: new Date(),
    };

    const newUser2: User = {
      id: '4',
      name: 'User 2',
      email: 'user2@example.com',
      isActive: true,
      createdAt: new Date(),
    };

    // Mock the add user API calls
    vi.mocked(mockApi.addUser)
      .mockResolvedValueOnce(newUser1)
      .mockResolvedValueOnce(newUser2);

    // Mock progressive metrics updates
    vi.mocked(mockApi.getMetrics)
      .mockResolvedValueOnce({ totalUsers: 2, activeUsers: 2, newSignups: 1 })
      .mockResolvedValueOnce({ totalUsers: 3, activeUsers: 3, newSignups: 2 })
      .mockResolvedValueOnce({ totalUsers: 4, activeUsers: 4, newSignups: 3 });

    const Wrapper = createTestWrapper();

    const TestApp = () => (
      <div>
        <MetricsDashboard />
        <AddUser />
      </div>
    );

    render(
      <Wrapper>
        <TestApp />
      </Wrapper>
    );

    // Wait for initial metrics
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('2');
    });

    // Add first user
    fireEvent.click(screen.getByText('+ Add User'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'User 1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user1@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(mockApi.addUser).toHaveBeenCalledWith({
        name: 'User 1',
        email: 'user1@example.com',
        isActive: true,
      }, expect.any(Object));
    });

    // Wait for first update
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('3');
    });

    // Add second user rapidly
    fireEvent.click(screen.getByText('+ Add User'));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'User 2' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user2@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    await waitFor(() => {
      expect(mockApi.addUser).toHaveBeenCalledWith({
        name: 'User 2',
        email: 'user2@example.com',
        isActive: true,
      }, expect.any(Object));
    });

    // Wait for final update
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('.p-6');
      expect(totalUsersCard?.textContent).toContain('4');
    });

    // Verify that metrics were called for initial load + both updates
    expect(mockApi.getMetrics).toHaveBeenCalledTimes(3);
  });
});