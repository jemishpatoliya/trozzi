// Categorypepal.js
import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import { FcCloseUpMode } from "react-icons/fc";
import { BiSolidPlusCircle } from "react-icons/bi";
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../../api/catalog';

const routeForCategory = (category) => `/ProductListing?category=${encodeURIComponent(String(category))}`;

const Categorypepal = (props) => {
  const [categories, setCategories] = useState([]);
  const [openCategoryIds, setOpenCategoryIds] = useState({});

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
      const key = String(c.parentId);
      const prev = map.get(key) || [];
      prev.push(c);
      map.set(key, prev);
    });
    return map;
  }, [categories]);

  const toggleOpen = (id) => {
    const key = String(id);
    setOpenCategoryIds((prev) => ({
      ...prev,
      [key]: !prev?.[key],
    }));
  };

  const DynamicDrawerList = (
    <Box sx={{ width: 280 }} role="presentation" className="CategoryPanel">
      {/* Header */}
      <h3 className="p-3 text-[17px] font-[500] flex items-center justify-between border-b">
        Shop by category
        <FcCloseUpMode
          onClick={() => props.setopenCategorypepal(false)}
          className="text-[25px] cursor-pointer"
        />
      </h3>

      {/* Scrollable list */}
      <div className="overflow-y-auto max-h-[90vh]">
        <ul className="w-full">
          <li>
            <Link
              to="/"
              className="block px-3 py-2 hover:bg-gray-100"
              onClick={() => props.setopenCategorypepal(false)}
            >
              Home
            </Link>
          </li>

          {topCategories.map((cat) => {
            const id = cat.id || cat._id || cat.name;
            const children = childrenByParent.get(String(cat.id)) || [];
            const isOpen = Boolean(openCategoryIds?.[String(cat.id)]);

            if (!children || children.length === 0) {
              return (
                <li key={id}>
                  <Link
                    to={routeForCategory(cat.id || cat.name)}
                    className="block px-3 py-2 hover:bg-gray-100"
                    onClick={() => props.setopenCategorypepal(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              );
            }

            return (
              <li key={id}>
                <div
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleOpen(cat.id)}
                >
                  <span>{cat.name}</span>
                  <BiSolidPlusCircle className={`transition-transform ${isOpen ? "rotate-45" : ""}`} />
                </div>

                {isOpen && (
                  <ul className="pl-5">
                    {children.map((child) => (
                      <li key={child.id || child._id || child.name}>
                        <Link
                          to={routeForCategory(child.id || child.name)}
                          className="block px-3 py-2 text-[14px] hover:bg-gray-50"
                          onClick={() => props.setopenCategorypepal(false)}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Box>
  );

  // --- States for dropdowns ---
  // Fashion
  const [isFashionOpen, setIsFashionOpen] = useState(false);
  const [isWomenOpen, setIsWomenOpen] = useState(false);
  const [isMenOpen, setIsMenOpen] = useState(false);
  const [isGirlsOpen, setIsGirlsOpen] = useState(false);

  // Electronics
  const [isElectronicsOpen, setIsElectronicsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLaptopOpen, setIsLaptopOpen] = useState(false);
  const [isChargerOpen, setIsChargerOpen] = useState(false);
  const [isWatchOpen, setIsWatchOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Beauty
  const [isBeautyOpen, setIsBeautyOpen] = useState(false);
  const [isMakeupOpen, setIsMakeupOpen] = useState(false);
  const [isSkincareOpen, setIsSkincareOpen] = useState(false);

  // Bags, Jewelry, Footwear, Grocery, Wellness
  const [isBagsOpen, setIsBagsOpen] = useState(false);
  const [isJewelryOpen, setIsJewelryOpen] = useState(false);
  const [isFootwearOpen, setIsFootwearOpen] = useState(false);
  const [isGroceryOpen, setIsGroceryOpen] = useState(false);
  const [isWellnessOpen, setIsWellnessOpen] = useState(false);

  const DrawerList = (
    <Box sx={{ width: 280 }} role="presentation" className="CategoryPanel">
      {/* Header */}
      <h3 className="p-3 text-[17px] font-[500] flex items-center justify-between border-b">
        Shop by category
        <FcCloseUpMode
          onClick={() => props.setopenCategorypepal(false)}
          className="text-[25px] cursor-pointer"
        />
      </h3>

      {/* Scrollable list */}
      <div className="overflow-y-auto max-h-[90vh]">
        <ul className="w-full">

          {/* -------- Fashion -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsFashionOpen(!isFashionOpen)}
            >
              <span>Fashion</span>
              <BiSolidPlusCircle className={`transition-transform ${isFashionOpen ? "rotate-45" : ""}`} />
            </div>

            {isFashionOpen && (
              <ul className="pl-5">
                {/* Women */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsWomenOpen(!isWomenOpen)}
                  >
                    <span>Women</span>
                    <BiSolidPlusCircle className={`transition-transform ${isWomenOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isWomenOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Dresses</Link></li>
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Shoes</Link></li>
                    </ul>
                  )}
                </li>

                {/* Men */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsMenOpen(!isMenOpen)}
                  >
                    <span>Men</span>
                    <BiSolidPlusCircle className={`transition-transform ${isMenOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isMenOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Shirts</Link></li>
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Watches</Link></li>
                    </ul>
                  )}
                </li>

                {/* Girls */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsGirlsOpen(!isGirlsOpen)}
                  >
                    <span>Girls</span>
                    <BiSolidPlusCircle className={`transition-transform ${isGirlsOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isGirlsOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Tops</Link></li>
                      <li><Link to={routeForCategory("Fashion")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Skirts</Link></li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>

          {/* -------- Electronics -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsElectronicsOpen(!isElectronicsOpen)}
            >
              <span>Electronics</span>
              <BiSolidPlusCircle className={`transition-transform ${isElectronicsOpen ? "rotate-45" : ""}`} />
            </div>

            {isElectronicsOpen && (
              <ul className="pl-5">
                {/* Mobile */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                  >
                    <span>Mobile</span>
                    <BiSolidPlusCircle className={`transition-transform ${isMobileOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isMobileOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">iPhone</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Samsung</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className='block px-3 py-2 text-[14px] hover:bg-gray-50'>Vivo</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className='block px-3 py-2 text-[14px] hover:bg-gray-50'>Oppo</Link></li>
                    </ul>
                  )}
                </li>

                {/* Laptop */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsLaptopOpen(!isLaptopOpen)}
                  >
                    <span>Laptop</span>
                    <BiSolidPlusCircle className={`transition-transform ${isLaptopOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isLaptopOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Dell</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">MacBook</Link></li>
                    </ul>
                  )}
                </li>

                {/* Charger */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsChargerOpen(!isChargerOpen)}
                  >
                    <span>Charger</span>
                    <BiSolidPlusCircle className={`transition-transform ${isChargerOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isChargerOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Fast Charger</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Wireless Charger</Link></li>
                    </ul>
                  )}
                </li>

                {/* Smartwatch */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsWatchOpen(!isWatchOpen)}
                  >
                    <span>Smartwatch</span>
                    <BiSolidPlusCircle className={`transition-transform ${isWatchOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isWatchOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Apple Watch</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Galaxy Watch</Link></li>
                    </ul>
                  )}
                </li>

                {/* Camera */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsCameraOpen(!isCameraOpen)}
                  >
                    <span>Camera</span>
                    <BiSolidPlusCircle className={`transition-transform ${isCameraOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isCameraOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Digital Camera</Link></li>
                      <li><Link to={routeForCategory("Electronics")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Analog Camera</Link></li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>

          {/* -------- Beauty -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsBeautyOpen(!isBeautyOpen)}
            >
              <span>Beauty</span>
              <BiSolidPlusCircle className={`transition-transform ${isBeautyOpen ? "rotate-45" : ""}`} />
            </div>

            {isBeautyOpen && (
              <ul className="pl-5">
                {/* Makeup */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsMakeupOpen(!isMakeupOpen)}
                  >
                    <span>Makeup</span>
                    <BiSolidPlusCircle className={`transition-transform ${isMakeupOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isMakeupOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Beauty")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Lipstick</Link></li>
                      <li><Link to={routeForCategory("Beauty")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Foundation</Link></li>
                    </ul>
                  )}
                </li>

                {/* Skincare */}
                <li>
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsSkincareOpen(!isSkincareOpen)}
                  >
                    <span>Skincare</span>
                    <BiSolidPlusCircle className={`transition-transform ${isSkincareOpen ? "rotate-45" : ""}`} />
                  </div>
                  {isSkincareOpen && (
                    <ul className="pl-5">
                      <li><Link to={routeForCategory("Beauty")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Moisturizer</Link></li>
                      <li><Link to={routeForCategory("Beauty")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Cleanser</Link></li>
                    </ul>
                  )}
                </li>
              </ul>
            )}
          </li>

          {/* -------- Bags -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsBagsOpen(!isBagsOpen)}
            >
              <span>Bags</span>
              <BiSolidPlusCircle className={`transition-transform ${isBagsOpen ? "rotate-45" : ""}`} />
            </div>
            {isBagsOpen && (
              <ul className="pl-5">
                <li><Link to={routeForCategory("Bags")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Handbags</Link></li>
                <li><Link to={routeForCategory("Bags")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Backpacks</Link></li>
              </ul>
            )}
          </li>

          {/* -------- Jewelry -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsJewelryOpen(!isJewelryOpen)}
            >
              <span>Jewelry</span>
              <BiSolidPlusCircle className={`transition-transform ${isJewelryOpen ? "rotate-45" : ""}`} />
            </div>
            {isJewelryOpen && (
              <ul className="pl-5">
                <li><Link to={routeForCategory("Jewellery")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Necklaces</Link></li>
                <li><Link to={routeForCategory("Jewellery")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Rings</Link></li>
              </ul>
            )}
          </li>

          {/* -------- Footwear -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsFootwearOpen(!isFootwearOpen)}
            >
              <span>Footwear</span>
              <BiSolidPlusCircle className={`transition-transform ${isFootwearOpen ? "rotate-45" : ""}`} />
            </div>
            {isFootwearOpen && (
              <ul className="pl-5">
                <li><Link to={routeForCategory("Footwear")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Sneakers</Link></li>
                <li><Link to={routeForCategory("Footwear")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Sandals</Link></li>
              </ul>
            )}
          </li>

          {/* -------- Grocery -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsGroceryOpen(!isGroceryOpen)}
            >
              <span>Grocery</span>
              <BiSolidPlusCircle className={`transition-transform ${isGroceryOpen ? "rotate-45" : ""}`} />
            </div>
            {isGroceryOpen && (
              <ul className="pl-5">
                <li><Link to={routeForCategory("Grocery")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Fruits</Link></li>
                <li><Link to={routeForCategory("Grocery")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Vegetables</Link></li>
              </ul>
            )}
          </li>

          {/* -------- Wellness -------- */}
          <li>
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => setIsWellnessOpen(!isWellnessOpen)}
            >
              <span>Wellness</span>
              <BiSolidPlusCircle className={`transition-transform ${isWellnessOpen ? "rotate-45" : ""}`} />
            </div>
            {isWellnessOpen && (
              <ul className="pl-5">
                <li><Link to={routeForCategory("Wellness")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Yoga</Link></li>
                <li><Link to={routeForCategory("Wellness")} className="block px-3 py-2 text-[14px] hover:bg-gray-50">Nutrition</Link></li>
              </ul>
            )}
          </li>

        </ul>
      </div>
    </Box>
  );

  return (
    <Drawer
      open={props.isopenCatpanel}
      onClose={() => props.setopenCategorypepal(false)}
    >
      {topCategories.length > 0 ? DynamicDrawerList : DrawerList}
    </Drawer>
  );
};

export default Categorypepal;
