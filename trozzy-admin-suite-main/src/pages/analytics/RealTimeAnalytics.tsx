import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Users, ShoppingCart, IndianRupee, Globe, Clock, Pause, Play } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

type RealtimePayload = {
  success: boolean;
  data?: {
    liveData: {
      activeUsers: number;
      ordersPerMinute: number;
      revenuePerMinute: number;
      pageViews: number;
    };
    realtimeChart: { time: string; users: number }[];
    activePages: { page: string; users: number; duration: string }[];
    locationData: { country: string; users: number; flag: string }[];
    meta?: {
      notices?: string[];
      supported?: Record<string, boolean>;
    };
  };
  message?: string;
  error?: string;
};

const RealTimeAnalytics = () => {
  const { toast } = useToast();
  const formatMoney = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(amount ?? 0) || 0);
    } catch (_e) {
      return `₹${Math.round(Number(amount ?? 0) || 0)}`;
    }
  };
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [liveData, setLiveData] = useState({
    activeUsers: 0,
    ordersPerMinute: 0,
    revenuePerMinute: 0,
    pageViews: 0,
  });

  const [realtimeChart, setRealtimeChart] = useState<{ time: string; users: number }[]>([]);
  const [activePages, setActivePages] = useState<{ page: string; users: number; duration: string }[]>([]);
  const [locationData, setLocationData] = useState<{ country: string; users: number; flag: string }[]>([]);

  const updateData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotice(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to view analytics.');
        return;
      }

      const response = await axios.get<RealtimePayload>('/api/admin/analytics/realtime', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = response.data;
      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.message || payload?.error || 'Failed to load realtime analytics');
      }

      setNotice(payload.message || (payload.data?.meta?.notices ?? []).join(' '));

      setLiveData(payload.data.liveData);
      setRealtimeChart(payload.data.realtimeChart);
      setActivePages(payload.data.activePages);
      setLocationData(payload.data.locationData);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setError('Real-time analytics not available');
      } else {
        setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Unable to fetch live analytics');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    updateData();
    const interval = setInterval(updateData, 3000);
    return () => clearInterval(interval);
  }, [isPaused, updateData]);

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast({ 
      title: isPaused ? 'Resumed' : 'Paused', 
      description: isPaused ? 'Live updates resumed' : 'Live updates paused' 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-Time Analytics</h1>
          <p className="text-muted-foreground">
            Live activity on your store right now.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleTogglePause}>
            {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Badge className={`${isPaused ? 'bg-muted text-muted-foreground' : 'gradient-primary text-primary-foreground animate-pulse'}`}>
            <Activity className="mr-2 h-4 w-4" />
            {isPaused ? 'Paused' : 'Live'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : liveData.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orders/min</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : liveData.ordersPerMinute.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue/min</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : formatMoney(liveData.revenuePerMinute)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Page Views</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : liveData.pageViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Live User Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={realtimeChart}>
              <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {(error || notice) && (
          <Card className="glass lg:col-span-2">
            <CardContent className="pt-6">
              {error ? <div className="text-destructive font-medium">{error}</div> : null}
              {!error && notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}
            </CardContent>
          </Card>
        )}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Active Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePages.length === 0 ? (
                <div className="text-sm text-muted-foreground">No live data right now</div>
              ) : (
                activePages.map((page) => (
                  <div key={page.page} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{page.page}</p>
                      <p className="text-xs text-muted-foreground">Avg time: {page.duration}</p>
                    </div>
                    <Badge variant="secondary">{page.users} users</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              Users by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {locationData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No live data right now</div>
              ) : (
                locationData.map((loc) => (
                  <div key={loc.country} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{loc.flag}</span>
                      <span className="font-medium text-sm">{loc.country}</span>
                    </div>
                    <Badge variant="secondary">{loc.users} active</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RealTimeAnalytics;
