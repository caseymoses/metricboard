import { useEffect, useState } from 'react';
import { useMetrics } from '../../hooks/useUsers';

interface MetricsCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'purple';
  subtitle?: string;
}

export const MetricsCard = ({ title, value, color, subtitle }: MetricsCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  // BUG: Missing 'value' in dependency array - causes stale data
  useEffect(() => {
    // Animate the number change
    const timer = setTimeout(() => {
      setDisplayValue(value);
      setAnimationKey(prev => prev + 1);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Missing 'value' dependency - this is the bug!
  
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };
  
  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div 
        key={animationKey}
        className="text-3xl font-bold mb-1 transition-all duration-300 ease-in-out"
      >
        {displayValue.toLocaleString()}
      </div>
      {subtitle && <p className="text-sm opacity-75">{subtitle}</p>}
    </div>
  );
};

export const MetricsDashboard = () => {
  const { data: metrics, isLoading, error } = useMetrics();
  // Note: userMetrics from useUserMetrics() has a buggy selector but not used here
  
  if (isLoading) return <div className="p-6">Loading metrics...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading metrics</div>;
  if (!metrics) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricsCard
        title="Total Users"
        value={metrics.totalUsers}
        color="blue"
        subtitle="All registered users"
      />
      <MetricsCard
        title="Active Users"
        value={metrics.activeUsers}
        color="green"
        subtitle="Currently active"
      />
      <MetricsCard
        title="New Signups"
        value={metrics.newSignups}
        color="purple"
        subtitle="Last 30 days"
      />
    </div>
  );
};