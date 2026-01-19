
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { BasicDetailsTab } from "./BasicDetailsTab";
import { PricingTab } from "./PricingTab";
import { InventoryTab } from "./InventoryTab";
import { MediaTab } from "./MediaTab";
import { AttributesTab } from "./AttributesTab";
import { SEOTab } from "./SEOTab";
import { ShippingTab } from "./ShippingTab";
import { MarketingTab } from "./MarketingTab";
import { DetailsTab } from "./DetailsTab";
import { SaleTab } from "./SaleTab";

interface ProductFormTabsProps {
  categoriesLoading: boolean;
  categoryOptions: any[];
  productsLoading: boolean;
  productOptions: any[];

  currentTab?: number;
  onTabChange?: (next: number) => void;
}

const SECTION_TABS = [
  { id: "basic", label: "Basic" },
  { id: "pricing", label: "Pricing" },
  { id: "inventory", label: "Inventory" },
  { id: "media", label: "Media" },
  { id: "attributes", label: "Attributes" },
  { id: "seo", label: "SEO" },
  { id: "shipping", label: "Shipping" },
  { id: "marketing", label: "Marketing" },
  { id: "details", label: "Details" },
  { id: "sale", label: "Sale Page" },
];

export function ProductFormTabs({
  categoriesLoading,
  categoryOptions,
  productsLoading,
  productOptions,
  currentTab,
  onTabChange,
}: ProductFormTabsProps) {
  const activeTab = typeof currentTab === "number" ? SECTION_TABS[currentTab]?.id ?? "basic" : "basic";

  return (
    <Tabs
      defaultValue="basic"
      className="w-full"
      value={typeof currentTab === "number" ? activeTab : undefined}
      onValueChange={(val) => {
        if (!onTabChange) return;
        const idx = SECTION_TABS.findIndex((t) => t.id === val);
        if (idx >= 0) onTabChange(idx);
      }}
    >
      <TabsList className="glass grid grid-cols-5 lg:grid-cols-10 w-full mb-6">
        {SECTION_TABS.map((t) => (
          <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="basic">
        <BasicDetailsTab
          categoriesLoading={categoriesLoading}
          categoryOptions={categoryOptions}
        />
      </TabsContent>

      <TabsContent value="pricing">
        <PricingTab />
      </TabsContent>

      <TabsContent value="inventory">
        <InventoryTab />
      </TabsContent>

      <TabsContent value="media">
        <MediaTab />
      </TabsContent>

      <TabsContent value="attributes">
        <AttributesTab />
      </TabsContent>

      <TabsContent value="seo">
        <SEOTab />
      </TabsContent>

      <TabsContent value="shipping">
        <ShippingTab />
      </TabsContent>

      <TabsContent value="marketing">
        <MarketingTab
          productsLoading={productsLoading}
          productOptions={productOptions}
        />
      </TabsContent>

      <TabsContent value="details">
        <DetailsTab />
      </TabsContent>

      <TabsContent value="sale">
        <SaleTab />
      </TabsContent>
    </Tabs>
  );
}
