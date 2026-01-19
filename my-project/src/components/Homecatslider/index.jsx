// // // import React, { useEffect, useMemo, useState } from 'react'
// // // import { Link } from 'react-router-dom';

// // // import { fetchCategories } from '../../api/catalog';



// // // const Homecatslider = () => {
// // //   const [categories, setCategories] = useState([]);

// // //   useEffect(() => {
// // //     let cancelled = false;
// // //     async function load() {
// // //       try {
// // //         const data = await fetchCategories();
// // //         if (!cancelled) setCategories(Array.isArray(data) ? data : []);
// // //       } catch (e) {
// // //         if (!cancelled) setCategories([]);
// // //       }
// // //     }
// // //     load();
// // //     return () => {
// // //       cancelled = true;
// // //     };
// // //   }, []);

// // //   const topCategories = useMemo(() => {
// // //     return categories
// // //       .filter((c) => c && c.active)
// // //       .filter((c) => !c.parentId)
// // //       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
// // //   }, [categories]);

// // //   return (
// // //     <div className='py-12 px-6 bg-gradient-to-br from-gray-50 to-white'>
// // //       <div className=''>
// // //         <h2 className='text-3xl font-bold text-gray-900 mb-4 text-left'>Shop by Category</h2>
// // //         <p className='text-gray-600 mb-8 text-left max-w-2xl'>
// // //           Explore our wide range of categories and find exactly what you're looking for. From fashion to electronics, we have it all.
// // //         </p>

// // //         <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6'>
// // //           {topCategories.map((c) => (
// // //             <Link
// // //               key={c.id}
// // //               to={`/ProductListing?category=${encodeURIComponent(c.name)}`}
// // //               className='group'
// // //             >
// // //               <div className='bg-white rounded-3xl p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100'>
// // //                 <div className='w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center'>
// // //                   <img
// // //                     src={c.imageUrl || 'https://serviceapi.spicezgold.com/download/1755610847575_file_1734525204708_fash.png'}
// // //                     className='w-full h-full object-cover'
// // //                     alt={c.name}
// // //                   />
// // //                 </div>
// // //                 <h3 className='text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-left'>
// // //                   {c.name}
// // //                 </h3>
// // //                 {c.description && (
// // //                   <p className='text-sm text-gray-500 mt-2 line-clamp-2 text-left'>
// // //                     {c.description}
// // //                   </p>
// // //                 )}
// // //               </div>
// // //             </Link>
// // //           ))}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   )
// // // }

// // // export default Homecatslider



// // // src/components/Homecatslider.js
// // import React, { useEffect, useMemo, useState } from 'react'
// // import { Link } from 'react-router-dom';
// // import { fetchCategories } from '../../api/catalog';

// // const Homecatslider = () => {
// //   const [categories, setCategories] = useState([]);
// //   const [isLoading, setIsLoading] = useState(true);
// //   const [selectedCategory, setSelectedCategory] = useState(null);

// //   useEffect(() => {
// //     let cancelled = false;
// //     async function load() {
// //       try {
// //         setIsLoading(true);
// //         const data = await fetchCategories();
// //         if (!cancelled) setCategories(Array.isArray(data) ? data : []);
// //       } catch (e) {
// //         if (!cancelled) setCategories([]);
// //       } finally {
// //         if (!cancelled) setIsLoading(false);
// //       }
// //     }
// //     load();
// //     return () => {
// //       cancelled = true;
// //     };
// //   }, []);

// //   // Parent categories
// //   const parentCategories = useMemo(() => {
// //     return categories
// //       .filter((c) => c && c.active)
// //       .filter((c) => !c.parentId)
// //       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
// //   }, [categories]);

// //   // Get subcategories
// //   const getSubcategories = (parentId) => {
// //     return categories
// //       .filter((c) => c && c.active && c.parentId === parentId)
// //       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
// //   };

// //   // Display categories
// //   const displayCategories = useMemo(() => {
// //     if (!selectedCategory) {
// //       return parentCategories;
// //     }
// //     const subs = getSubcategories(selectedCategory.id);
// //     return subs.length > 0 ? subs : [selectedCategory];
// //   }, [selectedCategory, parentCategories, categories]);

