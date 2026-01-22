// import React, { createContext } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import { CartProvider } from './context/CartContext';
// import { WishlistProvider } from './context/WishlistContext';

// // Import pages
// import Home from './Pages/Home';
// import ProductListing from './Pages/ProductListing';
// import Productsdetailsh from './Pages/Productsdetailsh';
// import CartPage from './Pages/CartPage';
// import CheckoutPage from './Pages/CheckoutPage';
// import WishlistPage from './Pages/WishlistPage';
// import LoginPage from './Pages/auth/LoginPage';
// import RegisterPage from './Pages/auth/RegisterPage';
// import PrivacyPolicy from './Pages/PrivacyPolicy';
// import TermsOfService from './Pages/TermsOfService';
// import RefundPolicy from './Pages/RefundPolicy';
// import ContactUs from './Pages/ContactUs';
// import AboutUs from './Pages/AboutUs';

// // Import components
// import Header from './components/Header';
// import Footer from './components/Footer';
// import Homecatslider from './components/Homecatslider';

// // Create MyContext for backward compatibility
// export const MyContext = createContext();

// // Protected Route Component
// const ProtectedRoute = ({ children }) => {
//     const token = localStorage.getItem('token');
//     return token ? children : <Navigate to="/login" replace />;
// };

// const PublicRoute = ({ children }) => {
//     const token = localStorage.getItem('token');
//     return !token ? children : <Navigate to="/" replace />;
// };

// function App() {
//     // Basic MyContext functionality for backward compatibility
//     const [isCartPanelOpen, setIsCartPanelOpen] = React.useState(false);

//     const toggleCartPanel = (open) => {
//         setIsCartPanelOpen(open);
//     };

//     const handleClickOpenProductDetailsModal = (product) => {
//         console.log('Product details modal:', product);
//         // TODO: Implement product details modal
//     };

//     const myContextValue = {
//         isCartPanelOpen,
//         toggleCartPanel,
//         handleClickOpenProductDetailsModal,
//     };

//     return (
//         <AuthProvider>
//             <CartProvider>
//                 <WishlistProvider>
//                     <MyContext.Provider value={myContextValue}>
//                         <Router>
//                             <div className="App flex ">
//                                 <div className="">
//                                     <Homecatslider />
//                                 </div>
//                                 <div className="flex-1 overflow-hidden h-screen overflow-y-auto">
//                                     <Header />
//                                     <main>
//                                         <Routes>
//                                             {/* Public Routes */}
//                                             <Route path="/" element={<Home />} />
//                                             <Route path="/ProductListing" element={<ProductListing />} />
//                                             <Route path="/ProductListing/:category" element={<ProductListing />} />
//                                             <Route path="/product/:id" element={<Productsdetailsh />} />
//                                             <Route path="/privacy-policy" element={<PrivacyPolicy />} />
//                                             <Route path="/terms-of-service" element={<TermsOfService />} />
//                                             <Route path="/refund-policy" element={<RefundPolicy />} />
//                                             <Route path="/contact" element={<ContactUs />} />
//                                             <Route path="/about" element={<AboutUs />} />

//                                             {/* Auth Routes */}
//                                             <Route
//                                                 path="/login"
//                                                 element={
//                                                     <PublicRoute>
//                                                         <LoginPage />
//                                                     </PublicRoute>
//                                                 }
//                                             />
//                                             <Route
//                                                 path="/register"
//                                                 element={
//                                                     <PublicRoute>
//                                                         <RegisterPage />
//                                                     </PublicRoute>
//                                                 }
//                                             />

//                                             {/* Protected Routes */}
//                                             <Route
//                                                 path="/cart"
//                                                 element={
//                                                     <ProtectedRoute>
//                                                         <CartPage />
//                                                     </ProtectedRoute>
//                                                 }
//                                             />
//                                             <Route
//                                                 path="/wishlist"
//                                                 element={
//                                                     <ProtectedRoute>
//                                                         <WishlistPage />
//                                                     </ProtectedRoute>
//                                                 }
//                                             />
//                                             <Route
//                                                 path="/checkout"
//                                                 element={
//                                                     <ProtectedRoute>
//                                                         <CheckoutPage />
//                                                     </ProtectedRoute>
//                                                 }
//                                             />

