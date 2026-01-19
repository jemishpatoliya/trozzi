import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Save, Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import { getProducts, setProducts, Product, generateId, addAuditLog, getCategories, setCategories as saveCategories, Category } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import ColorVariantManager from '@/features/products/components/ColorVariantManager';
import AIDescriptionImprover from '@/components/AIDescriptionImprover';

interface ProductMarketing {
  buyersToday: boolean;
  stockWarning: boolean;
  countdown: boolean;
  buy2get1: boolean;
  flatDiscount: boolean;
  couponCode: boolean;
}

const defaultMarketing: ProductMarketing = {
  buyersToday: false,
  stockWarning: false,
  countdown: false,
  buy2get1: false,
  flatDiscount: false,
  couponCode: false,
};

const defaultProduct: Omit<Product, 'id' | 'createdAt'> & { marketing: ProductMarketing; colorVariants: any[] } = {
  name: '',
  sku: '',
  price: 0,
  stock: 0,
  status: 'draft',
  image: '',
  galleryImages: [],
  category: '',
  description: '',
  featured: false,
  sizes: [],
  colors: [],
  colorVariants: [],
  variants: [],
  tags: [],
  keyFeatures: [],
  warranty: '',
  warrantyDetails: '',
  saleEnabled: false,
  saleDiscount: 0,
  saleStartDate: '',
  saleEndDate: '',
  metaTitle: '',
  metaDescription: '',
  weight: 0,
  dimensions: { length: 0, width: 0, height: 0 },
  badge: 'none',
  brand: '',
  marketing: defaultMarketing,
};

