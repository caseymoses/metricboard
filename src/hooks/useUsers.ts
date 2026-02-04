import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '../api/mockApi';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: mockApi.getUsers,
  });
};

export const useMetrics = () => {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: mockApi.getMetrics,
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: mockApi.addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: mockApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
    },
  });
};