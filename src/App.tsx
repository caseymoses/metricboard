import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsDashboard } from './components/dashboard/MetricsCard';
import { UserList } from './components/users/UserList';
import { UserSearch } from './components/users/UserSearch';
import { AddUser } from './components/users/AddUser';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">MetricBoard</h1>
            <p className="text-gray-600">Analytics Dashboard & User Management</p>
          </div>
        </header>
        
        <main className="max-w-6xl mx-auto px-6 py-8">
          <MetricsDashboard />
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">User Management</h2>
            
            <UserSearch />
            <AddUser />
            <UserList />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;