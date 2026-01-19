import React, { useState } from "react";
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
import CartDrawer from '../CartPanel/CartDrawer';

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    right: -3,
    top: 13,
    border: `2px solid ${(theme.vars ?? theme).palette.background.paper}`,
    padding: "0 4px",
  },
}));

const Header = () => {
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { settings } = useContentSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const wishlistBadgeCount = settings?.showWishlistCount ? wishlistCount : 0;

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-surface-900 border-b border-border-200 dark:border-border-700 sticky top-0 z-40 shadow-sm dark:shadow-none">
      {/* TOP STRIP - Hidden on mobile */}
      <div className="top-strip py-2 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-surface-800 dark:to-surface-800 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="col1">
              <p className="text-xs font-semibold text-text-800 dark:text-text-200">
                🎉 Get up to 50% off on selected items | Shop Now!
              </p>
            </div>

            <div className="col2 flex items-center justify-end">
              <ul className="flex items-center gap-4">
                <li className="list-none">
                  <Link
                    to="/help"
                    className="text-xs font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li className="list-none">
                  <Link
                    to="/tracking"
                    className="text-xs font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    Order Tracking
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="header py-3 md:py-4 bg-white dark:bg-surface-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-2xl text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl"
            >
              {isMobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Logo */}
            <div className="col1 flex-shrink-0">
              <Link to="/">
                <span
                  className="block font-serif font-semibold tracking-[0.22em] text-2xl md:text-5xl leading-none"
                  style={{ color: "#5A0B5A" }}
                >
                  TROZZI
                </span>
              </Link>
            </div>

            {/* Search - Hidden on mobile, shown on desktop */}
            <div className="col2 hidden md:block flex-1 max-w-2xl mx-4">
              <GlobalSearch />
            </div>

            {/* Icons - Right Side */}
            <div className="col3 flex items-center gap-1 md:gap-2">
              {/* Desktop User Menu */}
              <div className="hidden md:block">
                <UserMenu />
              </div>

              {/* Cart Icon */}
              <Tooltip title="Cart" arrow>
                <IconButton
                  aria-label="cart"
                  onClick={toggleCart}
                  className="hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors rounded-xl"
                >
                  <StyledBadge badgeContent={itemCount} color="secondary">
                    <FiShoppingCart className="text-xl md:text-2xl text-text-700 dark:text-text-300" />
                  </StyledBadge>
                </IconButton>
              </Tooltip>

              {/* Wishlist Icon */}
              <Tooltip title="Wishlist" arrow>
                <Link to="/wishlist">
                  <IconButton
                    aria-label="wishlist"
                    className="hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors rounded-xl"
                  >
                    <StyledBadge badgeContent={wishlistBadgeCount} color="secondary">
                      <FiHeart className="text-xl md:text-2xl text-text-700 dark:text-text-300" />
                    </StyledBadge>
                  </IconButton>
                </Link>
              </Tooltip>

              {/* Compare Icon - Hidden on mobile */}
              <Tooltip title="Compare" arrow>
                <IconButton
                  aria-label="compare"
                  className="hidden md:inline-flex hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors rounded-xl"
                >
                  <StyledBadge badgeContent={0} color="secondary">
                    <GoGitCompare className="text-xl md:text-2xl text-text-700 dark:text-text-300" />
                  </StyledBadge>
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* Mobile Search - Below header */}
          <div className="md:hidden mt-3">
            <GlobalSearch />
          </div>
        </div>
      </div>

      {/* Navigation - Desktop */}
      <div className="hidden md:block bg-white dark:bg-surface-900 border-t border-border-100 dark:border-border-800">
        <Navigation />
      </div>

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          onClick={toggleMobileMenu}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-surface-900 shadow-2xl dark:shadow-none border-r border-border-200 dark:border-border-700 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
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
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
};

export default Header