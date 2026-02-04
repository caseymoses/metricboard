import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MetricsCard, MetricsDashboard } from './MetricsCard';
import * as useUsersModule from '../../hooks/useUsers';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Metrics } from '../../types/user';

// Mock the useUsers hook module
vi.mock('../../hooks/useUsers');

describe('MetricsCard', () => {
  it('should update display value when value prop changes', async () => {
    const { rerender } = render(
      <MetricsCard title="Test Metric" value={100} color="blue" />
    );

    // Wait for the initial animation to complete
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    // Change the value prop
    rerender(
      <MetricsCard title="Test Metric" value={250} color="blue" />
    );

    // Wait for the animation to complete and verify new value is displayed
    await waitFor(() => {
      expect(screen.getByText('250')).toBeInTheDocument();
    });
  });

  it('should format numbers with locale string', async () => {
    render(
      <MetricsCard title="Large Number" value={1234567} color="green" />
    );

    // Wait for the animation to complete and verify formatting
    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  it('should display subtitle when provided', () => {
    render(
      <MetricsCard 
        title="Test Metric" 
        value={100} 
        color="purple" 
        subtitle="Test subtitle"
      />
    );

    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('should apply correct color classes', () => {
    const { container } = render(
      <MetricsCard title="Blue Metric" value={100} color="blue" />
    );

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });
});

describe('MetricsDashboard', () => {
  let queryClient: QueryClient;
  const mockUseMetrics = vi.mocked(useUsersModule.useMetrics);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  it('should render loading state', () => {
    mockUseMetrics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      refetch: vi.fn(),
    } as UseQueryResult<Metrics>);

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsDashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Test error'),
      isError: true,
      refetch: vi.fn(),
    } as UseQueryResult<Metrics>);

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsDashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText('Error loading metrics')).toBeInTheDocument();
  });

  it('should render metrics when data is available', async () => {
    const mockMetrics = {
      totalUsers: 150,
      activeUsers: 120,
      newSignups: 25,
    };

    mockUseMetrics.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      isError: false,
      refetch: vi.fn(),
    } as UseQueryResult<Metrics>);

    render(
      <QueryClientProvider client={queryClient}>
        <MetricsDashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('New Signups')).toBeInTheDocument();
    
    // Wait for animations to complete and check values
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('should return null when data is null', () => {
    mockUseMetrics.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: vi.fn(),
    } as UseQueryResult<Metrics>);

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MetricsDashboard />
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});