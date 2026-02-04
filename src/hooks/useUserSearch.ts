import { useState } from 'react';
import type { User } from '../types/user';

export const useUserSearch = (users: User[] = []) => {
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Implement search functionality
  // - Filter users by name or email
  // - Debounce URL updates by 300ms
  // - Persist search term in URL params

  return {
    searchTerm,
    setSearchTerm,
    filteredUsers: users, // Currently returns all users unfiltered
  };
};
