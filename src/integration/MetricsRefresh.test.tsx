import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsDashboard } from '../components/dashboard/MetricsCard';
import { AddUser } from '../components/users/AddUser';
import { UserCard } from '../components/users/UserCard';
import { mockApi } from '../api/mockApi';

// Mock the API with a shared state
let mockUsers = [
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
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2024-02-03'),
  },
];

vi.mock('../api/mockApi', () => ({
  mockApi: {
    getUsers: vi.fn(() => Promise.resolve([...mockUsers])),
    getMetrics: vi.fn(() => {
      const activeUsers = mockUsers.filter(user => user.isActive).length;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newSignups = mockUsers.filter(user => user.createdAt > thirtyDaysAgo).length;
      
      return Promise.resolve({
        totalUsers: mockUsers.length,
        activeUsers,
        newSignups,
      });
    }),
    addUser: vi.fn((userData) => {
      const newUser = {
        ...userData,
        id: `${Date.now()}`,
        createdAt: new Date(),
      };
      mockUsers.push(newUser);
      return Promise.resolve(newUser);
    }),
    deleteUser: vi.fn((userId) => {
      const index = mockUsers.findIndex(user => user.id === userId);
      if (index > -1) {
        mockUsers.splice(index, 1);
      }
      return Promise.resolve();
    }),
  },
}));

// Mock the user store
vi.mock('../stores/userStore', () => ({
  useUserStore: vi.fn(() => ({
    toggleUserSelection: vi.fn(),
    selectedUsers: [],
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
        refetchOnWindowFocus: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Metrics Refresh Integration', () => {
  beforeEach(() => {
    // Reset mock users to initial state
    mockUsers = [
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
        createdAt: new Date('2024-02-01'),
        lastLoginAt: new Date('2024-02-03'),
      },
    ];
    vi.clearAllMocks();
  });

  it('updates metrics when a user is added', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    
    render(
      <div>
        <MetricsDashboard />
        <AddUser />
      </div>,
      { wrapper }
    );
    
    // Wait for initial metrics to load (2 users)
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });
    
    // Wait for the metric values to animate in - find the one under "Total Users"
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('div');
      expect(totalUsersCard).toBeInTheDocument();
      expect(totalUsersCard).toHaveTextContent('2');
    });
    
    // Open the add user form
    const addButton = screen.getByText('+ Add User');
    await user.click(addButton);
    
    // Fill out the form
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    
    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@example.com');
    
    // Submit the form
    const submitButton = screen.getByText('Add User');
    await user.click(submitButton);
    
    // Wait for the mutation to complete and metrics to update
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('div');
      expect(totalUsersCard).toHaveTextContent('3'); // totalUsers should now be 3
    }, { timeout: 2000 });
    
    // Verify the API calls
    expect(mockApi.addUser).toHaveBeenCalled();
    const firstCall = vi.mocked(mockApi.addUser).mock.calls[0];
    expect(firstCall[0]).toEqual({
      name: 'New User',
      email: 'newuser@example.com',
      isActive: true,
    });
  });

  it('updates metrics when a user is deleted', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);
    
    try {
      render(
        <div>
          <MetricsDashboard />
          <UserCard user={mockUsers[0]} />
        </div>,
        { wrapper }
      );
      
      // Wait for initial metrics to load (2 users)
      await waitFor(() => {
        const totalUsersCard = screen.getByText('Total Users').closest('div');
        expect(totalUsersCard).toHaveTextContent('2'); // totalUsers
      });
      
      // Delete the user
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      // Wait for the mutation to complete and metrics to update
      await waitFor(() => {
        const totalUsersCard = screen.getByText('Total Users').closest('div');
        expect(totalUsersCard).toHaveTextContent('1'); // totalUsers should now be 1
      }, { timeout: 2000 });
      
      // Verify the API call
      expect(mockApi.deleteUser).toHaveBeenCalled();
      const firstCall = vi.mocked(mockApi.deleteUser).mock.calls[0];
      expect(firstCall[0]).toBe('1');
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete John Doe?');
    } finally {
      window.confirm = originalConfirm;
    }
  });

  it('reflects active user changes in metrics', async () => {
    // Add an inactive user to the mock data
    mockUsers.push({
      id: '3',
      name: 'Inactive User',
      email: 'inactive@example.com',
      isActive: false,
      createdAt: new Date('2024-01-01'),
    });
    
    const wrapper = createWrapper();
    
    render(<MetricsDashboard />, { wrapper });
    
    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
    });
    
    // Check the metrics reflect the user states
    await waitFor(() => {
      const totalUsersCard = screen.getByText('Total Users').closest('div');
      const activeUsersCard = screen.getByText('Active Users').closest('div');
      
      expect(totalUsersCard).toHaveTextContent('3'); // totalUsers
      expect(activeUsersCard).toHaveTextContent('2'); // activeUsers (only 2 are active)
    });
  });
});