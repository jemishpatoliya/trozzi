import React, { useEffect, useRef, useState } from 'react'
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import './Style.css'
import { Collapse } from 'react-collapse';
import { FaAngleDown } from "react-icons/fa6";
import Button from '@mui/material/Button';
import { FaAngleUp } from "react-icons/fa6";
import RangeSlider from 'react-range-slider-input';
import 'react-range-slider-input/dist/style.css';

const Sidebar = ({
  selectedCategory = "",
  categories = [],
  onChangeCategory,
  onFiltersChange,
  initialFilters = {}
}) => {
  const [isOpenAvailfilter, setIsOpenAvailfilter] = useState(true);
  const [isOpenSizefilter, setIsOpenSizefilter] = useState(true);
  const [isOpenPricefilter, setIsOpenPricefilter] = useState(true);

  // Filter states
  const [availability, setAvailability] = useState(initialFilters.availability || 'all');
  const [selectedSizes, setSelectedSizes] = useState(initialFilters.sizes || []);
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || [100, 5000]);
  const [rating, setRating] = useState(initialFilters.rating || 0);

  const onFiltersChangeRef = useRef(onFiltersChange);

  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChangeRef.current?.({
      availability,
      sizes: selectedSizes,
      priceRange,
      rating
    });
  }, [availability, selectedSizes, priceRange, rating]);

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
  };

  const handleSizeChange = (size, checked) => {
    if (checked) {
      setSelectedSizes(prev => [...prev, size]);
    } else {
      setSelectedSizes(prev => prev.filter(s => s !== size));
    }
  };

  const handlePriceChange = (values) => {
    setPriceRange(values);
  };

  const clearAllFilters = () => {
    setAvailability('all');
    setSelectedSizes([]);
    setPriceRange([100, 5000]);
    setRating(0);
  };

  return (
    <aside className='sidebar'>
      {Array.isArray(categories) && categories.length > 0 && (
        <div className='box'>
          <h3 className='w-fullmb-3 text-[16px] font-[500] flex items-center pr-5'>Categories</h3>
          <div className='Scroll px-1'>
            <div className='grid grid-cols-1 gap-2'>
              <button
                type="button"
                onClick={() => onChangeCategory?.("")}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                  !selectedCategory ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className='w-9 h-9 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold'>
                  All
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-medium truncate'>All Products</div>
                </div>
              </button>

              {categories
                .filter((c) => c && c.active)
                .filter((c) => !c.parentId)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((c) => {
                  const isSelected = String(selectedCategory) === String(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChangeCategory?.(String(c.id))}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                        isSelected ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className='w-9 h-9 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0'>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className='w-full h-full object-cover' />
                        ) : null}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='text-sm font-medium truncate'>{c.name}</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div className='box'>
        <h3 className='w-fullmb-3 text-[16px] font-[500] flex items-center pr-5'>Availability
          <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenAvailfilter(!isOpenAvailfilter)}>
            {
              isOpenAvailfilter === true ? <FaAngleUp /> : <FaAngleDown />
            }

          </Button>
        </h3>
        <Collapse isOpened={isOpenAvailfilter}>
          <div className='Scroll px-4 relative -left-[13px]'>
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={availability === 'all'}
                  onChange={() => handleAvailabilityChange('all')}
                />
              }
              label="Available (17)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={availability === 'in_stock'}
                  onChange={() => handleAvailabilityChange('in_stock')}
                />
              }
              label="In stock (10)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={availability === 'not_available'}
                  onChange={() => handleAvailabilityChange('not_available')}
                />
              }
              label="Not Available (1)"
              className='w-full'
            />
          </div>
        </Collapse>
      </div>

      <div className='box mt-3'>
        <h3 className='w-fullmb-3 text-[16px] font-[500] flex items-center pr-5'>Size
          <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenSizefilter(!isOpenSizefilter)}>
            {
              isOpenSizefilter === true ? <FaAngleUp /> : <FaAngleDown />
            }

          </Button>
        </h3>
        <Collapse isOpened={isOpenSizefilter}>
          <div className='Scroll px-4 relative -left-[13px]'>
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={selectedSizes.includes('small')}
                  onChange={(e) => handleSizeChange('small', e.target.checked)}
                />
              }
              label="Small (6)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={selectedSizes.includes('medium')}
                  onChange={(e) => handleSizeChange('medium', e.target.checked)}
                />
              }
              label="Medium (5)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={selectedSizes.includes('large')}
                  onChange={(e) => handleSizeChange('large', e.target.checked)}
                />
              }
              label="Large (7)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={selectedSizes.includes('xl')}
                  onChange={(e) => handleSizeChange('xl', e.target.checked)}
                />
              }
              label="XL (1)"
              className='w-full'
            />
            <FormControlLabel
              control={
                <Checkbox
                  size='small'
                  checked={selectedSizes.includes('xxl')}
                  onChange={(e) => handleSizeChange('xxl', e.target.checked)}
                />
              }
              label="XXL (3)"
              className='w-full'
            />
          </div>
        </Collapse>
      </div>

      <div className='box mt-4'>
        <h3 className='w-fullmb-3 text-[16px] font-[500] flex items-center pr-5'>Filter By Price
          <Button className="!w-[30px] !h-[30px] !min-w-[30px] !rounded-full !ml-auto !text-[#000]" onClick={() => setIsOpenPricefilter(!isOpenPricefilter)}>
            {
              isOpenPricefilter === true ? <FaAngleUp /> : <FaAngleDown />
            }

          </Button>
        </h3>
        <Collapse isOpened={isOpenPricefilter}>
          <RangeSlider
            value={priceRange}
            onInput={handlePriceChange}
            min={0}
            max={10000}
            step={100}
          />

          <div className='flex pt-4 pb-2 pricerange'>
            <span className='text-[14px]'>
              From:<strong className='text-dark'>Rs: {priceRange[0]}</strong>
            </span>

            <span className='ml-auto text-[14px]'>
              From:<strong className='text-dark'>Rs: {priceRange[1]}</strong>
            </span>
          </div>
        </Collapse>
      </div>

      {/* Clear All Filters Button */}
      <div className='box mt-4'>
        <Button
          onClick={clearAllFilters}
          className='!w-full !bg-red-500 !text-white !py-2 !rounded-lg hover:!bg-red-600'
        >
          Clear All Filters
        </Button>
      </div>
    </aside>
  )
}

export default Sidebar
