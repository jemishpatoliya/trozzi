import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

type ContentSettings = {
  defaultAvatarUrl: string;
  bioMaxLength: number;
  showOrderHistory: boolean;
  showWishlistCount: boolean;
  enableProfileEditing: boolean;
};

type ContentSettingsPayload = {
  success: boolean;
  data?: ContentSettings;
  message?: string;
};

const DEFAULTS: ContentSettings = {
  defaultAvatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bioMaxLength: 500,
  showOrderHistory: true,
  showWishlistCount: true,
  enableProfileEditing: true,
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

const ContentSettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ContentSettings>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Please sign in to manage settings.');

        const res = await axios.get<ContentSettingsPayload>(`${API_BASE_URL}/admin/content-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = res.data;
        if (!payload?.success || !payload?.data) {
          throw new Error(payload?.message || 'Failed to load content settings');
        }

        if (!cancelled) setSettings({ ...DEFAULTS, ...payload.data });
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || 'Failed to load content settings';
        if (!cancelled) toast({ title: 'Error', description: msg, variant: 'destructive' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const preview = useMemo(() => {
    const avatar = settings.defaultAvatarUrl?.trim() || DEFAULTS.defaultAvatarUrl;
    const max = Number(settings.bioMaxLength || DEFAULTS.bioMaxLength);
    return {
      avatar,
      bioTitle: `Bio (max ${max} chars)`,
      bioText: 'This is a sample bio...',
      showOrderHistory: Boolean(settings.showOrderHistory),
      showWishlistCount: Boolean(settings.showWishlistCount),
      enableProfileEditing: Boolean(settings.enableProfileEditing),
    };
  }, [settings]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please sign in to manage settings.');

      const res = await axios.put<ContentSettingsPayload>(`${API_BASE_URL}/admin/content-settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payload = res.data;
      if (!payload?.success || !payload?.data) {
        throw new Error(payload?.message || 'Failed to save content settings');
      }

      setSettings({ ...DEFAULTS, ...payload.data });
      toast({ title: 'Saved', description: payload?.message || 'Content settings saved' });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to save content settings';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (key: keyof Pick<ContentSettings, 'showOrderHistory' | 'showWishlistCount' | 'enableProfileEditing'>) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Settings</h1>
        <p className="text-muted-foreground">Configure profile and content display options.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default Avatar URL</Label>
              <Input
                value={settings.defaultAvatarUrl}
                onChange={(e) => setSettings((p) => ({ ...p, defaultAvatarUrl: e.target.value }))}
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label>Bio Max Length</Label>
              <Input
                type="number"
                value={settings.bioMaxLength}
                onChange={(e) => setSettings((p) => ({ ...p, bioMaxLength: Number(e.target.value || 0) }))}
                disabled={isLoading || isSaving}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Show Order History</p>
                  <p className="text-sm text-muted-foreground">Display order history on profile</p>
                </div>
                <Switch
                  checked={settings.showOrderHistory}
                  onCheckedChange={() => toggle('showOrderHistory')}
                  disabled={isLoading || isSaving}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Show Wishlist Count</p>
                  <p className="text-sm text-muted-foreground">Display wishlist count</p>
                </div>
                <Switch
                  checked={settings.showWishlistCount}
                  onCheckedChange={() => toggle('showWishlistCount')}
                  disabled={isLoading || isSaving}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Enable Profile Editing</p>
                  <p className="text-sm text-muted-foreground">Allow users to edit profiles</p>
                </div>
                <Switch
                  checked={settings.enableProfileEditing}
                  onCheckedChange={() => toggle('enableProfileEditing')}
                  disabled={isLoading || isSaving}
                />
              </div>
            </div>

            <Button
              className="w-full gradient-primary text-primary-foreground"
              onClick={onSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/30 p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={preview.avatar}
                    alt="Sample User"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULTS.defaultAvatarUrl;
                    }}
                  />
                </div>
                <div>
                  <p className="font-semibold">Sample User</p>
                  <p className="text-sm text-muted-foreground">sample@email.com</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm text-muted-foreground">{preview.bioTitle}</p>
                <p className="text-sm">{preview.bioText}</p>
              </div>

              <div className="mt-6 space-y-4">
                {preview.showOrderHistory ? (
                  <div>
                    <p className="text-sm font-semibold">Order History</p>
                    <p className="text-sm text-muted-foreground">12 orders</p>
                  </div>
                ) : null}

                {preview.showWishlistCount ? (
                  <div>
                    <p className="text-sm font-semibold">Wishlist</p>
                    <p className="text-sm text-muted-foreground">5 items</p>
                  </div>
                ) : null}

                {preview.enableProfileEditing ? (
                  <Button variant="outline">Edit Profile</Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentSettingsPage;
