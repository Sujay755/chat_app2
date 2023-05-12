import React from 'react'

const Button = (
    {
        label = "Button",
        type = "Button",
        className = "",
        disabled = false
    }
) => {
  return (
    <button type={type} className={`text-white bg-blue-600 hover:bg-blue-500 rounded-lg text-sm w-3/5 px-5 py-2 text-center ${className}`} disabled={disabled}>{label}</button>
  )
}

export default Button;