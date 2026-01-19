export type PublicProduct = {
  id: string;
  slug: string;
  visibility: "public" | "private";
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: "active" | "inactive" | "draft";
  image: string;
  galleryImages: string[];
  category: string;
  description: string;
  featured: boolean;
  createdAt: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  badge: string;
  brand: string;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type OrderCreateInput = {
  currency: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export type OrderCreateResponse = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export type OrderDetails = {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAtIso: string;
};
