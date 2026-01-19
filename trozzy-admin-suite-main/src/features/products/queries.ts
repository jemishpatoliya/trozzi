import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  bulkUpdateCatalogProductStatus,
  createCategory,
  deleteCategory,
  deleteProduct,
  getProductManagement,
  listCategoriesByParent,
  listCatalogProducts,
  listCatalogProductsFull,
  listCategories,
  listSubCategoriesByParent,
  publishProduct,
  saveProductDraft,
  updateCategory,
  updateProduct,
} from "./api";
import type { ProductManagementFormValues } from "./types";
import type { Product } from "@/lib/mockData";

const keys = {
  catalogProducts: ["products", "catalog-list"] as const,
  catalogProductsFull: ["products", "catalog-full"] as const,
  categories: ["products", "categories"] as const,
  categoriesByParent: (parentId: string) => [...keys.categories, "parent", parentId] as const,
  subCategoriesByParent: (parentId: string) => ["products", "subcategories", "parent", parentId] as const,
  product: (id: string) => ["products", "management", id] as const,
};

export function useCatalogProductsQuery() {
  return useQuery({
    queryKey: keys.catalogProducts,
    queryFn: listCatalogProducts,
    staleTime: 60_000,
  });
}

export function useCatalogProductsFullQuery() {
  return useQuery({
    queryKey: keys.catalogProductsFull,
    queryFn: listCatalogProductsFull,
    staleTime: 10_000,
  });
}

export function useCategoriesQuery() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: listCategories,
    staleTime: 60_000,
  });
}

export function useCategoriesByParentQuery(parentId: string | undefined) {
  return useQuery({
    queryKey: parentId ? keys.categoriesByParent(parentId) : [...keys.categories, "parent", "none"],
    queryFn: () => {
      if (!parentId) throw new Error("Missing parentId");
      return listCategoriesByParent(parentId);
    },
    enabled: !!parentId,
    staleTime: 60_000,
  });
}

export function useSubCategoriesByParentQuery(parentId: string | undefined) {
  return useQuery({
    queryKey: parentId ? keys.subCategoriesByParent(parentId) : ["products", "subcategories", "parent", "none"],
    queryFn: () => {
      if (!parentId) throw new Error("Missing parentId");
      return listSubCategoriesByParent(parentId);
    },
    enabled: !!parentId,
    staleTime: 60_000,
  });
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      shortDescription: string;
      description: string;
      parentId: string | null;
      order: number;
      active: boolean;
      imageUrl?: string;
    }) => createCategory(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      name: string;
      shortDescription: string;
      description: string;
      parentId: string | null;
      order: number;
      active: boolean;
      imageUrl?: string;
    }) => updateCategory(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.categories });
    },
  });
}

export function useProductManagementQuery(id: string | undefined) {
  return useQuery({
    queryKey: id ? keys.product(id) : ["products", "management", "new"],
    queryFn: () => {
      if (!id) throw new Error("Missing id");
      return getProductManagement(id);
    },
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useSaveDraftMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; values: ProductManagementFormValues }) => saveProductDraft(input),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: keys.catalogProducts });
      await qc.invalidateQueries({ queryKey: keys.catalogProductsFull });
      await qc.refetchQueries({ queryKey: keys.catalogProductsFull });
      await qc.invalidateQueries({ queryKey: keys.product(res.id) });
    },
  });
}

export function usePublishMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; values: ProductManagementFormValues }) => publishProduct(input),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: keys.catalogProducts });
      await qc.invalidateQueries({ queryKey: keys.catalogProductsFull });
      await qc.refetchQueries({ queryKey: keys.catalogProductsFull });
      await qc.invalidateQueries({ queryKey: keys.product(res.id) });
    },
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: ProductManagementFormValues }) => updateProduct(input),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: keys.catalogProducts });
      await qc.invalidateQueries({ queryKey: keys.catalogProductsFull });
      await qc.refetchQueries({ queryKey: keys.catalogProductsFull });
      await qc.invalidateQueries({ queryKey: keys.product(res.id) });
    },
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.catalogProducts });
      await qc.invalidateQueries({ queryKey: keys.catalogProductsFull });
    },
  });
}

export function useBulkUpdateProductStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ids: string[]; status: Product["status"] }) => bulkUpdateCatalogProductStatus(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.catalogProducts });
      await qc.invalidateQueries({ queryKey: keys.catalogProductsFull });
    },
  });
}

export const productQueryKeys = keys;