const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;
  const [currentTab, setCurrentTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [formData, setFormData] = useState<any>(defaultProduct);
  const [categories, setCategoriesState] = useState(getCategories());
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const mainImageRef = useRef<HTMLInputElement>(null);
  const galleryImageRef = useRef<HTMLInputElement>(null);

  const tabOrder = ['basic', 'images', 'inventory', 'colorVariants', 'attributes', 'seo', 'shipping', 'marketing', 'details', 'sale'];
  const currentTabIndex = tabOrder.indexOf(currentTab);
  const isLastTab = currentTabIndex === tabOrder.length - 1;
  const isFirstTab = currentTabIndex === 0;

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleNextTab = () => {
    const nextIndex = currentTabIndex + 1;
    if (nextIndex < tabOrder.length) {
      setCurrentTab(tabOrder[nextIndex]);
    }
  };

  const handlePreviousTab = () => {
    const prevIndex = currentTabIndex - 1;
    if (prevIndex >= 0) {
      setCurrentTab(tabOrder[prevIndex]);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    navigate('/commerce/products');
  };

  const handleSave = () => {
    if (!formData.name || !formData.sku || formData.price <= 0) {
      toast({ title: 'Error', description: 'Please fill in name, SKU, and price', variant: 'destructive' });
      return;
    }

    const products = getProducts();
    
    if (isEditing) {
      const updated = products.map(p => 
        p.id === id ? { ...p, ...formData } : p
      );
      setProducts(updated);
      addAuditLog({ user: 'Admin User', action: 'Updated product', module: 'Products', timestamp: new Date().toISOString(), details: `Updated: ${formData.name}` });
      toast({ title: 'Success', description: 'Product updated successfully' });
    } else {
      const newProduct: Product = {
        ...formData,
        id: generateId(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts([newProduct, ...products]);
      addAuditLog({ user: 'Admin User', action: 'Created product', module: 'Products', timestamp: new Date().toISOString(), details: `Created: ${formData.name}` });
      toast({ title: 'Success', description: 'Product created successfully' });
    }

    setHasUnsavedChanges(false);
    navigate('/commerce/products');
  };

  useEffect(() => {
    if (isEditing) {
      const products = getProducts();
      const product = products.find(p => p.id === id);
      if (product) {
        setFormData({
          name: product.name,
          sku: product.sku,
          price: product.price,
          stock: product.stock,
          status: product.status,
          image: product.image,
          galleryImages: product.galleryImages || [],
          category: product.category,
          description: product.description,
          featured: product.featured,
          sizes: product.sizes || [],
          colors: product.colors || [],
          variants: product.variants || [],
          colorVariants: (product as any).colorVariants || [],
          tags: product.tags || [],
          keyFeatures: product.keyFeatures || [],
          warranty: product.warranty || '',
          warrantyDetails: product.warrantyDetails || '',
          saleEnabled: product.saleEnabled || false,
          saleDiscount: product.saleDiscount || 0,
          saleStartDate: product.saleStartDate || '',
          saleEndDate: product.saleEndDate || '',
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          weight: product.weight || 0,
          dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
          badge: product.badge || '',
          brand: product.brand || '',
          marketing: (product as any).marketing || defaultMarketing,
        });
      }
    }
  }, [id, isEditing]);

  const addItem = (field: string, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      setter(value);
      setFormData(prev => ({
        ...prev,
        [field]: [...(prev[field] || []), value]
      }));
    }
  };

  const removeItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFormData(prev => ({ 
            ...prev, 
            galleryImages: [...prev.galleryImages, event.target?.result as string].slice(0, 10) 
          }));
        };
        reader.readAsDataURL(file);
      });
    }
    if (galleryImageRef.current) galleryImageRef.current.value = '';
  };

  const generateVariants = () => {
    if (formData.sizes.length === 0 || formData.colors.length === 0) {
      toast({ title: 'Info', description: 'Add sizes and colors first to generate variants' });
      return;
    }
    const variants = formData.sizes.flatMap(size => 
      formData.colors.map(color => ({
        size,
        color,
        sku: `${formData.sku}-${size}-${color}`,
        price: formData.price,
        stock: Math.floor(formData.stock / (formData.sizes.length * formData.colors.length))
      }))
    );
    setFormData(prev => ({ ...prev, variants }));
    toast({ title: 'Generated', description: `Created ${variants.length} variants` });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: generateId(),
      name: newCategoryName.trim(),
      description: '',
      productCount: 0,
      active: true,
      parentId: null,
      order: categories.length + 1
    };
    setCategoriesState([...categories, newCat]);
    setFormData(prev => ({ ...prev, category: newCat.name }));
    setNewCategoryName('');
    setShowAddCategory(false);
    toast({ title: 'Success', description: 'Category created' });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate('/commerce/products')} variant="outline" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-muted-foreground">Fill in the product details below</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          {isLastTab ? (
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditing ? 'Update Product' : 'Save Product'}
            </Button>
          ) : (
            <Button onClick={handleNextTab} className="flex items-center gap-2">
              Next
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="glass grid grid-cols-5 lg:grid-cols-9 w-full">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="colorVariants">Color Variants</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Enter product name" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.active && c.name && c.name.trim() !== '').map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowAddCategory(true)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Product description" rows={4} />
              </div>
              
              {/* AI Description Improver */}
              <div className="mt-4">
                <AIDescriptionImprover
                  originalDescription={formData.description}
                  productName={formData.name}
                  category={formData.category}
                  onImprovedDescription={(improved) => setFormData({ ...formData, description: improved })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Brand name" />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="SKU" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Main Product Image</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="main-image-upload" className="cursor-pointer">
                        <span className="text-sm text-gray-600">Click to upload main image</span>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                        <input
                          id="main-image-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleMainImageUpload}
                          ref={mainImageRef}
                        />
                      </label>
                    </div>
                  </div>
                  {formData.image && (
                    <div className="mt-4">
                      <img src={formData.image} alt="Main product" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Gallery Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="gallery-upload" className="cursor-pointer">
                        <span className="text-sm text-gray-600">Click to upload gallery images</span>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB (max 10 images)</p>
                        <input
                          id="gallery-upload"
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleGalleryImageUpload}
                          ref={galleryImageRef}
                        />
                      </label>
                    </div>
                  </div>
                  {formData.galleryImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {formData.galleryImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeItem('galleryImages', index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Inventory Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v as any })}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.stock > 0 && formData.stock <= 10 && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-warning font-medium">Low Stock Warning</p>
                  <p className="text-sm text-muted-foreground">This product has low stock ({formData.stock} remaining)</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colorVariants" className="mt-6">
          <ColorVariantManager
            colorVariants={formData.colorVariants || []}
            onChange={(variants) => setFormData({ ...formData, colorVariants: variants })}
            basePrice={formData.price}
            baseSku={formData.sku}
          />
        </TabsContent>

        <TabsContent value="attributes" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Product Attributes</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="sizes" className="w-full">
                <TabsList className="grid grid-cols-4 w-full mb-6">
                  <TabsTrigger value="sizes">Sizes</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>

                <TabsContent value="sizes" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Sizes</Label>
                    <p className="text-sm text-muted-foreground">Add available sizes for this product (e.g., S, M, L, XL)</p>
                    <div className="flex gap-2 mt-2">
                      <Input value={newSize} onChange={e => setNewSize(e.target.value)} placeholder="Enter size (e.g., S, M, L)" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('sizes', newSize, setNewSize))} />
                      <Button variant="outline" onClick={() => addItem('sizes', newSize, setNewSize)}><Plus className="h-4 w-4 mr-2" />Add</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes.map((size, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeItem('sizes', index)}>
                        {size} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add Colors</Label>
                    <p className="text-sm text-muted-foreground">Add available colors for this product (e.g., Red, Blue, Black)</p>
                    <div className="flex gap-2 mt-2">
                      <Input value={newColor} onChange={e => setNewColor(e.target.value)} placeholder="Enter color (e.g., Red)" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem('colors', newColor, setNewColor))} />
                      <Button variant="outline" onClick={() => addItem('colors', newColor, setNewColor)}><Plus className="h-4 w-4 mr-2" />Add</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.colors.map((color, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeItem('colors', index)}>
                        {color} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Add sizes and/or colors to create variants automatically. Variants will be generated from all size × color combinations.
                    </p>
                    <Button onClick={generateVariants} disabled={formData.sizes.length === 0 || formData.colors.length === 0}>
                      Generate Variants
                    </Button>
                  </div>
                  {formData.variants.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Generated Variants ({formData.variants.length})</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {formData.variants.map((variant, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{variant.size} - {variant.color}</span>
                            <span className="text-xs text-muted-foreground">{variant.sku}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="other" className="space-y-4">
                  <div className="p-6 rounded-lg bg-muted/50 border border-border text-center">
                    <p className="text-muted-foreground">Additional attributes coming soon</p>
                    <p className="text-sm text-muted-foreground mt-1">Custom attributes like material, style, etc. will be available here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} placeholder="SEO optimized title" />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} placeholder="SEO description (max 160 chars)" rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Shipping Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" step="0.01" value={formData.weight} onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" value={formData.dimensions.length} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 } })} placeholder="Length" />
                    <Input type="number" value={formData.dimensions.width} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 } })} placeholder="Width" />
                    <Input type="number" value={formData.dimensions.height} onChange={e => setFormData({ ...formData, dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 } })} placeholder="Height" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Warranty</Label>
                <Input value={formData.warranty} onChange={e => setFormData({ ...formData, warranty: e.target.value })} placeholder="Warranty period" />
              </div>
              <div className="space-y-2">
                <Label>Warranty Details</Label>
                <Textarea value={formData.warrantyDetails} onChange={e => setFormData({ ...formData, warrantyDetails: e.target.value })} placeholder="Warranty terms and conditions" rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="mt-6">
          <div className="space-y-6">
            <Card className="glass">
              <CardHeader><CardTitle>Promotional Badge</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="badge">Badge</Label>
                  <Switch id="badge" checked={formData.badge !== 'none'} onCheckedChange={(checked) => setFormData({ ...formData, badge: checked ? 'sale' : 'none' })} />
                </div>
                {formData.badge !== 'none' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">Product will display a "{formData.badge}" badge</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader><CardTitle>Sale Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="saleEnabled">Enable Sale</Label>
                  <Switch id="saleEnabled" checked={formData.saleEnabled} onCheckedChange={(checked) => setFormData({ ...formData, saleEnabled: checked })} />
                </div>
                {formData.saleEnabled && (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input type="number" value={formData.saleDiscount} onChange={e => setFormData({ ...formData, saleDiscount: parseFloat(e.target.value) || 0 })} placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Sale Period</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input type="date" value={formData.saleStartDate} onChange={e => setFormData({ ...formData, saleStartDate: e.target.value })} />
                          <Input type="date" value={formData.saleEndDate} onChange={e => setFormData({ ...formData, saleEndDate: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Key Features</Label>
                <div className="space-y-2">
                  {formData.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={feature} onChange={(e) => {
                        const newFeatures = [...formData.keyFeatures];
                        newFeatures[index] = e.target.value;
                        setFormData({ ...formData, keyFeatures: newFeatures });
                      }} placeholder={`Feature ${index + 1}`} />
                      <Button variant="outline" size="sm" onClick={() => removeItem('keyFeatures', index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => addItem('keyFeatures', newFeature, setNewFeature)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sale" className="mt-6">
          <Card className="glass">
            <CardHeader><CardTitle>Sale Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Configure sale settings for this product. Discount prices will be calculated automatically based on the original price.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Category Name</Label>
            <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Enter category name" className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductFormPage;
