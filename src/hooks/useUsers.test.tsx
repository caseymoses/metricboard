import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddUser, useDeleteUser, useUsers, useMetrics } from './useUsers';
import { mockApi } from '../api/mockApi';

// Mock the API
vi.mock('../api/mockApi', () => ({
  mockApi: {
    addUser: vi.fn(),
    deleteUser: vi.fn(),
    getUsers: vi.fn(),
    getMetrics: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('User Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAddUser', () => {
    it('calls the API with correct data', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
      };
      
      vi.mocked(mockApi.addUser).mockResolvedValue(mockUser);
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAddUser(), { wrapper });
      
      // Execute the mutation
      await result.current.mutateAsync({
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
      });
      
      // Verify API was called with correct data (check first argument)
      expect(mockApi.addUser).toHaveBeenCalled();
      const firstCall = vi.mocked(mockApi.addUser).mock.calls[0];
      expect(firstCall[0]).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
      });
    });
    
    it('handles mutation success', async () => {
      const mockUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
      };
      
      vi.mocked(mockApi.addUser).mockResolvedValue(mockUser);
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useAddUser(), { wrapper });
      
      const resultData = await result.current.mutateAsync({
        name: 'Test User',
        email: 'test@example.com',
        isActive: true,
      });
      
      expect(resultData).toEqual(mockUser);
    });
  });

  describe('useDeleteUser', () => {
    it('calls the API with correct user ID', async () => {
      vi.mocked(mockApi.deleteUser).mockResolvedValue();
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteUser(), { wrapper });
      
      await result.current.mutateAsync('123');
      
      expect(mockApi.deleteUser).toHaveBeenCalled();
      const firstCall = vi.mocked(mockApi.deleteUser).mock.calls[0];
      expect(firstCall[0]).toBe('123');
    });
  });

  describe('useUsers', () => {
    it('fetches users from API', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          isActive: true,
          createdAt: new Date(),
        },
      ];
      
      vi.mocked(mockApi.getUsers).mockResolvedValue(mockUsers);
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useUsers(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(result.current.data).toEqual(mockUsers);
      expect(mockApi.getUsers).toHaveBeenCalledOnce();
    });
  });

  describe('useMetrics', () => {
    it('fetches metrics from API', async () => {
      const mockMetrics = {
        totalUsers: 10,
        activeUsers: 8,
        newSignups: 2,
      };
      
      vi.mocked(mockApi.getMetrics).mockResolvedValue(mockMetrics);
      
      const wrapper = createWrapper();
      const { result } = renderHook(() => useMetrics(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      
      expect(result.current.data).toEqual(mockMetrics);
      expect(mockApi.getMetrics).toHaveBeenCalledOnce();
    });
  });
});