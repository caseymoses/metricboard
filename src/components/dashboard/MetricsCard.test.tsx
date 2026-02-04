import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MetricsCard, MetricsDashboard } from './MetricsCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the useMetrics hook
vi.mock('../../hooks/useUsers', () => ({
  useMetrics: vi.fn(),
}));

import { useMetrics } from '../../hooks/useUsers';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MetricsCard', () => {
  it('initially displays 0 then animates to the provided value', async () => {
    render(
      <MetricsCard 
        title="Test Metric" 
        value={42} 
        color="blue" 
      />
    );
    
    // Should start at 0
    expect(screen.getByText('0')).toBeInTheDocument();
    
    // Should animate to the actual value
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('updates display value when value prop changes', async () => {
    const { rerender } = render(
      <MetricsCard 
        title="Test Metric" 
        value={10} 
        color="green" 
      />
    );
    
    // Wait for initial animation
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    
    // Change the value prop
    rerender(
      <MetricsCard 
        title="Test Metric" 
        value={25} 
        color="green" 
      />
    );
    
    // Should animate to the new value
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('formats large numbers with locale string', async () => {
    render(
      <MetricsCard 
        title="Big Number" 
        value={1234567} 
        color="purple" 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  it('displays subtitle when provided', () => {
    render(
      <MetricsCard 
        title="Test Metric" 
        value={100} 
        color="blue" 
        subtitle="Test subtitle"
      />
    );
    
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });
});

describe('MetricsDashboard', () => {
  it('displays loading state', () => {
    vi.mocked(useMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    const Wrapper = createWrapper();
    render(<MetricsDashboard />, { wrapper: Wrapper });
    
    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.mocked(useMetrics).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Test error'),
    });
    
    const Wrapper = createWrapper();
    render(<MetricsDashboard />, { wrapper: Wrapper });
    
    expect(screen.getByText('Error loading metrics')).toBeInTheDocument();
  });

  it('renders metrics cards with data', async () => {
    vi.mocked(useMetrics).mockReturnValue({
      data: {
        totalUsers: 100,
        activeUsers: 75,
        newSignups: 15,
      },
      isLoading: false,
      error: null,
    });
    
    const Wrapper = createWrapper();
    render(<MetricsDashboard />, { wrapper: Wrapper });
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('New Signups')).toBeInTheDocument();
    
    // Wait for animations to complete and check values
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});