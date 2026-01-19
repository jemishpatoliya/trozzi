import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Edit2, Trash2, FolderTree, Upload, X, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCategoriesQuery, useCreateCategoryMutation, useDeleteCategoryMutation, useUpdateCategoryMutation } from '@/features/products/queries';
import { uploadImageQueued } from '@/lib/uploadQueue';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const CategoriesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', shortDescription: '', description: '', parentId: null as string | null, order: 0, active: true, imageUrl: '' });
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categoriesQuery = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const categories = categoriesQuery.data ?? [];

  const visibleCategoryCards = useMemo(() => {
    return categories
      .filter((c) => c.parentId === null)
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((cat) => ({ cat }));
  }, [categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image size should be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImageQueued(file, { maxRetries: 3 });
      setFormData({ ...formData, imageUrl: url });
      setImagePreview(url);
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as any)?.message ?? 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      // Allow re-selecting the same file without double-trigger issues.
      e.target.value = '';
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: '' });
    setImagePreview('');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      parentId: null,
      order: formData.order,
      active: formData.active,
      imageUrl: formData.imageUrl,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Success', description: 'Category updated' });
            resetForm();
            setIsModalOpen(false);
          },
          onError: (e: any) => {
            toast({ title: 'Error', description: e?.message ?? 'Failed to update category', variant: 'destructive' });
          },
        },
      );
      return;
    }

    createMutation.mutate(payload,
      {
        onSuccess: () => {
          toast({ title: 'Success', description: 'Category created' });
          resetForm();
          setIsModalOpen(false);
        },
        onError: (e: any) => {
          toast({ title: 'Error', description: e?.message ?? 'Failed to create category', variant: 'destructive' });
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast({ title: 'Deleted', description: 'Category removed' }),
      onError: (e: any) => toast({ title: 'Error', description: e?.message ?? 'Failed to delete category', variant: 'destructive' }),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', shortDescription: '', description: '', parentId: null, order: 0, active: true, imageUrl: '' });
    setImagePreview('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Product Categories</h1><p className="text-muted-foreground">Organize your product catalog.</p></div>
        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild><Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Add Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Short Description</Label><Input value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              
              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Category Image</Label>
                <div className="space-y-3">
                  {(formData.imageUrl || imagePreview) ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={imagePreview || formData.imageUrl} 
                        alt="Category preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            <Input
                              id="image-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                  {isUploading && (
                    <div className="text-sm text-blue-600">Uploading...</div>
                  )}
                </div>
              </div>
              <div className="space-y-2"><Label>Order</Label><Input type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2"><Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} /><Label>Active</Label></div>
              <Button
                onClick={handleSubmit}
                className="w-full gradient-primary text-primary-foreground"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
              >
                {editingId ? 'Update' : 'Add'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoriesQuery.isLoading ? (
          <Card className="glass"><CardContent className="pt-6 text-sm text-muted-foreground">Loading...</CardContent></Card>
        ) : (
          visibleCategoryCards.map(({ cat }) => (
          <Card key={cat.id} className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                {cat.imageUrl && (
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-primary" />
                  <span className="truncate">{cat.name}</span>
                </CardTitle>
              </div>
              <StatusBadge status={cat.active ? 'active' : 'inactive'} />
            </CardHeader>
            <CardContent>
              {cat.shortDescription ? <p className="text-sm mb-1">{cat.shortDescription}</p> : null}
              <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Order: {cat.order} • {cat.productCount} products</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(cat.id);
                      setFormData({
                        name: cat.name,
                        shortDescription: cat.shortDescription ?? '',
                        description: cat.description,
                        parentId: null,
                        order: cat.order,
                        active: cat.active,
                        imageUrl: cat.imageUrl ?? '',
                      });
                      setImagePreview(cat.imageUrl ?? '');
                      setIsModalOpen(true);
                    }}
                  ><Edit2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => navigate(`/categories/${cat.id}/subcategories`)}>
                        Sub Categories
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))) }
      </div>
    </div>
  );
};

export default CategoriesPage;
