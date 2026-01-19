// Navigation.js
import React from 'react';
import Button from '@mui/material/Button';
import { IoRocketSharp } from "react-icons/io5";
import { Link } from 'react-router-dom';
import './style.css';

const Navigation = () => {
  const menuItems = [
    'Home',
    'Fashion',
    'Footwear',
    'Grossary',
    'Beauty',
    'Jewellery'
  ];

  const routeForMenuItem = (item) => {
    const label = String(item);
    if (label === 'Home') return '/';
    if (label === 'Grossary') return `/ProductListing?category=${encodeURIComponent('Grocery')}`;
    if (label === 'Jewellery') return `/ProductListing?category=${encodeURIComponent('Jewellery')}`;
    return `/ProductListing?category=${encodeURIComponent(label)}`;
  };

  return (
    <>
      <nav className='py-3'>
        <div className='container flex items-center justify-between'>

          {/* Middle: Main Menu */}
          <div className='col_2 flex-1 px-8'>
            <ul className='flex items-center justify-center gap-8'>
              {menuItems.map((item) => (
                <li key={item} className='list-none relative group'>
                  <Link to={routeForMenuItem(item)}>
                    <button className='link transition font-bold text-text-900 dark:text-text-100 hover:text-primary-600 dark:hover:text-primary-400 text-sm py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-surface-800'>
                      {item}
                    </button>
                  </Link>

                  {/* Fashion -> Submenu */}
                  {item === 'Fashion' && (
                    <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                      <ul>
                        {/* Women */}
                        <li className='list-none relative group/sub'>
                          <Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></Link>
                          <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                            <ul>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Dresses</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Shoes</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Bags</Button></Link></li>
                            </ul>
                          </div>
                        </li>

                        {/* Men */}
                        <li className='list-none relative group/sub'>
                          <Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></Link>
                          <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                            <ul>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Shirts</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Watches</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Jackets</Button></Link></li>
                            </ul>
                          </div>
                        </li>

                        {/* Girls */}
                        <li className='list-none relative group/sub'>
                          <Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Girls</Button></Link>
                          <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                            <ul>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Tops</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Skirts</Button></Link></li>
                              <li><Link to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Frocks</Button></Link></li>
                            </ul>
                          </div>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Electronics -> Submenu */}
                  {item === 'Electronics' && (
                    <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                      <ul>
                        <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Laptop</Button></Link></li>
                        <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Smartwatch</Button></Link></li>

                        {/* Mobile with nested submenu */}
                        <li className='list-none relative group/sub'>
                          <Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Mobile</Button></Link>
                          <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                            <ul>
                              <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Vivo</Button></Link></li>
                              <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Oppo</Button></Link></li>
                              <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>iPhone</Button></Link></li>
                              <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Samsung</Button></Link></li>
                            </ul>
                          </div>
                        </li>
                        <li><Link to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Charger</Button></Link></li>
                      </ul>
                    </div>
                  )}

                  {/* Bags -> Submenu */}
                  {item === 'Bags' && (
                    <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                      <ul>
                        <li><Link to={routeForMenuItem('Bags')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></Link></li>
                        <li><Link to={routeForMenuItem('Bags')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></Link></li>
                      </ul>
                    </div>
                  )}

                  {/* Footwear -> Submenu */}
                  {item === 'Footwear' && (
                    <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                      <ul>
                        <li><Link to={routeForMenuItem('Footwear')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></Link></li>
                        <li><Link to={routeForMenuItem('Footwear')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></Link></li>
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Info & Links */}
          <div className='col_3 flex-shrink-0 flex items-center gap-4'>
            <Link to="/help-center" className="text-sm font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Help
            </Link>
            <Link to="/order-tracking" className="text-sm font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Track
            </Link>
            <p className='text-sm font-semibold text-text-700 dark:text-text-300 flex items-center gap-2 mb-0 mt-0 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 px-3 py-2 rounded-lg border border-success-200 dark:border-success-800'>
              <IoRocketSharp className='text-[16px]' /> Free Delivery
            </p>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