// //   const handleCategoryClick = (category) => {
// //     setSelectedCategory(category);
// //   };

// //   const handleShowAll = () => {
// //     setSelectedCategory(null);
// //   };

// //   if (isLoading) {
// //     return (
// //       <div className='py-12 bg-gray-50'>
// //         <div className=''>
// //           <div className='flex gap-6'>
// //             <div className='w-64 flex-shrink-0'>
// //               <div className='bg-white rounded-lg p-4 shadow-sm'>
// //                 <div className='h-6 bg-gray-200 rounded animate-pulse mb-4'></div>
// //                 {[...Array(8)].map((_, i) => (
// //                   <div key={i} className='h-10 bg-gray-100 rounded animate-pulse mb-2'></div>
// //                 ))}
// //               </div>
// //             </div>
// //             <div className='flex-1'>
// //               <div className='h-8 w-48 bg-gray-200 rounded animate-pulse mb-6'></div>
// //               <div className='grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
// //                 {[...Array(8)].map((_, i) => (
// //                   <div key={i} className='bg-white rounded-lg p-4'>
// //                     <div className='aspect-square bg-gray-200 rounded animate-pulse mb-3'></div>
// //                     <div className='h-4 bg-gray-200 rounded animate-pulse'></div>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className='bg-gray-50 min-h-screen'>
// //       <div className='flex gap-6'>
// //         {/* Left Sidebar - Category Panel */}
// //         <aside className='w-24 flex-shrink-0'>
// //           <div className='bg-white rounded-lg shadow-sm border border-gray-200'>

// //             {/* Scrollable Content */}
// //             <div className='overflow-y-auto scrollbar-hide h-screen'>
// //               <div className='p-3'>

// //                 {/* Categories List */}
// //                 <div className='space-y-1'>
// //                   {parentCategories.map((category) => {
// //                     const subcategories = getSubcategories(category.id);
// //                     const isSelected = selectedCategory?.id === category.id;

// //                     return (
// //                       <div key={category.id}>
// //                         <button
// //                           onClick={() => handleCategoryClick(category)}
// //                           className={`
// //                                 w-full text-left rounded-lg transition-colors px-4 py-3 border-r-4
// //                                 ${isSelected
// //                               ? 'bg-gray-100 text-gray-900 border-red-500'
// //                               : 'bg-white text-gray-700 border-transparent hover:bg-gray-50'
// //                             }
// //                               `}
// //                         >
// //                           <div className='flex flex-col items-center gap-3'>
// //                             {/* Category Image */}
// //                             <div className='w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200'>
// //                               <img
// //                                 src={category.imageUrl || 'https://via.placeholder.com/40'}
// //                                 alt={category.name}
// //                                 className='w-full h-full object-cover'
// //                               />
// //                             </div>

// //                             {/* Text Content */}
// //                             <div className='flex-1 min-w-0'>
// //                               <span className='font-medium text-xs block truncate'>
// //                                 {category.name}
// //                               </span>
// //                             </div>
// //                           </div>
// //                         </button>
// //                       </div>
// //                     );
// //                   })}
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </aside>
// //       </div>
// //     </div>
// //   )
// // }

// // export default Homecatslider

// // src/components/Homecatslider.js - Sidebar for All Pages
// import React, { useEffect, useMemo, useState } from 'react'
// import { Link } from 'react-router-dom';
// import { fetchCategories } from '../../api/catalog';

// const Homecatslider = () => {
//   const [categories, setCategories] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [hoveredCategory, setHoveredCategory] = useState(null);

//   useEffect(() => {
//     let cancelled = false;
//     async function load() {
//       try {
//         setIsLoading(true);
//         const data = await fetchCategories();
//         if (!cancelled) setCategories(Array.isArray(data) ? data : []);
//       } catch (e) {
//         if (!cancelled) setCategories([]);
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     }
//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Parent categories
//   const parentCategories = useMemo(() => {
//     return categories
//       .filter((c) => c && c.active)
//       .filter((c) => !c.parentId)
//       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
//   }, [categories]);

