import type { User, Metrics } from '../types/user';

// Mock data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLoginAt: new Date('2024-02-04'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    isActive: true,
    createdAt: new Date('2024-01-20'),
    lastLoginAt: new Date('2024-02-03'),
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    isActive: false,
    createdAt: new Date('2024-01-10'),
    lastLoginAt: new Date('2024-01-25'),
  },
  {
    id: '4',
    name: 'Alice Brown',
    email: 'alice@example.com',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLoginAt: new Date('2024-02-04'),
  },
  {
    id: '5',
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    isActive: true,
    createdAt: new Date('2024-02-02'),
  },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API functions
export const mockApi = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    await delay(500);
    return [...mockUsers];
  },

  // Get metrics
  getMetrics: async (): Promise<Metrics> => {
    await delay(300);
    const activeUsers = mockUsers.filter(user => user.isActive).length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = mockUsers.filter(user => user.createdAt > thirtyDaysAgo).length;
    
    return {
      totalUsers: mockUsers.length,
      activeUsers,
      newSignups,
    };
  },

  // Add new user
  addUser: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    await delay(400);
    const newUser: User = {
      ...userData,
      id: `${Date.now()}`,
      createdAt: new Date(),
    };
    mockUsers.push(newUser);
    return newUser;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    await delay(300);
    const index = mockUsers.findIndex(user => user.id === userId);
    if (index > -1) {
      mockUsers.splice(index, 1);
    }
  },
};