import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, BarChart3, PieChart, Download, Filter } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
} from 'recharts';
import { exportToCSV } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

type AdvancedAnalyticsPayload = {
  success: boolean;
  data?: {
    period: string;
    cohortData: { month: string; newUsers: number; returning: number; churned: number }[];
    funnelData: { stage: string; value: number; rate: number }[];
    revenueBreakdown: { category: string; value: number; growth: number }[];
  };
  message?: string;
  error?: string;
};

const AdvancedAnalytics = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState('30d');
  const [filterApplied, setFilterApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdvancedAnalyticsPayload['data'] | null>(null);

  // Store filter state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('trozzy_advanced_analytics_filter');
    if (saved) setPeriod(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('trozzy_advanced_analytics_filter', period);
  }, [period]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setData(null);
          setError('Please sign in to view analytics.');
          return;
        }

        const cacheBust = Date.now();
        const response = await axios.get<AdvancedAnalyticsPayload>(`/api/admin/analytics/advanced?period=${period}&_t=${cacheBust}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          },
        );

        const payload = response.data;
        if (!payload?.success || !payload?.data) {
          throw new Error(payload?.message || payload?.error || 'Failed to load advanced analytics');
        }

        if (!cancelled) setData(payload.data);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load advanced analytics';
        if (!cancelled) {
          setError(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const cohortData = data?.cohortData ?? [];
  const funnelData = data?.funnelData ?? [];
  const revenueBreakdown = data?.revenueBreakdown ?? [];

  const handleApplyFilter = () => {
    setFilterApplied(true);
    toast({ title: 'Filters Applied', description: `Showing data for ${period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : period === '90d' ? 'Last 90 days' : 'Last year'}` });
  };

  const handleExport = () => {
    if (!data) {
      toast({ title: 'Error', description: 'No data available to export', variant: 'destructive' });
      return;
    }
    const exportData = [
      ...cohortData.map(d => ({ type: 'Cohort', month: d.month, newUsers: d.newUsers, returning: d.returning, churned: d.churned })),
      ...funnelData.map(d => ({ type: 'Funnel', stage: d.stage, value: d.value, rate: `${d.rate}%` })),
      ...revenueBreakdown.map(d => ({ type: 'Revenue', category: d.category, value: `$${d.value}`, growth: `${d.growth}%` })),
    ];
    const today = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `advanced-analytics-${today}.csv`);
    toast({ title: 'Exported', description: `advanced-analytics-${today}.csv downloaded` });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep dive into your store's performance metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 glass">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="glass" onClick={handleApplyFilter}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button onClick={handleExport} className="gradient-primary text-primary-foreground">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {error && (
          <Card className="glass lg:col-span-2">
            <CardContent className="pt-6">
              <div className="text-destructive font-medium">{error}</div>
            </CardContent>
          </Card>
        )}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cohort Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="newUsers" fill="hsl(262, 83%, 58%)" radius={[4, 4, 0, 0]} name="New Users" />
                <Bar dataKey="returning" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} name="Returning" />
                <Line type="monotone" dataKey="churned" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Churned" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.stage}</span>
                    <span className="text-muted-foreground">{item.value.toLocaleString()} ({item.rate}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-success" />
            Revenue by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueBreakdown.length === 0 ? (
            <div className="text-sm text-muted-foreground">No data available</div>
          ) : (
            <div className="mb-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="hsl(142, 76%, 36%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="grid md:grid-cols-4 gap-4">
            {revenueBreakdown.map((item) => (
              <div key={item.category} className="p-4 rounded-xl bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <p className="text-2xl font-bold">${(item.value / 1000).toFixed(0)}K</p>
                <div className={`text-sm font-medium ${item.growth >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {item.growth >= 0 ? '+' : ''}{item.growth}% vs last period
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