//   // Get subcategories
//   const getSubcategories = (parentId) => {
//     return categories
//       .filter((c) => c && c.active && c.parentId === parentId)
//       .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
//   };

//   if (isLoading) {
//     return (
//       <aside className='w-24 bg-white border-r border-gray-200 h-screen overflow-y-auto'>
//         <style>{`
//           .scrollbar-hide::-webkit-scrollbar {
//             display: none;
//           }
//           .scrollbar-hide {
//             scrollbar-width: none;
//             -ms-overflow-style: none;
//           }
//         `}</style>
//         <div className='p-3 space-y-2'>
//           {[...Array(10)].map((_, i) => (
//             <div key={i} className='h-20 bg-gray-100 rounded-xl animate-pulse'></div>
//           ))}
//         </div>
//       </aside>
//     );
//   }

//   return (
//     <aside className='w-24 bg-white border-r border-gray-200 h-screen overflow-y-auto scrollbar-hide shadow-sm'>
//       <style>{`
//         .scrollbar-hide::-webkit-scrollbar {
//           display: none;
//         }
//         .scrollbar-hide {
//           scrollbar-width: none;
//           -ms-overflow-style: none;
//         }
//       `}</style>

//       <div className='p-2 py-4'>
//         {/* Categories List */}
//         <div className='space-y-2'>
//           {parentCategories.map((category, index) => {
//             const subcategories = getSubcategories(category.id);
//             const isHovered = hoveredCategory === category.id;

//             return (
//               <Link
//                 key={category.id}
//                 to={`/ProductListing?category=${encodeURIComponent(category.name)}`}
//                 onMouseEnter={() => setHoveredCategory(category.id)}
//                 onMouseLeave={() => setHoveredCategory(null)}
//                 className='block group relative'
//                 style={{
//                   animationDelay: `${index * 30}ms`
//                 }}
//               >
//                 <div className={`
//                   relative rounded-xl transition-all duration-300 overflow-hidden
//                   ${isHovered
//                     ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-2xl scale-105 -translate-y-1'
//                     : 'bg-gray-50 hover:bg-gray-100 hover:shadow-md'
//                   }
//                 `}>
//                   {/* Card Content */}
//                   <div className='p-2'>
//                     {/* Image Container */}
//                     <div className={`
//                       relative w-full aspect-square rounded-xl overflow-hidden shadow-md border-2 transition-all duration-300 mb-2
//                       ${isHovered ? 'border-white scale-110 shadow-xl' : 'border-gray-200'}
//                     `}>
//                       <img
//                         src={category.imageUrl || 'https://via.placeholder.com/60'}
//                         alt={category.name}
//                         className={`
//                           w-full h-full object-cover transition-transform duration-500
//                           ${isHovered ? 'scale-125 rotate-3' : 'scale-100'}
//                         `}
//                       />

//                       {/* Gradient Overlay on Hover */}
//                       <div className={`
//                         absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent transition-opacity duration-300
//                         ${isHovered ? 'opacity-100' : 'opacity-0'}
//                       `}></div>

//                       {/* Subcategory Badge */}
//                       {subcategories.length > 0 && (
//                         <div className={`
//                           absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg transition-all duration-300
//                           ${isHovered ? 'bg-yellow-400 text-gray-900 scale-110' : 'bg-blue-600 text-white'}
//                         `}>
//                           {subcategories.length}
//                         </div>
//                       )}
//                     </div>

//                     {/* Category Name */}
//                     <div className='text-center'>
//                       <span className={`
//                         font-bold text-[10px] leading-tight block transition-all duration-300 line-clamp-2
//                         ${isHovered ? 'text-white scale-105' : 'text-gray-800'}
//                       `}>
//                         {category.name}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Shine Effect on Hover */}
//                   <div className={`
//                     absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700
//                     ${isHovered ? 'translate-x-full' : '-translate-x-full'}
//                   `}></div>

//                   {/* Bottom Indicator on Hover */}
//                   {isHovered && (
//                     <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 animate-pulse'></div>
//                   )}
//                 </div>

