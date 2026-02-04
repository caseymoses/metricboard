import { useUsers } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';
import { UserCard } from './UserCard';
import type { User } from '../../types/user';

interface UserListProps {
  filteredUsers?: User[];
}

export const UserList = ({ filteredUsers }: UserListProps) => {
  const { data: users, isLoading, error } = useUsers();
  const { selectedUsers, clearSelection } = useUserStore(state => ({
    selectedUsers: state.selectedUsers,
    clearSelection: state.clearSelection,
  }));
  
  // Use filtered users if provided, otherwise use all users
  const displayUsers = filteredUsers || users;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold mb-2">Error Loading Users</h3>
        <p>There was a problem loading the user list. Please try again.</p>
      </div>
    );
  }
  
  if (!displayUsers || displayUsers.length === 0) {
    // Show different messages for filtered vs. no users
    const isFiltered = filteredUsers !== undefined;
    return (
      <div className="p-6 text-center text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">
          {isFiltered ? 'No Matching Users' : 'No Users Found'}
        </h3>
        <p>
          {isFiltered 
            ? 'No users match your search criteria. Try adjusting your search term.'
            : 'There are no users in the system yet.'}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      {selectedUsers.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <span className="text-blue-800">
            {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Clear Selection
          </button>
        </div>
      )}
      
      <div className="space-y-4">
        {displayUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
};