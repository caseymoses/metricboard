import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useAddUser, useDeleteUser, useUsers, useMetrics } from './useUsers';
import { mockApi } from '../api/mockApi';
import type { User } from '../types/user';

// Mock the mockApi module
vi.mock('../api/mockApi');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call mockApi.getUsers', async () => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ];
    
    vi.mocked(mockApi.getUsers).mockResolvedValue(mockUsers);

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi.getUsers).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockUsers);
  });
});

describe('useMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call mockApi.getMetrics', async () => {
    const mockMetrics = {
      totalUsers: 10,
      activeUsers: 8,
      newSignups: 3,
    };
    
    vi.mocked(mockApi.getMetrics).mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useMetrics(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi.getMetrics).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockMetrics);
  });
});

describe('useAddUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add user and invalidate both users and metrics queries', async () => {
    const newUser: User = {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
      createdAt: new Date('2024-01-02'),
    };

    vi.mocked(mockApi.addUser).mockResolvedValue(newUser);

    // Create a QueryClient and spy on invalidateQueries
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAddUser(), { wrapper });

    // Execute the mutation
    result.current.mutate({
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi.addUser).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
    }, expect.any(Object));

    // Verify that both users and metrics queries are invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['metrics'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle add user error', async () => {
    vi.mocked(mockApi.addUser).mockRejectedValue(new Error('Add user failed'));

    const { result } = renderHook(() => useAddUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Jane Doe',
      email: 'jane@example.com',
      isActive: true,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Add user failed'));
  });
});

describe('useDeleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete user and invalidate both users and metrics queries', async () => {
    vi.mocked(mockApi.deleteUser).mockResolvedValue(undefined);

    // Create a QueryClient and spy on invalidateQueries
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteUser(), { wrapper });

    // Execute the mutation
    result.current.mutate('user123');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi.deleteUser).toHaveBeenCalledWith('user123', expect.any(Object));

    // Verify that both users and metrics queries are invalidated
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['metrics'] });
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle delete user error', async () => {
    vi.mocked(mockApi.deleteUser).mockRejectedValue(new Error('Delete user failed'));

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('user123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Delete user failed'));
  });
});

describe('Query Invalidation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should ensure metrics refresh after user mutations', async () => {
    // This test simulates the real-world scenario where adding a user
    // should cause the metrics to be recalculated
    
    const initialMetrics = { totalUsers: 5, activeUsers: 4, newSignups: 2 };
    const updatedMetrics = { totalUsers: 6, activeUsers: 5, newSignups: 3 };
    const newUser: User = {
      id: '6',
      name: 'New User',
      email: 'new@example.com',
      isActive: true,
      createdAt: new Date(),
    };

    // Mock API responses
    vi.mocked(mockApi.getMetrics)
      .mockResolvedValueOnce(initialMetrics)
      .mockResolvedValueOnce(updatedMetrics);
    vi.mocked(mockApi.addUser).mockResolvedValue(newUser);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // First, get initial metrics
    const { result: metricsResult } = renderHook(() => useMetrics(), { wrapper });
    await waitFor(() => expect(metricsResult.current.isSuccess).toBe(true));
    expect(metricsResult.current.data).toEqual(initialMetrics);

    // Then, add a user (which should invalidate metrics)
    const { result: addUserResult } = renderHook(() => useAddUser(), { wrapper });
    addUserResult.current.mutate({
      name: 'New User',
      email: 'new@example.com',
      isActive: true,
    });

    await waitFor(() => expect(addUserResult.current.isSuccess).toBe(true));

    // Verify that getMetrics was called again after the mutation
    // (due to query invalidation)
    await waitFor(() => {
      expect(mockApi.getMetrics).toHaveBeenCalledTimes(2);
    });
  });
});