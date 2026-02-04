import type { User } from '../../types/user';
import { useDeleteUser } from '../../hooks/useUsers';
import { useUserStore } from '../../stores/userStore';

interface UserCardProps {
  user: User;
}

export const UserCard = ({ user }: UserCardProps) => {
  const deleteUserMutation = useDeleteUser();
  const { toggleUserSelection, selectedUsers } = useUserStore(state => ({
    toggleUserSelection: state.toggleUserSelection,
    selectedUsers: state.selectedUsers,
  }));
  
  const isSelected = selectedUsers.some(u => u.id === user.id);
  const isActive = user.isActive;
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <div 
      className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleUserSelection(user.id)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right text-sm">
            <p className="text-gray-600">Joined: {formatDate(user.createdAt)}</p>
            {user.lastLoginAt && (
              <p className="text-gray-500">Last login: {formatDate(user.lastLoginAt)}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span 
              className={`px-2 py-1 text-xs rounded-full ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
            
            <button
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};