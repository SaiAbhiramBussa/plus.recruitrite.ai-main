import Image from 'next/image'
import { useState } from 'react';

export default function WorkExCard(props: any) {

    return (
      <div className="pt-8 pb-12 border-b-2 border-[#D3D5FD]">
          <div className='font-thin mb-6'>Company name</div>   
          <div className='flex justify-between mb-4'>
            <div>
              <div className='font-bold'>Charge</div>
              <div className='font-thin'>Developer</div>
            </div>
            <div>
              <div className='font-bold'>Sector</div>
              <div className='font-thin'>Banks</div>
            </div>
            <div>
              <div className='font-bold'>Dates</div>
              <div className='font-thin'>01 Apr 2021 to 01 Apr 2022</div>
            </div>
          </div> 
          <div className='font-thin'>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam pellentesque laoreet risus, non aliquet sem scelerisque ac. Pellentesque nec consequat odio. Proin rutrum, ligula a porta hendrerit, nulla mauris tempor elit, ut varius dui tellus eget nulla. Etiam suscipit, est ac semper efficitur, erat lacus pharetra massa.
          </div>
      </div>
    )
}
