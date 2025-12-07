import { useState, useMemo } from 'react';

interface UseSearchFilterOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  caseSensitive?: boolean;
}

interface UseSearchFilterReturn<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredData: T[];
  clearSearch: () => void;
}

/**
 * Custom hook for filtering data based on search query
 * Supports searching across multiple keys
 */
export const useSearchFilter = <T extends Record<string, any>>({
  data,
  searchKeys,
  caseSensitive = false,
}: UseSearchFilterOptions<T>): UseSearchFilterReturn<T> => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }

    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();

    return data.filter((item) => {
      return searchKeys.some((key) => {
        const value = item[key];
        if (value == null) return false;

        const stringValue = String(value);
        const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();

        return searchValue.includes(query);
      });
    });
  }, [data, searchQuery, searchKeys, caseSensitive]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    clearSearch,
  };
};

export default useSearchFilter;
