import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import GlobalSearch from "./GlobalSearch";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import { FiShoppingCart, FiHeart, FiMenu, FiX } from "react-icons/fi";
import { GoGitCompare } from "react-icons/go";
import Tooltip from "@mui/material/Tooltip";
import UserMenu from "./UserMenu";
import Navigation from "./Navigation";
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useContentSettings } from '../../context/ContentSettingsContext';
import { fetchCategories } from '../../api/catalog';

import CartDrawer from '../CartPanel/CartDrawer';
import NotificationBell from './NotificationBell';

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    top: 13,
    border: `2px solid ${(theme.vars ?? theme).palette.background.paper}`,
    padding: "0 4px",
  },
  [theme.breakpoints.down('sm')]: {
    "& .MuiBadge-badge": {
      right: -2,
      top: 10,
      padding: "0 3px",
      fontSize: 10,
      minWidth: 16,
      height: 16,
      lineHeight: '16px',
    },
  },
}));

const Header = forwardRef(({ hidden = false, elevated = false }, ref) => {
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { settings } = useContentSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategories, setMobileCategories] = useState([]);

  const headerClassName = useMemo(() => {
    const base = "bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-[1000] transition-transform transition-opacity duration-300 ease-out";
    const visibility = hidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100";
    const shadow = !hidden && elevated ? "shadow-md" : "shadow-none";
    return `${base} ${visibility} ${shadow}`;
  }, [hidden, elevated]);

  const wishlistBadgeCount = settings?.showWishlistCount ? wishlistCount : 0;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchCategories();

        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setMobileCategories(list.filter((c) => c && c.name));
      } catch (_e) {
        if (!cancelled) setMobileCategories([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  const topMobileCategories = useMemo(() => {
    return (Array.isArray(mobileCategories) ? mobileCategories : []).filter((c) => !c.parentId);
  }, [mobileCategories]);

  const routeForCategory = (value) => `/ProductListing?category=${encodeURIComponent(String(value))}`;

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const mobileMenuNode =
    isMobileMenuOpen && typeof document !== 'undefined' && document?.body
      ? createPortal(
        <div
          className="md:hidden fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm"
          onClick={toggleMobileMenu}
        >
          <div
            className="fixed inset-0 w-full bg-white shadow-2xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-10">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-200 dark:border-border-700">
                <div>
                  <h2 className="text-xl font-bold text-text-900 dark:text-text-100">Menu</h2>
                  <p className="text-sm text-text-500 dark:text-text-400">Browse our store</p>
                </div>

                <button
                  onClick={toggleMobileMenu}
                  className="text-2xl text-text-600 dark:text-text-400 hover:text-text-900 dark:hover:text-text-100 p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                >
                  <FiX />
                </button>
              </div>

              {/* User Menu Mobile */}
              <div className="mb-6 pb-6 border-b border-border-200 dark:border-border-700">
                <UserMenu />
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-2">
                <Link
                  to="/"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  🏠 Home
                </Link>
                <Link
                  to="/ProductListing"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  🛍️ Shop
                </Link>
                <Link
                  to="/wishlist"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  ❤️ Wishlist
                </Link>
                <Link
                  to="/orders"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  🔔 Notifications
                </Link>
                <Link
                  to="/about"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  ℹ️ About Us
                </Link>
                <Link
                  to="/contact"
                  onClick={toggleMobileMenu}
                  className="flex items-center text-base font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-surface-800 px-4 py-3 rounded-xl transition-colors"
                >
                  📞 Contact
                </Link>
              </nav>

              {/* Mobile Bottom Links */}
              <div className="mt-6 pt-6 border-t border-border-200 dark:border-border-700 space-y-3">
                <Link
                  to="/help-center"
                  onClick={toggleMobileMenu}
                  className="block text-sm text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
                >
                  Help Center
                </Link>
                <Link
                  to="/order-tracking"
                  onClick={toggleMobileMenu}
                  className="block text-sm text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg transition-colors"
                >
                  Order Tracking
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <header ref={ref} className={headerClassName}>
      {/* MAIN HEADER */}
      <div className="header bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="py-2 md:py-0">
            <div className="h-10 md:h-16 flex items-center gap-2 md:gap-4 relative">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden w-9 h-9 flex items-center justify-center text-[22px] text-gray-800 active:scale-[0.98] transition-transform"
                type="button"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>

              {/* Brand */}
              <Link
                to="/"
                className="flex items-center flex-shrink-0 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0"
                aria-label="Home"
              >
                <span className="font-extrabold tracking-[0.18em] text-[18px] md:text-[22px] text-gray-900">
                  TROZZI
                </span>
              </Link>

              {/* Desktop Search */}
              <div className="hidden md:block flex-1 max-w-2xl mx-4">
                <GlobalSearch />
              </div>

              {/* Actions */}
              <div className="ml-auto flex items-center gap-1 md:gap-2">
                <div className="hidden md:block">
                  <UserMenu />
                </div>

                <div className="hidden md:block">
                  <NotificationBell />
                </div>

                <Tooltip title="Cart" arrow>
                  <IconButton
                    aria-label="cart"
                    onClick={toggleCart}
                    className="!w-9 !h-9 sm:!w-11 sm:!h-11 hover:bg-orange-50 transition-colors rounded-xl"
                  >
                    <StyledBadge badgeContent={itemCount} color="secondary">
                      <FiShoppingCart className="text-lg sm:text-xl md:text-2xl text-gray-700" />
                    </StyledBadge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Wishlist" arrow>
                  <Link to="/wishlist" className="hidden md:inline-flex">
                    <IconButton
                      aria-label="wishlist"
                      className="!w-9 !h-9 sm:!w-11 sm:!h-11 hover:bg-orange-50 transition-colors rounded-xl"
                    >
                      <StyledBadge badgeContent={wishlistBadgeCount} color="secondary">
                        <FiHeart className="text-lg sm:text-xl md:text-2xl text-gray-700" />
                      </StyledBadge>
                    </IconButton>
                  </Link>
                </Tooltip>

                <Tooltip title="Compare" arrow>
                  <IconButton
                    aria-label="compare"
                    className="hidden lg:inline-flex hover:bg-orange-50 transition-colors rounded-xl"
                  >
                    <StyledBadge badgeContent={0} color="secondary">
                      <GoGitCompare className="text-xl md:text-2xl text-gray-700" />
                    </StyledBadge>
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden mt-2">
              <GlobalSearch />
            </div>

            {/* Mobile Categories */}
            {topMobileCategories.length > 0 && (
              <div className="md:hidden mt-2 -mx-3 px-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-[13px] font-semibold"
                  >
                    Home
                  </Link>
                  {topMobileCategories.slice(0, 12).map((cat) => (
                    <Link
                      key={String(cat?.id || cat?._id || cat?.name)}
                      to={routeForCategory(cat?.id || cat?.name)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-[13px] font-semibold"
                    >
                      {cat?.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Offer Strip */}
            <div className="md:hidden mt-2">
              <div className="w-full rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 overflow-x-auto scrollbar-hide whitespace-nowrap text-[12px] text-gray-800">
                <span className="font-semibold">Offer:</span> Free Delivery | Extra discounts on selected items
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Desktop */}
      <div className="hidden md:block bg-white dark:bg-surface-900 border-t border-border-100 dark:border-border-800">
        <Navigation />
      </div>

      {mobileMenuNode}

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
});

export default Header