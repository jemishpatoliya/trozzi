import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";

import { ArrowLeft, Edit2, FolderTree, Plus, Trash2, Upload, X } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import {
  useCategoriesQuery,
  useSubCategoriesByParentQuery,
} from "@/features/products/queries";
import { uploadImageQueued } from "@/lib/uploadQueue";
import {
  createSubCategory,
  deleteSubCategory,
  updateSubCategory,
} from "@/features/products/api";

export default function SubCategoriesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { categoryId } = useParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    shortDescription: "",
    description: "",
    parentId: null as string | null,
    order: 0,
    active: true,
    imageUrl: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const categoriesQuery = useCategoriesQuery();
  const subCategoriesQuery = useSubCategoriesByParentQuery(categoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const parentCategory = useMemo(() => {
    const id = categoryId ? String(categoryId) : "";
    return (categoriesQuery.data ?? []).find((c) => String(c.id) === id) ?? null;
  }, [categoriesQuery.data, categoryId]);

  const subCategories = subCategoriesQuery.data ?? [];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size should be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImageQueued(file, { maxRetries: 3 });
      setFormData({ ...formData, imageUrl: url });
      setImagePreview(url);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.message ?? "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    setImagePreview("");
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      shortDescription: "",
      description: "",
      parentId: null,
      order: 0,
      active: true,
      imageUrl: "",
    });
    setImagePreview("");
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!categoryId) {
      toast({ title: "Error", description: "Missing parent category", variant: "destructive" });
      return;
    }

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      shortDescription: formData.shortDescription.trim(),
      description: formData.description.trim(),
      parentId: String(categoryId),
      order: formData.order,
      active: formData.active,
      imageUrl: formData.imageUrl,
    };

    setIsSubmitting(true);
    const run = async () => {
      try {
        if (editingId) {
          await updateSubCategory({ id: editingId, ...payload });
          toast({ title: "Success", description: "Sub category updated" });
        } else {
          await createSubCategory(payload);
          toast({ title: "Success", description: "Sub category created" });
        }

        resetForm();
        setIsModalOpen(false);
        await subCategoriesQuery.refetch();
      } catch (e: any) {
        toast({ title: "Error", description: e?.message ?? "Request failed", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };

    void run();
  };

  const handleDelete = (id: string) => {
    if (isDeletingId) return;

    setIsDeletingId(id);
    const run = async () => {
      try {
        await deleteSubCategory(id);
        toast({ title: "Deleted", description: "Sub category removed" });
        await subCategoriesQuery.refetch();
      } catch (e: any) {
        toast({ title: "Error", description: e?.message ?? "Failed to delete sub category", variant: "destructive" });
      } finally {
        setIsDeletingId(null);
      }
    };

    void run();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {parentCategory?.name ?? "Category"} → Sub Categories
            </h1>
            <p className="text-muted-foreground">Manage sub categories for this category only.</p>
          </div>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground" disabled={!categoryId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Sub Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Sub Category" : "Add Sub Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Parent Category</Label>
                <Input value={parentCategory?.name ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Short Description</Label>
                <Input
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2">
                <Label>Sub Category Image</Label>
                <div className="space-y-3">
                  {formData.imageUrl || imagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Sub category preview"
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
                  {isUploading && <div className="text-sm text-blue-600">Uploading...</div>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData({ ...formData, active: checked })} />
                <Label>Active</Label>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full gradient-primary text-primary-foreground"
                disabled={isSubmitting || isUploading || !categoryId}
              >
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subCategoriesQuery.isLoading ? (
          <Card className="glass">
            <CardContent className="pt-6 text-sm text-muted-foreground">Loading...</CardContent>
          </Card>
        ) : (
          subCategories
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <Card key={cat.id} className="glass">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {cat.imageUrl && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderTree className="h-5 w-5 text-primary" />
                      <span className="truncate">{cat.name}</span>
                    </CardTitle>
                  </div>
                  <StatusBadge status={cat.active ? "active" : "inactive"} />
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
                            shortDescription: cat.shortDescription ?? "",
                            description: cat.description,
                            parentId: String(categoryId ?? ""),
                            order: cat.order,
                            active: cat.active,
                            imageUrl: cat.imageUrl ?? "",
                          });
                          setImagePreview(cat.imageUrl ?? "");
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(cat.id)}
                        disabled={isDeletingId === cat.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
}
