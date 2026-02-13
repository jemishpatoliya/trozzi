// Navigation.js
import React, { useEffect, useMemo, useState } from 'react';
import Button from '@mui/material/Button';
import { NavLink } from 'react-router-dom';
import { fetchCategories } from '../../../api/catalog';
import './style.css';

const Navigation = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await fetchCategories();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setCategories(list.filter((c) => c && c.name));
      } catch (_e) {
        if (!cancelled) setCategories([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const topCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const childrenByParent = useMemo(() => {
    const map = new Map();
    categories.forEach((c) => {
      if (!c || !c.parentId) return;
      const parentKey = c.parentId && typeof c.parentId === 'object'
        ? (c.parentId.id || c.parentId._id)
        : c.parentId;
      const key = String(parentKey);
      const prev = map.get(key) || [];
      prev.push(c);
      map.set(key, prev);
    });
    return map;
  }, [categories]);

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

  const routeForCategory = (value) => `/ProductListing?category=${encodeURIComponent(String(value))}`;

  const tabLinkClass = ({ isActive }) => (
    `link transition font-bold text-text-900 dark:text-text-100 hover:text-primary-600 dark:hover:text-primary-400 text-sm py-2 px-3 rounded-lg hover:bg-primary-50 dark:hover:bg-surface-800 ` +
    (isActive ? 'text-primary-600 border-b-2 border-primary-600 rounded-b-none' : 'border-b-2 border-transparent')
  );

  return (
    <>
      <nav className='py-3'>
        <div className='container flex items-center justify-between'>

          {/* Middle: Main Menu */}
          <div className='col_2 flex-1 px-8'>
            <ul className='flex items-center justify-center gap-8'>
              {topCategories.length > 0 ? (
                <>
                  <li key="Home" className='list-none relative group'>
                    <NavLink to="/" className={tabLinkClass}>
                      Home
                    </NavLink>
                  </li>
                  {topCategories.map((cat) => {
                    const catKey = String(cat.id || cat._id || cat.name);
                    const children = childrenByParent.get(catKey) || [];
                    return (
                      <li key={catKey} className='list-none relative group'>
                        <NavLink to={routeForCategory(cat.id || cat._id || cat.name)} className={tabLinkClass}>
                          {cat.name}
                        </NavLink>

                        {children.length > 0 && (
                          <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                            <ul>
                              {children.map((child) => (
                                <li key={child.id || child.name}>
                                  <NavLink to={routeForCategory(child.id || child._id || child.name)}>
                                    <Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>
                                      {child.name}
                                    </Button>
                                  </NavLink>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </>
              ) : (
                menuItems.map((item) => (
                  <li key={item} className='list-none relative group'>
                    <NavLink to={routeForMenuItem(item)} className={tabLinkClass}>
                      {item}
                    </NavLink>

                    {/* Fashion -> Submenu */}
                    {item === 'Fashion' && (
                      <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                        <ul>
                          {/* Women */}
                          <li className='list-none relative group/sub'>
                            <NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></NavLink>
                            <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                              <ul>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Dresses</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Shoes</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Bags</Button></NavLink></li>
                              </ul>
                            </div>
                          </li>

                          {/* Men */}
                          <li className='list-none relative group/sub'>
                            <NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></NavLink>
                            <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                              <ul>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Shirts</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Watches</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Jackets</Button></NavLink></li>
                              </ul>
                            </div>
                          </li>

                          {/* Girls */}
                          <li className='list-none relative group/sub'>
                            <NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Girls</Button></NavLink>
                            <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                              <ul>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Tops</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Skirts</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Fashion')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Frocks</Button></NavLink></li>
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
                          <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Laptop</Button></NavLink></li>
                          <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Smartwatch</Button></NavLink></li>

                          {/* Mobile with nested submenu */}
                          <li className='list-none relative group/sub'>
                            <NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Mobile</Button></NavLink>
                            <div className='submenu absolute top-0 left-[100%] min-w-[200px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                              <ul>
                                <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Vivo</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Oppo</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>iPhone</Button></NavLink></li>
                                <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Samsung</Button></NavLink></li>
                              </ul>
                            </div>
                          </li>
                          <li><NavLink to={routeForMenuItem('Electronics')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Charger</Button></NavLink></li>
                        </ul>
                      </div>
                    )}

                    {/* Bags -> Submenu */}
                    {item === 'Bags' && (
                      <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                        <ul>
                          <li><NavLink to={routeForMenuItem('Bags')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></NavLink></li>
                          <li><NavLink to={routeForMenuItem('Bags')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></NavLink></li>
                        </ul>
                      </div>
                    )}

                    {/* Footwear -> Submenu */}
                    {item === 'Footwear' && (
                      <div className='submenu absolute top-[100%] left-0 min-w-[220px] bg-white dark:bg-surface-900 shadow-xl border border-border-200 dark:border-border-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 rounded-xl overflow-hidden z-50'>
                        <ul>
                          <li><NavLink to={routeForMenuItem('Footwear')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Men</Button></NavLink></li>
                          <li><NavLink to={routeForMenuItem('Footwear')}><Button className='!w-full !text-left !text-text-700 dark:!text-text-300 hover:!bg-primary-50 dark:hover:!bg-surface-800 hover:!text-primary-600 dark:hover:!text-primary-400 transition-colors'>Women</Button></NavLink></li>
                        </ul>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Right: Info & Links */}
          <div className='col_3 flex-shrink-0 flex items-center gap-4'>
            <NavLink to="/help-center" className="text-sm font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Help
            </NavLink>
            <NavLink to="/order-tracking" className="text-sm font-medium text-text-700 dark:text-text-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Track
            </NavLink>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
