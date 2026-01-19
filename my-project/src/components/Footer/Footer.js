import React from "react";
import { FaFacebookF, FaYoutube, FaPinterestP, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-surface-50 dark:bg-surface-900 text-text-700 dark:text-text-300 border-t border-border-200 dark:border-border-700">
      {/* Top Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 text-center py-10 px-6 border-b border-border-200 dark:border-border-700 bg-white dark:bg-surface-800">
        <div className="group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🚚</div>
          <h4 className="font-semibold text-text-900 dark:text-text-100 mt-2">Free Shipping</h4>
          <p className="text-sm text-text-600 dark:text-text-400 mt-1">For all Orders Over $100</p>
        </div>
        <div className="group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">↩️</div>
          <h4 className="font-semibold text-text-900 dark:text-text-100 mt-2">30 Days Returns</h4>
          <p className="text-sm text-text-600 dark:text-text-400 mt-1">For an Exchange Product</p>
        </div>
        <div className="group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">💳</div>
          <h4 className="font-semibold text-text-900 dark:text-text-100 mt-2">Secured Payment</h4>
          <p className="text-sm text-text-600 dark:text-text-400 mt-1">Payment Cards Accepted</p>
        </div>
        <div className="group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🎁</div>
          <h4 className="font-semibold text-text-900 dark:text-text-100 mt-2">Special Gifts</h4>
          <p className="text-sm text-text-600 dark:text-text-400 mt-1">Our First Product Order</p>
        </div>
        <div className="group">
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">🎧</div>
          <h4 className="font-semibold text-text-900 dark:text-text-100 mt-2">Support 24/7</h4>
          <p className="text-sm text-text-600 dark:text-text-400 mt-1">Contact us Anytime</p>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-12 border-b border-border-200 dark:border-border-700">
        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold text-text-900 dark:text-text-100 mb-4">Contact us</h3>
          <p className="text-text-700 dark:text-text-300 mb-1">TROZZI - Mega Super Store</p>
          <p className="text-text-700 dark:text-text-300 mb-1">507-Union Trade Centre France</p>
          <p className="text-text-700 dark:text-text-300 mb-1">sales@yourcompany.com</p>
          <p className="text-primary-600 dark:text-primary-400 font-bold mt-3 text-lg">(+91) 9876-543-210</p>
          <div className="mt-4 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-2 rounded-lg inline-flex items-center gap-2">
            💬 Online Chat <span className="font-medium">Get Expert Help</span>
          </div>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-lg font-bold text-text-900 dark:text-text-100 mb-4">Products</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Prices drop</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">New products</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Best sales</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact us</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sitemap</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Stores</a></li>
          </ul>
        </div>

        {/* Our company */}
        <div>
          <h3 className="text-lg font-bold text-text-900 dark:text-text-100 mb-4">Our company</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Delivery</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Legal Notice</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms and conditions of use</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About us</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Secure payment</a></li>
            <li><a href="#" className="text-text-600 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Login</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-lg font-bold text-text-900 dark:text-text-100 mb-4">Subscribe to newsletter</h3>
          <p className="text-sm text-text-600 dark:text-text-400 mb-4 leading-relaxed">
            Subscribe to our latest newsletter to get news about special discounts.
          </p>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Your Email Address"
              className="w-full border border-border-300 dark:border-border-600 bg-white dark:bg-surface-800 text-text-900 dark:text-text-100 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <button className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 shadow-sm hover:shadow-md">
              SUBSCRIBE
            </button>
            <div className="flex items-start text-xs">
              <input type="checkbox" className="mt-0.5 mr-2 rounded border-border-300 dark:border-border-600 bg-white dark:bg-surface-800 text-primary-600 focus:ring-primary-500" />
              <span className="text-text-600 dark:text-text-400">I agree to the terms and conditions and privacy policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-8 bg-white dark:bg-surface-800">
        {/* Social Icons */}
        <div className="flex space-x-4 text-lg">
          <a href="#" className="text-text-500 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 hover:scale-110 transform">
            <FaFacebookF />
          </a>
          <a href="#" className="text-text-500 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 hover:scale-110 transform">
            <FaYoutube />
          </a>
          <a href="#" className="text-text-500 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 hover:scale-110 transform">
            <FaPinterestP />
          </a>
          <a href="#" className="text-text-500 dark:text-text-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 hover:scale-110 transform">
            <FaInstagram />
          </a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-text-600 dark:text-text-400 my-3 md:my-0">© 2024 - Ecommerce Template. All rights reserved.</p>

        {/* Payment Icons */}
        <div className="flex space-x-3 items-center">
          <img src="https://img.icons8.com/color/48/visa.png" alt="visa" className="h-8 hover:scale-110 transition-transform duration-200" />
          <img src="https://img.icons8.com/color/48/mastercard.png" alt="mastercard" className="h-8 hover:scale-110 transition-transform duration-200" />
          <img src="https://img.icons8.com/color/48/amex.png" alt="amex" className="h-8 hover:scale-110 transition-transform duration-200" />
          <img src="https://img.icons8.com/color/48/paypal.png" alt="paypal" className="h-8 hover:scale-110 transition-transform duration-200" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
