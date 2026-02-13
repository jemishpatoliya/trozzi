import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  ShoppingCart,
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'recharts';
import axios from 'axios';

type DashboardPeriod = 'today' | 'week' | 'month';

type BackendDashboardPayload = {
  success: boolean;
  data?: {
    totalProducts?: number;
    totalUsers?: number;
    totalRevenue?: number;
    customers?: number;
    orders?: number;
    growth?: {
      products?: string;
      users?: string;
      revenue?: string;
      orders?: string;
      customers?: string;
    };
    analytics?: {
      salesChart?: Array<{ date: string; sales?: number; revenue?: number }>;
      trafficChart?: Array<{ date: string; visitors?: number; sessions?: number }>;
      conversionRate?: string;
      bounceRate?: string;
      avgSession?: string;
      topProducts?: Array<{ name?: string; productName?: string; sales?: number; revenue?: number }>;
      alerts?: Array<{ type: 'info' | 'warning' | 'error' | 'success'; message?: string; count?: number }>;
      notifications?: Array<{ id: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; enabled: boolean }>;
      lowStockProductsList?: Array<{ name?: string; stock?: number }>;
    };
  };
  message?: string;
  error?: string;
};

type DashboardData = {
  current: {
    products: number;
    orders: number;
    revenue: number;
    customers: number;
    currency?: string;
    growth?: {
      products?: string;
      orders?: string;
      revenue?: string;
      customers?: string;
    };
  };
  analytics: {
    sales: { date: string; amount: number }[];
    visitors: { date: string; count: number }[];
    topProducts: { name: string; sales: number; revenue: number }[];
    conversionRate: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  lowStockProducts: { name: string; stock: number }[];
  notifications: { id: string; title: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; enabled: boolean }[];
};

const Dashboard = () => {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setData(null);
          setError('Please sign in to view dashboard.');
          return;
        }

        const response = await axios.get<BackendDashboardPayload>(`/api/admin/dashboard?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const payload = response.data;
        if (!payload?.success || !payload?.data) {
          throw new Error(payload?.message || payload?.error || 'Failed to load dashboard');
        }

        const backend = payload.data;
        const current = {
          products: Number(backend.totalProducts ?? 0),
          orders: Number(backend.orders ?? 0),
          revenue: Number(backend.totalRevenue ?? 0),
          customers: Number(backend.customers ?? backend.totalUsers ?? 0),
          currency: 'INR',
          growth: {
            products: backend.growth?.products ?? '0%',
            orders: backend.growth?.orders ?? '0%',
            revenue: backend.growth?.revenue ?? '0%',
            customers: backend.growth?.customers ?? backend.growth?.users ?? '0%',
          },
        };

        const sales = (backend.analytics?.salesChart ?? []).map((row) => ({
          date: row.date,
          amount: Number(row.revenue ?? 0),
        }));

        const visitors = (backend.analytics?.trafficChart ?? []).map((row) => ({
          date: row.date,
          count: Number(row.visitors ?? 0),
        }));

        const topProducts = (backend.analytics?.topProducts ?? []).map((p) => ({
          name: String(p.name ?? p.productName ?? ''),
          sales: Number(p.sales ?? 0),
          revenue: Number(p.revenue ?? 0),
        })).filter((p) => p.name);

        const notifications = (backend.analytics?.notifications ?? []).map((n) => ({
          id: String(n.id ?? ''),
          title: String(n.title ?? ''),
          message: String(n.message ?? ''),
          type: n.type,
          enabled: Boolean(n.enabled),
        })).filter((n) => n.id);

        const lowStockProducts = (backend.analytics?.lowStockProductsList ?? []).map((p) => ({
          name: String(p.name ?? ''),
          stock: Number(p.stock ?? 0),
        })).filter((p) => p.name);

        const normalizePercent = (value?: string) => {
          if (!value) return 0;
          const n = Number(String(value).replace('%', ''));
          return Number.isFinite(n) ? n : 0;
        };

        const normalizeDurationSeconds = (value?: string) => {
          if (!value) return 0;
          const trimmed = String(value).trim();
          if (trimmed.endsWith('m')) {
            const minutes = Number(trimmed.slice(0, -1));
            return Number.isFinite(minutes) ? Math.round(minutes * 60) : 0;
          }
          if (trimmed.endsWith('s')) {
            const seconds = Number(trimmed.slice(0, -1));
            return Number.isFinite(seconds) ? Math.round(seconds) : 0;
          }
          const seconds = Number(trimmed);
          return Number.isFinite(seconds) ? Math.round(seconds) : 0;
        };

        const formatted: DashboardData = {
          current,
          analytics: {
            sales,
            visitors,
            topProducts,
            conversionRate: normalizePercent(backend.analytics?.conversionRate),
            bounceRate: normalizePercent(backend.analytics?.bounceRate),
            avgSessionDuration: normalizeDurationSeconds(backend.analytics?.avgSession),
          },
          lowStockProducts,
          notifications,
        };

        if (!cancelled) setData(formatted);
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to load dashboard';
        if (!cancelled) {
          setError(msg);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const currentStats = data?.current;
  const analytics = data?.analytics;
  const notifications = data?.notifications ?? [];
  const lowStockProducts = data?.lowStockProducts ?? [];

  const visitorChartData = useMemo(() => {
    const existing = analytics?.visitors ?? [];
    if (existing.length > 0) return existing;

    const daysBack = period === 'month' ? 30 : 7;
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - (daysBack - 1));

    const buckets: { date: string; count: number }[] = [];
    for (let i = 0; i < daysBack; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.push({ date: d.toISOString().split('T')[0], count: 0 });
    }
    return buckets;
  }, [analytics?.visitors, period]);

  const isVisitorChartAllZero = useMemo(() => {
    return visitorChartData.length > 0 && visitorChartData.every((row) => (row.count ?? 0) === 0);
  }, [visitorChartData]);

  const getChangeType = (change?: string) => {
    const value = String(change ?? '').trim();
    if (!value) return undefined;
    const n = Number(value.replace('%', '').replace('+', ''));
    if (!Number.isFinite(n)) return 'neutral' as const;
    if (n > 0) return 'positive' as const;
    if (n < 0) return 'negative' as const;
    return 'neutral' as const;
  };

  const currencyCode = currentStats?.currency || 'INR';
  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currencyCode,
      });
    } catch (_err) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      });
    }
  }, [currencyCode]);

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList className="glass">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={currentStats?.products ?? (isLoading ? '...' : 0)}
          change={currentStats?.growth?.products}
          changeType={getChangeType(currentStats?.growth?.products)}
          icon={Package}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Total Orders"
          value={currentStats?.orders ?? (isLoading ? '...' : 0)}
          change={currentStats?.growth?.orders}
          changeType={getChangeType(currentStats?.growth?.orders)}
          icon={ShoppingCart}
          iconColor="bg-info/10 text-info"
        />
        <StatCard
          title="Revenue"
          value={typeof currentStats?.revenue === 'number' ? formatCurrency(currentStats.revenue) : isLoading ? '...' : formatCurrency(0)}
          change={currentStats?.growth?.revenue}
          changeType={getChangeType(currentStats?.growth?.revenue)}
          icon={IndianRupee}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Customers"
          value={currentStats?.customers ?? (isLoading ? '...' : 0)}
          change={currentStats?.growth?.customers}
          changeType={getChangeType(currentStats?.growth?.customers)}
          icon={Users}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {error && (
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-destructive font-medium">{error}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics?.sales ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Visitor Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {isVisitorChartAllZero && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-sm text-muted-foreground">No traffic data available</div>
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visitorChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--accent))"
                  radius={[4, 4, 0, 0]}
                  minPointSize={2}
                  isAnimationActive={false}
                />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics?.topProducts ?? []).map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <Badge variant="secondary">{product.sales} sales</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 text-warning font-medium text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Low Stock Warning
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {lowStockProducts.length} product(s) running low on stock
                  </p>
                </div>
              )}
              {notifications.filter((n) => n.enabled).slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.type === 'warning'
                      ? 'bg-warning/10 border-warning/20'
                      : notification.type === 'error'
                      ? 'bg-destructive/10 border-destructive/20'
                      : notification.type === 'success'
                      ? 'bg-success/10 border-success/20'
                      : 'bg-info/10 border-info/20'
                  }`}
                >
                  <div className="font-medium text-sm">{notification.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{analytics?.conversionRate ?? 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bounce Rate</p>
                <p className="text-2xl font-bold">{analytics?.bounceRate ?? 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-2xl font-bold">{Math.floor((analytics?.avgSessionDuration ?? 0) / 60)}m {(analytics?.avgSessionDuration ?? 0) % 60}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
