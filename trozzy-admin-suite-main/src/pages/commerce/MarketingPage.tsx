import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2, Megaphone, Calendar, Percent } from 'lucide-react';
import { getProducts, generateId, addAuditLog } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  discount: number;
  startDate: string;
  endDate: string;
  productIds: string[];
  status: 'active' | 'scheduled' | 'ended' | 'draft';
  createdAt: string;
}

const MarketingPage = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products] = useState(getProducts());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discount: 10,
    startDate: '',
    endDate: '',
    productIds: [] as string[],
  });

  useEffect(() => {
    const stored = localStorage.getItem('trozzy_campaigns');
    if (stored) {
      setCampaigns(JSON.parse(stored));
    } else {
      const initial: Campaign[] = [
        { id: '1', name: 'Summer Sale', discount: 20, startDate: '2024-06-01', endDate: '2024-06-30', productIds: ['1', '2'], status: 'ended', createdAt: '2024-05-15' },
        { id: '2', name: 'Black Friday', discount: 50, startDate: '2024-11-29', endDate: '2024-11-30', productIds: ['1', '2', '3'], status: 'ended', createdAt: '2024-11-01' },
        { id: '3', name: 'New Year Special', discount: 15, startDate: '2025-01-01', endDate: '2025-01-15', productIds: ['2', '4'], status: 'scheduled', createdAt: '2024-12-15' },
      ];
      setCampaigns(initial);
      localStorage.setItem('trozzy_campaigns', JSON.stringify(initial));
    }
  }, []);

  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('trozzy_campaigns', JSON.stringify(newCampaigns));
  };

  const getCampaignStatus = (start: string, end: string): Campaign['status'] => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (now < startDate) return 'scheduled';
    if (now > endDate) return 'ended';
    return 'active';
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    if (editingCampaign) {
      const updated = campaigns.map(c => 
        c.id === editingCampaign.id 
          ? { ...c, ...formData, status: getCampaignStatus(formData.startDate, formData.endDate) }
          : c
      );
      saveCampaigns(updated);
      addAuditLog({ user: 'Admin User', action: 'Updated campaign', module: 'Marketing', timestamp: new Date().toISOString(), details: formData.name });
      toast({ title: 'Success', description: 'Campaign updated' });
    } else {
      const newCampaign: Campaign = {
        id: generateId(),
        ...formData,
        status: getCampaignStatus(formData.startDate, formData.endDate),
        createdAt: new Date().toISOString().split('T')[0],
      };
      saveCampaigns([newCampaign, ...campaigns]);
      addAuditLog({ user: 'Admin User', action: 'Created campaign', module: 'Marketing', timestamp: new Date().toISOString(), details: formData.name });
      toast({ title: 'Success', description: 'Campaign created' });
    }

    resetForm();
    setDialogOpen(false);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      discount: campaign.discount,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      productIds: campaign.productIds,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    const updated = campaigns.filter(c => c.id !== id);
    saveCampaigns(updated);
    addAuditLog({ user: 'Admin User', action: 'Deleted campaign', module: 'Marketing', timestamp: new Date().toISOString(), details: campaign?.name || id });
    toast({ title: 'Deleted', description: 'Campaign deleted' });
  };

  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({ name: '', discount: 10, startDate: '', endDate: '', productIds: [] });
  };

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const columns = [
    { key: 'name', header: 'Campaign Name' },
    { 
      key: 'discount', 
      header: 'Discount',
      render: (c: Campaign) => <span className="font-medium text-success">{c.discount}%</span>
    },
    { key: 'startDate', header: 'Start Date' },
    { key: 'endDate', header: 'End Date' },
    { 
      key: 'productIds', 
      header: 'Products',
      render: (c: Campaign) => <span>{c.productIds.length} products</span>
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (c: Campaign) => <StatusBadge status={c.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Campaign) => (
        <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={() => handleEdit(c)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const scheduledCampaigns = campaigns.filter(c => c.status === 'scheduled').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">Create and manage discount campaigns.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Campaign Name *</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Summer Sale" />
              </div>
              <div className="space-y-2">
                <Label>Discount Percentage *</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="1" max="100" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })} />
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assign Products</Label>
                <div className="max-h-40 overflow-auto border rounded-lg p-2 space-y-1">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{formData.productIds.length} selected</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">
                {editingCampaign ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">{scheduledCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={campaigns} columns={columns} emptyMessage="No campaigns yet" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPage;
