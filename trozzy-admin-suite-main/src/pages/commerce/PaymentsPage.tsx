import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, CreditCard, Store, Phone, Download, Eye, EyeOff, Save, Plus, Wallet, Building } from 'lucide-react';
import { initializeMockData, getPaymentSettings, setPaymentSettings, PaymentSettings, generateId } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'upi' | 'bank';
  enabled: boolean;
  details: string;
}

const PaymentsPage = () => {
  const { toast } = useToast();
  const [settings, setSettingsState] = useState<PaymentSettings>({
    upiId: '',
    storeName: '',
    contactPhone: '',
    methods: [],
  });
  const [showUpi, setShowUpi] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({ name: '', type: 'card' as 'card' | 'upi' | 'bank', details: '' });

  const [settlementHistory] = useState([
    { id: '1', date: '2024-12-15', amount: 4529.50, status: 'completed', reference: 'SET-2024-001' },
    { id: '2', date: '2024-12-08', amount: 3875.25, status: 'completed', reference: 'SET-2024-002' },
    { id: '3', date: '2024-12-01', amount: 5120.00, status: 'completed', reference: 'SET-2024-003' },
    { id: '4', date: '2024-11-24', amount: 2980.75, status: 'completed', reference: 'SET-2024-004' },
    { id: '5', date: '2024-11-17', amount: 4250.00, status: 'pending', reference: 'SET-2024-005' },
  ]);

  useEffect(() => {
    initializeMockData();
    const loaded = getPaymentSettings();
    // Initialize with default methods if empty
    if (!loaded.methods || loaded.methods.length === 0) {
      loaded.methods = [
        { id: '1', name: 'Visa/Mastercard', type: 'card', enabled: true, details: '**** 4242' },
        { id: '2', name: 'Google Pay', type: 'upi', enabled: true, details: 'store@upi' },
      ];
      setPaymentSettings(loaded);
    }
    setSettingsState(loaded);
  }, []);

  const handleSave = () => {
    setPaymentSettings(settings);
    toast({ title: 'Success', description: 'Payment settings saved' });
  };

  const handleAddMethod = () => {
    if (!newMethod.name) {
      toast({ title: 'Error', description: 'Please enter method name', variant: 'destructive' });
      return;
    }
    const method: PaymentMethod = {
      id: generateId(),
      ...newMethod,
      enabled: true,
    };
    const updated = { ...settings, methods: [...(settings.methods || []), method] };
    setSettingsState(updated);
    setPaymentSettings(updated);
    setNewMethod({ name: '', type: 'card', details: '' });
    setShowAddMethod(false);
    toast({ title: 'Success', description: 'Payment method added' });
  };

  const toggleMethod = (id: string) => {
    const updated = {
      ...settings,
      methods: settings.methods.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m),
    };
    setSettingsState(updated);
    setPaymentSettings(updated);
  };

  const handleDownloadStatement = () => {
    const headers = ['Reference', 'Date', 'Amount', 'Status'];
    const rows = settlementHistory.map(s => [s.reference, s.date, s.amount.toFixed(2), s.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Statement exported as CSV' });
  };

  const columns = [
    { key: 'reference', header: 'Reference' },
    { key: 'date', header: 'Date' },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: typeof settlementHistory[0]) => `$${item.amount.toFixed(2)}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: typeof settlementHistory[0]) => <StatusBadge status={item.status} />,
    },
  ];

  const maskUpi = (upi: string) => {
    if (!upi) return '***';
    const parts = upi.split('@');
    if (parts.length < 2) return '***';
    return `${parts[0].slice(0, 3)}***@${parts[1]}`;
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <Wallet className="h-4 w-4" />;
      case 'bank': return <Building className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage payment settings and view settlements.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              Secure Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="upi" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                UPI ID (Encrypted)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="upi"
                  type={showUpi ? 'text' : 'password'}
                  value={settings.upiId}
                  onChange={(e) => setSettingsState({ ...settings, upiId: e.target.value })}
                  placeholder="yourstore@upi"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowUpi(!showUpi)}
                >
                  {showUpi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Display: {maskUpi(settings.upiId)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Store Name
              </Label>
              <Input
                id="store"
                value={settings.storeName}
                onChange={(e) => setSettingsState({ ...settings, storeName: e.target.value })}
                placeholder="Your Store Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone
              </Label>
              <Input
                id="phone"
                value={settings.contactPhone}
                onChange={(e) => setSettingsState({ ...settings, contactPhone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payment Methods</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddMethod(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.methods && settings.methods.length > 0 ? (
              settings.methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(method.type)}
                    <div>
                      <p className="font-medium text-sm">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.details || method.type.toUpperCase()}</p>
                    </div>
                  </div>
                  <Switch checked={method.enabled} onCheckedChange={() => toggleMethod(method.id)} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No payment methods configured</p>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold">$20,755.50</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">$4,250.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Settlement History</CardTitle>
          <Button variant="outline" onClick={handleDownloadStatement}>
            <Download className="mr-2 h-4 w-4" />
            Download Statement (CSV)
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable data={settlementHistory} columns={columns} emptyMessage="No settlements yet" />
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Method Name</Label>
              <Input 
                value={newMethod.name} 
                onChange={e => setNewMethod({ ...newMethod, name: e.target.value })} 
                placeholder="e.g., Visa Card, Google Pay" 
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newMethod.type} onValueChange={(v: 'card' | 'upi' | 'bank') => setNewMethod({ ...newMethod, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details (Optional)</Label>
              <Input 
                value={newMethod.details} 
                onChange={e => setNewMethod({ ...newMethod, details: e.target.value })} 
                placeholder="e.g., **** 4242 or store@upi" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMethod(false)}>Cancel</Button>
            <Button onClick={handleAddMethod}>Add Method</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
