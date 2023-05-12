import React from 'react'

const Input = (
    {
    label="",
    type="text",
    name="",
    divClassName="",
    className="",
    isRequired= true,
    placeholder="",
    value= "",
    onChange= () =>{}
    }
) => {
  return (
    <div className={`justify-center items-center m-2 w-3/5 ${divClassName}`}>
        <label className="block mb-2 text-sm text-gray-600 font-medium">{label}</label>
        <input type={type} id={name} value={value} onChange={onChange} className={`border border-gray-300 w-full shadow-lg p-2 bg-slate-50 rounded ${className}`} placeholder={placeholder} required={isRequired}/>
    </div>
  )
}

export default Input;