'use client'

import { useContext } from 'react';
import AppContext from '../context/Context';

export default function ButtonWrapper({ children, classNames = "", ...props }) {
 const { color } = useContext(AppContext)

  return (
    <button
      type="button"
      style={props.theme ? {
        backgroundColor: props.theme?.colors?.button,
        color: color?.btnAccent
      } : {
        backgroundColor: color?.primaryAccent,
        color: color?.btnAccent,
      }}
      className={'transition-all duration-300 disabled:opacity-40 hover:opacity-75 disabled:cursor-not-allowed ' + classNames}
      {...props}
    >
      {children}
    </button>
  )
}