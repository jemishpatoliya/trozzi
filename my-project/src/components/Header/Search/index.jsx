import React from 'react'
// import  '../search/styles.css'
import Button from '@mui/material/Button';
import { IoSearchSharp } from "react-icons/io5";


const Search = () => {
  return ( 
    <div className='search-box w-[100%] h-[50px] bg-[#e5e5e5] rounded-[5px] relative p-2'>
      <input type="text"  name='' placeholder='Search for products.... ' className='w-full h-[35] focus:outline-none bg-inherit p-2 font-[14px] font-[#bbbbbb]'  />
      <Button className='!absolute top-1/2 right-2 transform -translate-y-1/2 !w-[40px] !min-w-[35px] h-[40px] rounded-full !text-black'><IoSearchSharp className='text-black text-[20px]'/></Button>
    </div>
  )
}

export default Search
