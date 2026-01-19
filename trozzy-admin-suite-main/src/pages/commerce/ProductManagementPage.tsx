import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";

import { ProductFormTabs } from "@/features/products/components/product-form/ProductFormTabs";
import { productManagementDefaults, productManagementSchema } from "@/features/products/schema";
import {
  useCategoriesQuery,
  useCatalogProductsQuery,
  useDeleteProductMutation,
  useProductManagementQuery,
  usePublishMutation,
  useSaveDraftMutation,
  useUpdateProductMutation,
} from "@/features/products/queries";
import type { ProductManagementFormValues } from "@/features/products/types";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Loader2,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const isEditing = !!id;

  const categoriesQuery = useCategoriesQuery();
  const catalogProductsQuery = useCatalogProductsQuery();
  const productQuery = useProductManagementQuery(id);

  const saveDraftMutation = useSaveDraftMutation();
  const publishMutation = usePublishMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();

  const form = useForm<ProductManagementFormValues>({
    resolver: zodResolver(productManagementSchema),
    defaultValues: productManagementDefaults,
    mode: "onBlur",
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // Define tab names for validation
  const tabs = [
    "basic",
    "pricing",
    "inventory",
    "media",
    "variants",
    "seo",
    "shipping",
    "marketing",
    "sale",
  ];

  // Initialize form with data
  useEffect(() => {
    if (!isEditing) {
      form.reset(productManagementDefaults);
      return;
    }

    if (productQuery.data) {
      form.reset({
        ...productManagementDefaults,
        ...productQuery.data,
        shipping: {
          ...productManagementDefaults.shipping,
          ...(productQuery.data as any).shipping,
        },
      });
    }
  }, [form, isEditing, productQuery.data]);

  const categoryOptions = useMemo(() => {
    return (categoriesQuery.data ?? [])
      .filter((c) => c.parentId === null)
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        value: c.id,
        label: c.name,
        description: c.name,
        indent: 0,
      }));
  }, [categoriesQuery.data]);

  const productOptions = useMemo(() => {
    return (catalogProductsQuery.data ?? []).map((p) => ({
      value: p.id,
      label: p.name,
      description: p.sku,
      indent: 0,
    }));
  }, [catalogProductsQuery.data]);

  const isBusy =
    saveDraftMutation.isPending ||
    publishMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const validateCurrentTab = async () => {
    const tabName = tabs[currentTab];
    const fields = Object.keys(form.getValues()).filter((key) => key.startsWith(tabName));
    
    if (fields.length === 0) return true;

    const result = await form.trigger(fields as any);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentTab();
    
    if (!isValid) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the errors in the current section before proceeding.", 
        variant: "destructive" 
      });
      return;
    }

    if (currentTab < tabs.length - 1) {
      setCurrentTab(currentTab + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  const handleCancel = () => {
    const isDirty = form.formState.isDirty;
    
    if (isDirty) {
      setCancelOpen(true);
    } else {
      navigate("/commerce/products");
    }
  };

  const confirmCancel = () => {
    setCancelOpen(false);
    navigate("/commerce/products");
  };

  const submit = async (intent: "draft" | "publish" | "update") => {
    const ok = await form.trigger();
    if (!ok) {
      toast({ title: "Fix validation errors", description: "Please review highlighted fields.", variant: "destructive" });
      return;
    }

    const values = form.getValues();

    const categoryId = values.basic?.categoryIds?.[0];
    if (!categoryId) {
      toast({ title: "Category required", description: "Please select a category before saving.", variant: "destructive" });
      return;
    }
    if (!values.basic?.subCategoryId) {
      toast({ title: "Sub Category required", description: "Please select a sub category before saving.", variant: "destructive" });
      return;
    }

    try {
      if (intent === "draft") {
        const res = await saveDraftMutation.mutateAsync({ id, values });
        toast({ title: "Draft saved", description: "Your changes were saved as draft." });
        if (!id) navigate(`/commerce/products/${res.id}`, { replace: true });
        return;
      }

      if (intent === "publish") {
        const res = await publishMutation.mutateAsync({ id, values });
        toast({ title: "Published", description: "Product is now live (mock)." });
        if (!id) navigate(`/commerce/products/${res.id}`, { replace: true });
        return;
      }

      if (!id) {
        const res = await publishMutation.mutateAsync({ id, values });
        toast({ title: "Published", description: "Product created & published (mock)." });
        navigate(`/commerce/products/${res.id}`, { replace: true });
        return;
      }

      await updateMutation.mutateAsync({ id, values });
      toast({ title: "Updated", description: "Product updated successfully." });
    } catch (e: any) {
      toast({ title: "Request failed", description: e?.message ?? "Please try again", variant: "destructive" });
    }
  };

  const doDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted", description: "Product deleted successfully." });
      navigate("/commerce/products");
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Please try again", variant: "destructive" });
    }
  };

  const preview = () => {
    if (!id) {
      toast({ title: "Save first", description: "Please save draft or publish before preview." });
      return;
    }
    window.open(`/products/${id}/preview`, "_blank", "noopener,noreferrer");
  };

  const reset = () => {
    if (isEditing && productQuery.data) {
      form.reset(productQuery.data);
      toast({ title: "Reset", description: "Reverted to last saved version." });
      return;
    }
    form.reset(productManagementDefaults);
    toast({ title: "Reset", description: "Cleared all fields." });
  };

  if (isEditing && productQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-52" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[520px] lg:col-span-2" />
          <Skeleton className="h-[520px]" />
        </div>
      </div>
    );
  }

  if (productQuery.error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/commerce/products")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Product not found</h1>
            <p className="text-muted-foreground">The product you tried to edit does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/commerce/products")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {isEditing ? "Product Management" : "Create Product"}
                </h1>
                <StatusBadge status={form.watch("basic.status")} />
                <Badge variant="outline">{form.watch("basic.visibility")}</Badge>
              </div>
              <p className="text-muted-foreground">
                Advanced product editor with pricing, inventory, media, variants, SEO, shipping, marketing, and sale configuration.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={preview} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" onClick={reset} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button variant="outline" onClick={() => void submit("draft")} disabled={isBusy} className="gap-2">
              {saveDraftMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </Button>
            <Button
              className="gradient-primary text-primary-foreground gap-2"
              onClick={() => void submit(isEditing ? "update" : "publish")}
              disabled={isBusy}
            >
              {publishMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? "Update Product" : "Publish Product"}
            </Button>
            {isEditing ? (
              <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={isBusy} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <ProductFormTabs
          categoriesLoading={categoriesQuery.isLoading}
          categoryOptions={categoryOptions}
          productsLoading={catalogProductsQuery.isLoading}
          productOptions={productOptions}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
        />

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t pt-6">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentTab === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentTab === tabs.length - 1}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to leave? All changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the product from the mock catalog and remove its saved management details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void doDelete()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FormProvider>
  );
}