//                 {/* Hover Tooltip - Shows on Right */}
//                 <div className={`
//                   absolute left-full top-0 ml-2 z-50 transition-all duration-300 pointer-events-none
//                   ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
//                 `}>
//                   <div className='bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl min-w-[200px]'>
//                     <p className='font-bold text-sm mb-1'>{category.name}</p>
//                     {category.description && (
//                       <p className='text-xs text-gray-300 mb-2 line-clamp-2'>{category.description}</p>
//                     )}
//                     {subcategories.length > 0 && (
//                       <p className='text-xs text-blue-300 font-semibold'>
//                         {subcategories.length} subcategories →
//                       </p>
//                     )}
//                     {/* Tooltip Arrow */}
//                     <div className='absolute left-0 top-4 -translate-x-1/2 rotate-45 w-3 h-3 bg-gray-900'></div>
//                   </div>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>

//         {/* Bottom Branding */}
//         <div className='mt-6 pt-6 border-t border-gray-200 text-center'>
//           <Link to='/ProductListing' className='block group'>
//             <div className='w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300'>
//               <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
//                 <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
//               </svg>
//             </div>
//             <p className='text-[9px] font-bold text-gray-600 mt-2 group-hover:text-blue-600 transition-colors'>View All</p>
//           </Link>
//         </div>
//       </div>
//     </aside>
//   );
// }

// export default Homecatslider;

// src/components/Homecatslider.js - Simple Menubar Sidebar
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom';
import { fetchCategories } from '../../api/catalog';

const FALLBACK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const Homecatslider = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchCategories();
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Parent categories
  const parentCategories = useMemo(() => {
    return categories
      .filter((c) => c && c.active)
      .filter((c) => !c.parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [categories]);

  // Get subcategories count
  const getSubcategoriesCount = (parentId) => {
    return categories.filter((c) => c && c.active && c.parentId === parentId).length;
  };

  if (isLoading) {
    return (
      <aside className='w-20 bg-white border-r border-gray-200 h-screen overflow-y-auto'>
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
        <div className='p-2 space-y-2'>
          {[...Array(10)].map((_, i) => (
            <div key={i} className='h-16 bg-gray-100 rounded animate-pulse'></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className='w-20 bg-white border-r border-gray-200 h-screen overflow-y-auto scrollbar-hide'>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      <div className='p-2 py-3'>
        {/* Categories List */}
        <div className='space-y-1'>
          {parentCategories.map((category) => {
            const subcategoriesCount = getSubcategoriesCount(category.id);

            return (
              <Link
                key={category.id}
                to={`/ProductListing?category=${encodeURIComponent(category.name)}`}
                className='block group'
              >
                <div className='p-2 rounded-lg hover:bg-gray-100 transition-colors'>
                  {/* Image Container */}
                  <div className='relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-200 mb-1.5'>
                    <img
                      src={
                        category.imageUrl
                          ? category.imageUrl.startsWith('http')
                            ? category.imageUrl
                            : `http://localhost:5050${category.imageUrl}`
                          : FALLBACK_IMAGE
                      }
                      alt={category.name}
                      className='w-full h-full object-cover'
                      onLoad={(e) => {
                        e.target.style.opacity = '1';
                      }}
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                        e.target.style.opacity = '1';
                      }}
                      style={{ opacity: '0', transition: 'opacity 0.3s ease' }}
                    />

                    {/* Subcategory Badge */}
                    {subcategoriesCount > 0 && (
                      <div className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-600 text-white flex items-center justify-center text-[8px] font-bold'>
                        {subcategoriesCount}
                      </div>
                    )}
                  </div>

                  {/* Category Name */}
                  <div className='text-center'>
                    <span className='font-medium text-[9px] text-gray-700 leading-tight block line-clamp-2'>
                      {category.name}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className='mt-4 pt-3 border-t border-gray-200'>
          <Link to='/ProductListing' className='block'>
            <div className='p-2 rounded-lg hover:bg-gray-100 transition-colors text-center'>
              <div className='w-10 h-10 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-1.5'>
                <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
                </svg>
              </div>
              <span className='font-medium text-[9px] text-gray-600'>View All</span>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default Homecatslider;