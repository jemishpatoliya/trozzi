import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-slate-200">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
                <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-3">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-xl font-semibold tracking-tight text-white">Trozzy</h3>
                        <p className="mt-3 text-sm leading-6 text-slate-400 max-w-md">
                            Your one-stop shop for amazing products. Quality, style, and affordability all in one place.
                        </p>
                        <div className="mt-5 flex items-center gap-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                            >
                                <FaFacebook className="h-5 w-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                            >
                                <FaTwitter className="h-5 w-5" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                            >
                                <FaInstagram className="h-5 w-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
                            >
                                <FaLinkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">Quick Links</h4>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li><Link to="/" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Home</Link></li>
                            <li><Link to="/ProductListing" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Products</Link></li>
                            <li><Link to="/cart" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Cart</Link></li>
                            <li><Link to="/checkout" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Checkout</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-white/90">Customer Service</h4>
                        <ul className="mt-4 space-y-3 text-sm">
                            <li><Link to="/contact" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Contact Us</Link></li>
                            <li><Link to="/about" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">About Us</Link></li>
                            <li><Link to="/policies" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Policies</Link></li>
                            <li><Link to="/shipping-policy" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Shipping Policy</Link></li>
                            <li><Link to="/privacy-policy" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Terms of Service</Link></li>
                            <li><Link to="/refund-policy" className="text-slate-400 transition hover:text-white focus:outline-none focus:underline">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-center text-xs text-slate-500">
                        {new Date().getFullYear()} Trozzy. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
