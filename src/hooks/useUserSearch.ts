import { useState, useEffect, useMemo } from 'react';
import type { User } from '../types/user';

export const useUserSearch = (users: User[] = []) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    // Initialize from URL params
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('search') || '';
  });

  // Update URL when search term changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const url = new URL(window.location.href);
      if (searchTerm) {
        url.searchParams.set('search', searchTerm);
      } else {
        url.searchParams.delete('search');
      }
      window.history.replaceState({}, '', url.toString());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [users, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredUsers,
  };
};