import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bot, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const AIAutomationPage = () => {
  const [features, setFeatures] = useState([
    { id: 'suggestions', title: 'Smart Product Suggestions', description: 'AI-powered product recommendations', enabled: true, icon: Sparkles },
    { id: 'pricing', title: 'Dynamic Pricing', description: 'Automatic price optimization', enabled: false, icon: TrendingUp },
    { id: 'chatbot', title: 'Customer Chatbot', description: 'AI assistant for customer queries', enabled: true, icon: MessageSquare },
    { id: 'inventory', title: 'Inventory Forecasting', description: 'Predict stock requirements', enabled: false, icon: Bot },
  ]);

  const toggleFeature = (id: string) => setFeatures(features.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f));

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="text-3xl font-bold tracking-tight">AI & Automation</h1><p className="text-muted-foreground">Configure AI-powered features.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.id} className="glass">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><feature.icon className="h-6 w-6 text-primary" /></div>
                <div><p className="font-semibold">{feature.title}</p><p className="text-sm text-muted-foreground">{feature.description}</p></div>
              </div>
              <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AIAutomationPage;
