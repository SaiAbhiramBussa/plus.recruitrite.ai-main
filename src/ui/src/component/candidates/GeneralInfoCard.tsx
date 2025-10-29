import Image from 'next/image'
import { useState } from 'react';

export default function GeneralInfoCard(props: any) {

    return (
        <div className="pt-8 pb-12 w-2/4 mx-auto border-b-2 border-[#D3D5FD]">
          <div className='mt-8'>
            <div className='font-bold'>Most experienced industry</div>
            <div className='font-thin'>Bank</div>
          </div>
          <div className='mt-8'>
            <div className='font-bold'>Years of Experience</div>
            <div className='font-thin'>12 Years</div>
          </div>
          <div className='mt-8'>
            <div className='font-bold'>Salary Range</div>
            <div className='font-thin'>1.500usd to 3.500usd</div>
          </div>
        </div>  
    )
}
