import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../types/user';

const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

const useURLSync = (key: string, initialValue: string = '') => {
  // Initialize state from URL params
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get(key) || initialValue;
    }
    return initialValue;
  });

  // Track if this is the first render to avoid updating URL on first render
  const hasRendered = React.useRef(false);

  // Update URL when value changes (debounced)
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    if (!hasRendered.current) {
      hasRendered.current = true;
      return;
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      
      if (debouncedValue) {
        url.searchParams.set(key, debouncedValue);
      } else {
        url.searchParams.delete(key);
      }
      
      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
    }
  }, [debouncedValue, key]);

  return [value, setValue] as const;
};

export const useUserSearch = (users: User[] = []) => {
  const [searchTerm, setSearchTerm] = useURLSync('search', '');

  // Filter users by name or email
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const term = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      user.name.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredUsers,
  };
};
