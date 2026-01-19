import React from 'react'
import { Link } from 'react-router-dom'

const BannerBox = (props) => {
  return (
    <div className='Box bannerbox overflow-hidden rounded-lg group'>
      <Link to={props.link || '/'}>
        <img src={props.img} className='w-full  group-hover:scale-110 duration-300 transition-all ease-in rotate-1' alt="banner" />
      </Link>
    </div>
  )
}

export default BannerBox

