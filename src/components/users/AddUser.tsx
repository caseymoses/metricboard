import { useState } from 'react';
import { useAddUser } from '../../hooks/useUsers';

export const AddUser = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true,
  });
  
  const addUserMutation = useAddUser();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addUserMutation.mutate(formData, {
      onSuccess: () => {
        setFormData({ name: '', email: '', isActive: true });
        setIsOpen(false);
      },
    });
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Add User
      </button>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Add New User</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Active user</span>
        </label>
      </div>
      
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={addUserMutation.isPending || !formData.name.trim() || !formData.email.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addUserMutation.isPending ? 'Adding...' : 'Add User'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setFormData({ name: '', email: '', isActive: true });
          }}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
      
      {addUserMutation.error && (
        <div className="mt-3 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          Error adding user. Please try again.
        </div>
      )}
    </form>
  );
};