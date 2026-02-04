interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  resultsCount?: number;
}

export const UserSearch = ({ searchTerm, onSearchChange, resultsCount }: UserSearchProps) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      
      {searchTerm && (
        <div className="mt-2 text-sm text-gray-600">
          {resultsCount !== undefined ? (
            <>
              {resultsCount} result{resultsCount !== 1 ? 's' : ''} found
              {resultsCount === 0 && (
                <span className="ml-2 text-gray-500">
                  - Try adjusting your search term
                </span>
              )}
            </>
          ) : (
            'Searching...'
          )}
        </div>
      )}
    </div>
  );
};