import React, { useState, useEffect } from 'react';

const SliderThumb = ({
  price,
  credits,
  additionalCredits,
  showPaymentPopup,
}: any) => {
  return (
    <div
      className="focus:outline-none"
      style={{
        position: "relative",
        zIndex: 3,
      }}
    >
      {/* Price Tooltip */}
      <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2">
        <div className="bg-[#006251] w-[150px] text-white px-4 py-2 rounded-lg font-medium text-sm text-center shadow-lg">
          Price: ${price}
        </div>
        <div className="absolute w-3 h-3 bg-[#006251] transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"></div>
      </div>

      {/* Thumb */}
      <div
        className="absolute w-[40px] h-[30px] bg-[#006251] rounded-lg shadow-lg cursor-pointer text-center text-white"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)", 
        }}
        onClick={showPaymentPopup}
      >Buy</div>


      {/* Credits Tooltip */}
      <div className="absolute bottom-[-90px] left-1/2 transform -translate-x-1/2 h-7">
        <div className="bg-[#006251] w-[150px] text-white px-4 py-2 rounded-lg font-medium text-sm text-center shadow-lg">
          Credits: {credits + additionalCredits}
        </div>
        <div className="absolute w-3 h-3 bg-[#006251] transform rotate-45 left-1/2 -translate-x-1/2 -top-1"></div>
      </div>
    </div>
  );
};

export default SliderThumb;