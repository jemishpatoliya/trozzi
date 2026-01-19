import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./components/layout/AdminLayout";
import { CartProvider } from "./features/storefront/cart";
import SignInPage from "./pages/auth/SignInPage";
import Dashboard from "./pages/Dashboard";
import AnalyticsOverview from "./pages/analytics/AnalyticsOverview";
import AdvancedAnalytics from "./pages/analytics/AdvancedAnalytics";
import RealTimeAnalytics from "./pages/analytics/RealTimeAnalytics";
import BusinessIntelligence from "./pages/analytics/BusinessIntelligence";
import ReportBuilder from "./pages/analytics/ReportBuilder";

import ProductsPage from "./pages/commerce/ProductsPage";
import ProductManagementPage from "./pages/commerce/ProductManagementPage";
import ProductPreviewPage from "./pages/commerce/ProductPreviewPage";
import OrdersPage from "./pages/commerce/OrdersPage";
import InventoryPage from "./pages/commerce/InventoryPage";
import PaymentsPage from "./pages/commerce/PaymentsPage";
import PaymentsManagementPage from "./pages/commerce/PaymentsManagementPage";
import UsersManagementPage from "./pages/users/UsersManagementPage";
import ContentPage from "./pages/content/ContentPage";
import CategoriesPage from "./pages/content/CategoriesPage";
import SubCategoriesPage from "./pages/content/SubCategoriesPage";
import BannersPage from "./pages/content/BannersPage";
import SizeGuidesPage from "./pages/content/SizeGuidesPage";
import MediaLibraryPage from "./pages/content/MediaLibraryPage";
import NotificationsPage from "./pages/content/NotificationsPage";
import AuditLogsPage from "./pages/content/AuditLogsPage";
import DataManagementPage from "./pages/system/DataManagementPage";
import AIAutomationPage from "./pages/system/AIAutomationPage";
import PluginsPage from "./pages/system/PluginsPage";
import SettingsPage from "./pages/system/SettingsPage";
import ReviewsPage from './pages/reviews';
import ReviewsAnalyticsPage from './pages/reviews/ReviewsAnalyticsPage';
import NotFound from "./pages/NotFound";
import ShopLayout from "./pages/shop/ShopLayout";
import ShopHomePage from "./pages/shop/ShopHomePage";
import ShopProductsPage from "./pages/shop/ShopProductsPage";
import ShopProductDetailsPage from "./pages/shop/ShopProductDetailsPage";
import ShopCartPage from "./pages/shop/ShopCartPage";
import ShopCheckoutPage from "./pages/shop/ShopCheckoutPage";
import ShopOrderSuccessPage from "./pages/shop/ShopOrderSuccessPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/products/:id/preview" element={<ProductPreviewPage />} />

            <Route path="/shop" element={<ShopLayout />}>
              <Route index element={<ShopHomePage />} />
              <Route path="products" element={<ShopProductsPage />} />
              <Route path="products/:slug" element={<ShopProductDetailsPage />} />
              <Route path="cart" element={<ShopCartPage />} />
              <Route path="checkout" element={<ShopCheckoutPage />} />
              <Route path="order/:id" element={<ShopOrderSuccessPage />} />
            </Route>

            <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
            <Route path="/analytics" element={<Navigate to="/analytics/overview" replace />} />
            <Route path="/analytics/overview" element={<AnalyticsOverview />} />
            <Route path="/analytics/advanced" element={<AdvancedAnalytics />} />
            <Route path="/analytics/realtime" element={<RealTimeAnalytics />} />
            <Route path="/analytics/bi" element={<BusinessIntelligence />} />
            <Route path="/analytics/reports" element={<ReportBuilder />} />
            <Route path="/commerce/products" element={<ProductsPage />} />
            <Route path="/commerce/products/new" element={<ProductManagementPage />} />
            <Route path="/commerce/products/:id" element={<ProductManagementPage />} />
            <Route path="/commerce/categories" element={<CategoriesPage />} />
            <Route path="/commerce/banners" element={<BannersPage />} />
            <Route path="/commerce/orders" element={<OrdersPage />} />
            <Route path="/commerce/inventory" element={<InventoryPage />} />
            <Route path="/commerce/payments" element={<PaymentsManagementPage />} />
            
            <Route path="/users" element={<UsersManagementPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/categories/:categoryId/subcategories" element={<SubCategoriesPage />} />
            <Route path="/size-guides" element={<SizeGuidesPage />} />
            <Route path="/media" element={<MediaLibraryPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/data-management" element={<DataManagementPage />} />
            <Route path="/ai-automation" element={<AIAutomationPage />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/reviews/pending" element={<ReviewsPage defaultFilter="pending" />} />
            <Route path="/reviews/approved" element={<ReviewsPage defaultFilter="approved" />} />
            <Route path="/reviews/rejected" element={<ReviewsPage defaultFilter="rejected" />} />
            <Route path="/reviews/analytics" element={<ReviewsAnalyticsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
