import { useState, useEffect, useMemo, useRef } from 'react';
import type { User } from '../types/user';

// Custom debounce hook
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Get search term from URL
const getSearchTermFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('search') || '';
};

// Update URL with search term
const updateUrlSearchParam = (searchTerm: string) => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  if (searchTerm.trim()) {
    url.searchParams.set('search', searchTerm.trim());
  } else {
    url.searchParams.delete('search');
  }
  
  window.history.replaceState({}, '', url.toString());
};

export const useUserSearch = (users: User[] = []) => {
  // Initialize search term from URL
  const [searchTerm, setSearchTermState] = useState(getSearchTermFromUrl());
  const isInitializedRef = useRef(false);
  
  // Debounced search term for URL updates (300ms)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Update URL when debounced search term changes (but not on initial load)
  useEffect(() => {
    if (isInitializedRef.current) {
      updateUrlSearchParam(debouncedSearchTerm);
    } else {
      isInitializedRef.current = true;
    }
  }, [debouncedSearchTerm]);

  // Handle browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setSearchTermState(getSearchTermFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }, [users, searchTerm]);

  const setSearchTerm = (term: string) => {
    setSearchTermState(term);
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredUsers,
  };
};