export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Metrics {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
}