//                                             {/* Fallback */}
//                                             <Route path="*" element={<Navigate to="/" replace />} />
//                                         </Routes>
//                                     </main>
//                                     <Footer />
//                                 </div>
//                             </div>
//                         </Router>
//                     </MyContext.Provider>
//                 </WishlistProvider>
//             </CartProvider>
//         </AuthProvider>
//     );
// }

// App.js - Fixed Layout with Homecatslider on all pages
import React, { createContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { ContentSettingsProvider } from './context/ContentSettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { useWishlist } from './context/WishlistContext';
import { FiHome, FiGrid, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';

// Import components that are needed immediately
import Header from './components/Header';
import Footer from './components/Footer';

// Lazy load pages for better performance
const Home = lazy(() => import('./Pages/Home'));
const ProductListing = lazy(() => import('./Pages/ProductListing'));
const Productsdetailsh = lazy(() => import('./Pages/Productsdetailsh'));
const CartPage = lazy(() => import('./Pages/CartPage'));
const CheckoutPage = lazy(() => import('./Pages/CheckoutPage'));
const WishlistPage = lazy(() => import('./Pages/WishlistPage'));
const LoginPage = lazy(() => import('./Pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./Pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./Pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./Pages/auth/ResetPasswordPage'));
const PrivacyPolicy = lazy(() => import('./Pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./Pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./Pages/RefundPolicy'));
const ContactUs = lazy(() => import('./Pages/ContactUs'));
const AboutUs = lazy(() => import('./Pages/AboutUs'));
const HelpCenter = lazy(() => import('./Pages/HelpCenter'));
const OrderTracking = lazy(() => import('./Pages/OrderTracking'));
const PaymentGateway = lazy(() => import('./components/PaymentGateway'));
const Profile = lazy(() => import('./Pages/Profile'));
const Orders = lazy(() => import('./Pages/Orders'));

// Create MyContext for backward compatibility
export const MyContext = createContext();

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading) return null;
    const redirectTo = `${location.pathname}${location.search || ''}`;
    return isAuthenticated
        ? children
        : <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return !isAuthenticated ? children : <Navigate to="/" replace />;
};

const MobileBottomNav = () => {
    const location = useLocation();
    const { itemCount } = useCart();
    const { itemCount: wishlistCount } = useWishlist();
    const { isAuthenticated } = useAuth();

    const pathname = String(location?.pathname || '');
    const hideOn = (
        pathname.startsWith('/product/') ||
        pathname === '/checkout' ||
        pathname === '/payment' ||
        pathname === '/cart' ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname === '/forgot-password' ||
        pathname === '/reset-password'
    );

    if (hideOn) return null;

    const linkBase = 'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[11px] font-medium';

    const linkActive = 'text-[#5A0B5A]';
    const linkInactive = 'text-gray-600';

    const Badge = ({ value }) => {
        const v = Number(value || 0);
        if (!v) return null;
        return (
            <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] leading-[18px] text-center">
                {v > 99 ? '99+' : v}
            </span>
        );
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
            <div className="grid grid-cols-5">
                <NavLink
                    to="/"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <FiHome className="text-lg" />
                    <span>Home</span>
                </NavLink>

                <NavLink
                    to="/ProductListing"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <FiGrid className="text-lg" />
                    <span>Shop</span>
                </NavLink>

                <NavLink
                    to="/cart"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <span className="relative">
                        <FiShoppingCart className="text-lg" />
                        <Badge value={itemCount} />
                    </span>
                    <span>Cart</span>
                </NavLink>

                <NavLink
                    to="/wishlist"
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <span className="relative">
                        <FiHeart className="text-lg" />
                        <Badge value={wishlistCount} />
                    </span>
                    <span>Wishlist</span>
                </NavLink>

                <NavLink
                    to={isAuthenticated ? '/profile' : '/login'}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
                >
                    <FiUser className="text-lg" />
                    <span>Account</span>
                </NavLink>
            </div>
        </nav>
    );
};

