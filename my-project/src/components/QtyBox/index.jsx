import Button from '@mui/material/Button'
import React from 'react'
import { FaAngleUp } from "react-icons/fa6";
import { FaAngleDown } from "react-icons/fa6";





const QtyBox = () => {

  const [qty, setQty] = React.useState(1);

  const incQty = () => {
    setQty(qty + 1);
  };

  const decQty = () => {
    if (qty > 1) {
      setQty(qty - 1);
    }
  };

  return (
    <div className='flex items-center relative'>
      <input
        type="number"
        className='w-full h-[40px] p-2 text-[16px] focus:outline-none border border-[rgba(0,0,0,0.2)] rounded-md'
        value={qty}
        onChange={(e) => setQty(parseInt(e.target.value))}
      />
      <div className='flex items-center flex-col justify-between h-[40px] absolute top-0 right-0 z-50 border-l border-l-[rgba(0,0,0,0.2) px-1'> 
        <Button className='!min-w-[30px] !w-[30px] !h-[20px] !text-black !rounded-none hover:!bg-[#f1f1f1]' onClick={incQty}><FaAngleUp className='text-[12px] opacity-55'/></Button>
        <Button className='!min-w-[30px] !w-[30px] !h-[20px] !text-black!rounded-none hover:!bg-[#f1f1f1]' onClick={decQty}><FaAngleDown className='text-[12px] text-black opacity-55'/></Button>
      </div>

      
    </div>
  );
};

export default QtyBox;

