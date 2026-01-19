import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Puzzle, CreditCard, Mail, BarChart3, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const PluginsPage = () => {
  const [plugins, setPlugins] = useState([
    { id: 'stripe', name: 'Stripe Payments', description: 'Accept credit card payments', enabled: true, icon: CreditCard },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing integration', enabled: false, icon: Mail },
    { id: 'analytics', name: 'Google Analytics', description: 'Website analytics tracking', enabled: true, icon: BarChart3 },
    { id: 'zendesk', name: 'Zendesk', description: 'Customer support integration', enabled: false, icon: MessageSquare },
  ]);

  const togglePlugin = (id: string) => setPlugins(plugins.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold tracking-tight">Plugins</h1><p className="text-muted-foreground">Manage third-party integrations.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {plugins.map((plugin) => (
          <Card key={plugin.id} className="glass">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><plugin.icon className="h-6 w-6 text-accent" /></div>
                <div><div className="flex items-center gap-2"><p className="font-semibold">{plugin.name}</p><StatusBadge status={plugin.enabled ? 'active' : 'inactive'} /></div><p className="text-sm text-muted-foreground">{plugin.description}</p></div>
              </div>
              <Switch checked={plugin.enabled} onCheckedChange={() => togglePlugin(plugin.id)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PluginsPage;
