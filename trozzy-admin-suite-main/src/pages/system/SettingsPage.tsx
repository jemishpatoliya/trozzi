import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Settings as SettingsIcon, Shield, Zap, Globe, Server, User, Save, LogOut } from 'lucide-react';
import { initializeMockData, getFeatureFlags, setFeatureFlags, FeatureFlag, getLoggedInUser, setLoggedInUser, getAuthUser, setAuthUser } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

type AdminContentSettingsPayload = {
  success: boolean;
  data?: {
    brandLogoUrl?: string;
  };
  message?: string;
};

const SettingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flags, setFlagsState] = useState<FeatureFlag[]>([]);
  const [profile, setProfile] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);

  useEffect(() => {
    initializeMockData();
    setFlagsState(getFeatureFlags());
    const user = getLoggedInUser();
    if (user) setProfile({ name: user.name, email: user.email, password: '', confirmPassword: '' });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLogoLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get<AdminContentSettingsPayload>(`${API_BASE_URL}/admin/content-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!cancelled && res.data?.success) {
          setBrandLogoUrl(String(res.data?.data?.brandLogoUrl || '').trim());
        }
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to load brand logo setting';
        if (!cancelled) toast({ title: 'Error', description: msg, variant: 'destructive' });
      } finally {
        if (!cancelled) setLogoLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const uploadLogo = async (file: File) => {
    setLogoUploading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in to upload a logo.');

      const form = new FormData();
      form.append('image', file);

      const res = await axios.post(`${API_BASE_URL}/upload/admin-image?folder=branding`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = String(res?.data?.url || '').trim();
      if (!url) throw new Error(res?.data?.message || 'Upload failed');
      setBrandLogoUrl(url);
      toast({ title: 'Uploaded', description: 'Logo uploaded. Click Save to apply.' });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Logo upload failed';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const saveLogo = async () => {
    setLogoSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in to manage settings.');

      const res = await axios.put<AdminContentSettingsPayload>(
        `${API_BASE_URL}/admin/content-settings`,
        { brandLogoUrl },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to save brand logo');
      }

      setBrandLogoUrl(String(res.data?.data?.brandLogoUrl || brandLogoUrl).trim());
      toast({ title: 'Saved', description: 'Brand logo saved successfully' });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save brand logo';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLogoSaving(false);
    }
  };

  const toggleFlag = (id: string) => {
    const updated = flags.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    setFlagsState(updated);
    setFeatureFlags(updated);
    toast({ title: 'Updated', description: 'Setting changed' });
  };

  const handleProfileSave = () => {
    if (profile.password && profile.password !== profile.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const authUser = getAuthUser();
    if (authUser) {
      const updated = { ...authUser, name: profile.name, email: profile.email, ...(profile.password ? { password: profile.password } : {}) };
      setAuthUser(updated);
      setLoggedInUser(updated);
      toast({ title: 'Saved', description: 'Profile updated successfully' });
      setProfile({ ...profile, password: '', confirmPassword: '' });
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    navigate('/sign-in');
  };

  const systemHealth = [
    { name: 'Database', status: 'healthy', icon: Server },
    { name: 'Cache', status: 'healthy', icon: Zap },
    { name: 'API', status: 'healthy', icon: Globe },
    { name: 'Security', status: 'healthy', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="text-muted-foreground">System configuration and profile.</p></div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Admin Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={profile.password} onChange={e => setProfile({ ...profile, password: e.target.value })} placeholder="Leave blank to keep current" /></div>
            <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={profile.confirmPassword} onChange={e => setProfile({ ...profile, confirmPassword: e.target.value })} /></div>
            <div className="flex gap-2">
              <Button onClick={handleProfileSave} className="flex-1 gradient-primary text-primary-foreground"><Save className="mr-2 h-4 w-4" />Save Profile</Button>
              <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />Brand Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-lg bg-muted/50 p-4 flex items-center justify-center min-h-20">
                {brandLogoUrl ? (
                  <img src={brandLogoUrl} alt="Brand logo" className="h-14 w-auto object-contain" />
                ) : (
                  <span className="text-sm text-muted-foreground">No logo set</span>
                )}
              </div>
              {brandLogoUrl ? (
                <p className="text-xs text-muted-foreground break-all">{brandLogoUrl}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Upload Logo</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={logoUploading || logoSaving}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0];
                  if (f) void uploadLogo(f);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Upload to S3 and Save to apply it across website header, login and register.
              </p>
            </div>

            <Button
              onClick={() => void saveLogo()}
              className="w-full gradient-primary text-primary-foreground"
              disabled={logoLoading || logoUploading || logoSaving}
            >
              {logoSaving ? 'Saving…' : logoUploading ? 'Uploading…' : logoLoading ? 'Loading…' : 'Save Logo'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" />Feature Flags</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {flags.map(flag => (
              <div key={flag.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div><p className="font-medium">{flag.name}</p><p className="text-sm text-muted-foreground">{flag.description}</p></div>
                <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag.id)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-success" />System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {systemHealth.map(item => (
                <div key={item.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3"><item.icon className="h-5 w-5 text-muted-foreground" /><span className="font-medium">{item.name}</span></div>
                  <StatusBadge status="success" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