function App() {
    // Basic MyContext functionality for backward compatibility
    const [isCartPanelOpen, setIsCartPanelOpen] = React.useState(false);

    const toggleCartPanel = (open) => {
        setIsCartPanelOpen(open);
    };

    const handleClickOpenProductDetailsModal = (product) => {
        console.log('Product details modal:', product);
        // TODO: Implement product details modal
    };

    const myContextValue = {
        isCartPanelOpen,
        toggleCartPanel,
        handleClickOpenProductDetailsModal,
    };

    return (
        <AuthProvider>
            <ContentSettingsProvider>
                <CartProvider>
                    <WishlistProvider>
                        <CompareProvider>
                            <NotificationProvider>
                                <MyContext.Provider value={myContextValue}>
                                    <Router
                                        future={{
                                            v7_startTransition: true,
                                            v7_relativeSplatPath: true,
                                        }}
                                    >
                                        <div className="App flex h-screen overflow-hidden">
                                        {/* Right Content Area */}
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            {/* Header - Sticky */}
                                            <Header />

                                            {/* Main Content - Scrollable */}
                                            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 pb-16 md:pb-0">
                                                <Suspense fallback={
                                                    <div className="flex items-center justify-center h-64">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                                    </div>
                                                }>
                                                    <Routes>
                                                {/* Public Routes */}
                                                <Route path="/" element={<Home />} />
                                                <Route path="/ProductListing" element={<ProductListing />} />
                                                <Route path="/ProductListing/:category" element={<ProductListing />} />
                                                <Route path="/product/:id" element={<Productsdetailsh />} />
                                                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                                                <Route path="/terms-of-service" element={<TermsOfService />} />
                                                <Route path="/refund-policy" element={<RefundPolicy />} />
                                                <Route path="/contact" element={<ContactUs />} />
                                                <Route path="/about" element={<AboutUs />} />
                                                <Route path="/help-center" element={<HelpCenter />} />

                                                {/* Auth Routes */}
                                                <Route
                                                    path="/login"
                                                    element={
                                                        <PublicRoute>
                                                            <LoginPage />
                                                        </PublicRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/register"
                                                    element={
                                                        <PublicRoute>
                                                            <RegisterPage />
                                                        </PublicRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/forgot-password"
                                                    element={
                                                        <PublicRoute>
                                                            <ForgotPasswordPage />
                                                        </PublicRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/reset-password"
                                                    element={
                                                        <PublicRoute>
                                                            <ResetPasswordPage />
                                                        </PublicRoute>
                                                    }
                                                />

                                                {/* Protected Routes */}
                                                <Route
                                                    path="/cart"
                                                    element={
                                                        <ProtectedRoute>
                                                            <CartPage />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/wishlist"
                                                    element={
                                                        <ProtectedRoute>
                                                            <WishlistPage />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/profile"
                                                    element={
                                                        <ProtectedRoute>
                                                            <Profile />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/orders"
                                                    element={
                                                        <ProtectedRoute>
                                                            <Orders />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/checkout"
                                                    element={
                                                        <ProtectedRoute>
                                                            <CheckoutPage />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/payment"
                                                    element={
                                                        <ProtectedRoute>
                                                            <PaymentGateway />
                                                        </ProtectedRoute>
                                                    }
                                                />
                                                <Route
                                                    path="/order-tracking"
                                                    element={
                                                        <ProtectedRoute>
                                                            <OrderTracking />
                                                        </ProtectedRoute>
                                                    }
                                                />

                                                {/* Fallback */}
                                                <Route path="*" element={<Navigate to="/" replace />} />
                                            </Routes>
                                            </Suspense>
                                            {/* Footer */}
                                            <Footer />
                                            </main>

                                            <MobileBottomNav />

                                        </div>
                                    </div>
                                </Router>
                            </MyContext.Provider>
                        </NotificationProvider>
                    </CompareProvider>
                </WishlistProvider>
            </CartProvider>
        </ContentSettingsProvider>
    </AuthProvider>
    );
}

export default App;