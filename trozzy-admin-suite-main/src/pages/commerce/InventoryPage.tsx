import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, Package, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_BASE_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5050/api';
const api = axios.create({ baseURL: String(API_BASE_URL).replace(/\/$/, '') });

type InventoryProduct = {
  id: string;
  name: string;
  sku: string;
  category?: string;
  stock: number;
  image?: string;
};

const InventoryPage = () => {
  const { toast } = useToast();
  const [products, setProductsState] = useState<InventoryProduct[]>([]);
  const [draftStockById, setDraftStockById] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setProductsState([]);
          return;
        }

        const res = await api.get('/products?mode=admin', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const arr = Array.isArray(res.data) ? res.data : [];
        setProductsState(
          arr.map((p: any) => ({
            id: String(p._id ?? p.id),
            name: String(p.name ?? ''),
            sku: String(p.sku ?? ''),
            category: String(p.category ?? ''),
            stock: Number(p.stock ?? 0),
            image: String(p.image ?? ''),
          })),
        );
      } catch (e: any) {
        setProductsState([]);
        toast({
          title: 'Error',
          description: e?.response?.data?.message || e?.message || 'Failed to load inventory',
          variant: 'destructive',
        });
      }
    };
    load();
  }, []);

  const productsById = useMemo(() => {
    const map: Record<string, InventoryProduct> = {};
    for (const p of products) map[p.id] = p;
    return map;
  }, [products]);

  const effectiveProducts = useMemo(() => {
    return products.map((p) => ({ ...p, stock: draftStockById[p.id] ?? p.stock }));
  }, [products, draftStockById]);

  const dirtyIds = useMemo(() => {
    return Object.entries(draftStockById)
      .filter(([id, stock]) => productsById[id] && stock !== productsById[id].stock)
      .map(([id]) => id);
  }, [draftStockById, productsById]);

  const setDraftStock = (productId: string, nextStock: number) => {
    setDraftStockById((prev) => {
      const original = productsById[productId]?.stock;
      const next = { ...prev };

      if (typeof original === 'number' && nextStock === original) {
        delete next[productId];
        return next;
      }

      next[productId] = nextStock;
      return next;
    });
  };

  const filteredProducts = effectiveProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockProducts = effectiveProducts.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStockProducts = effectiveProducts.filter((p) => p.stock === 0);
  const totalStock = effectiveProducts.reduce((sum, p) => sum + p.stock, 0);

  const handleStockUpdate = (productId: string, change: number) => {
    const p = productsById[productId];
    if (!p) return;
    const current = draftStockById[productId] ?? p.stock;
    const next = Math.max(0, Number(current ?? 0) + change);
    setDraftStock(productId, next);
  };

  const handleBulkUpdate = () => {
    const amount = parseInt(bulkAmount);
    if (isNaN(amount) || selectedIds.length === 0) {
      toast({ title: 'Error', description: 'Please select products and enter an amount', variant: 'destructive' });
      return;
    }

    for (const id of selectedIds) {
      const p = productsById[id];
      if (!p) continue;
      const current = draftStockById[id] ?? p.stock;
      const next = Math.max(0, Number(current ?? 0) + amount);
      setDraftStock(id, next);
    }
  };

  const saveChanges = async () => {
    if (dirtyIds.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast({ title: 'Error', description: 'Please sign in to save changes', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      for (const id of dirtyIds) {
        const nextStock = draftStockById[id];
        if (typeof nextStock !== 'number') continue;

        await api.put(
          `/admin/products/${id}`,
          { stock: nextStock },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      setProductsState((prev) =>
        prev.map((p) => {
          const nextStock = draftStockById[p.id];
          if (typeof nextStock !== 'number') return p;
          if (!dirtyIds.includes(p.id)) return p;
          return { ...p, stock: nextStock };
        }),
      );

      setDraftStockById((prev) => {
        const next = { ...prev };
        for (const id of dirtyIds) delete next[id];
        return next;
      });

      toast({ title: 'Saved', description: 'Inventory changes saved successfully' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to save inventory changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'image',
      header: 'Image',
      render: (product: InventoryProduct) => (
        product.image ? (
          <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted" />
        )
      ),
    },
    { key: 'name', header: 'Product' },
    { key: 'sku', header: 'SKU' },
    { key: 'category', header: 'Category' },
    {
      key: 'stock',
      header: 'Stock',
      render: (product: InventoryProduct) => (
        <div className="flex items-center gap-2">
          <span className={
            product.stock === 0 ? 'text-destructive font-medium' :
            product.stock <= 5 ? 'text-warning font-medium' :
            'text-foreground'
          }>
            {product.stock}
          </span>
          {typeof productsById[product.id]?.stock === 'number' && product.stock !== productsById[product.id].stock && (
            <Badge variant="secondary" className="text-xs">Unsaved</Badge>
          )}
          {product.stock === 0 && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
          {product.stock > 0 && product.stock <= 5 && <Badge className="bg-warning text-warning-foreground text-xs">Low</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Quick Update',
      render: (product: InventoryProduct) => (
        <div className="flex items-center gap-1">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8" 
            onClick={() => handleStockUpdate(product.id, -1)}
            disabled={product.stock === 0}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleStockUpdate(product.id, 1)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStockUpdate(product.id, 10)}>+10</Button>
          <Button size="sm" variant="outline" onClick={() => handleStockUpdate(product.id, 50)}>+50</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Track and manage your stock levels.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock</p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="glass border-warning/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map((product) => (
                <Badge key={product.id} variant="outline" className="border-warning text-warning">
                  {product.name} ({product.stock} left)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            <Input type="number" placeholder="Amount" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} className="w-24" />
            <Button onClick={handleBulkUpdate} variant="outline">Bulk Update</Button>
          </div>
        )}
      </div>

      <DataTable
        data={filteredProducts}
        columns={columns}
        selectable
        onSelectionChange={setSelectedIds}
        emptyMessage="No products found"
      />

      <div className="sticky bottom-0 left-0 right-0 pt-6">
        <div className="rounded-xl border bg-background/95 backdrop-blur p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Pending changes</p>
            <p className="text-sm text-muted-foreground">{dirtyIds.length} product(s) modified</p>
          </div>
          <Button onClick={saveChanges} disabled={dirtyIds.length === 0 || isSaving} className="gradient-primary text-primary-foreground">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
