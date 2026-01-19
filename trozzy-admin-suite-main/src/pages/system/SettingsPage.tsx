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

const SettingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [flags, setFlagsState] = useState<FeatureFlag[]>([]);
  const [profile, setProfile] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    initializeMockData();
    setFlagsState(getFeatureFlags());
    const user = getLoggedInUser();
    if (user) setProfile({ name: user.name, email: user.email, password: '', confirmPassword: '' });
  }, []);

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
