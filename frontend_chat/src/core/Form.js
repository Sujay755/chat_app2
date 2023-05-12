import Input from "../components/Input";
import React, { useState } from "react";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";

const Form = ({ isSignInPage = false }) => {

  const [data,setData] = useState({
    ...(!isSignInPage && {
      fullName: ''
    }),
    email: '',
    password: ''
  })

  const navigate = useNavigate();

  const handleSubmit = async (e)=>{
    e.preventDefault();
    const response = await fetch(`https://chat-app2-red.vercel.app:5000/api/${isSignInPage? 'signin' : 'signup'}`,{
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data) 
    })
    console.log(response.status);
    if(response.status === 400){
      alert('Invalid credentials')
    }else{
      const responseData = await response.json();
      if(responseData.token){
        localStorage.setItem('user:token', responseData.token);
        localStorage.setItem('user:details',JSON.stringify(responseData.user));
        navigate('/');
      }
    }
  }

  return (
    <div className="flex bg-blue-100 justify-center items-center h-screen">
      <div className="bg-white w-2/6 h-5/6 shadow-lg rounded-lg flex flex-col justify-center items-center">
      <h1 className="text-3xl font-extrabold p-2">
        Welcome {isSignInPage && "back"}
      </h1>
      <h3 className="text-xl font-thin mb-6 p-2 text-center">
        {isSignInPage
          ? "Sign in to explore"
          : "Sign up to get started instantly"}
      </h3>
      <form onSubmit={handleSubmit} className="flex flex-col w-full justify-center items-center">
        {!isSignInPage && (
          <Input
            label="Full name"
            name="name"
            placeholder="Enter your full name"
            value={data.fullName}
            onChange={e=> setData({...data, fullName: e.target.value})}
          />
        )}
        <Input
          label="Email address"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={data.email}
          onChange={e=>setData({...data, email: e.target.value})}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="Enter your password"
          value={data.password}
          onChange={e=>setData({...data, password: e.target.value})}
        />
        <Button
          label={isSignInPage ? "Sign in" : "Sign up"}
          type = 'submit'
          className="mt-4 mb-2"
        />
      </form>
      {isSignInPage ? (
        <h1 className="text-sm text-center">
          Don't have an account?{" "}
          <span className="text-blue-500 cursor-pointer underline">
            <Link to="/users/sign_up">Sign up</Link>
          </span>
        </h1>
      ) : (
        <h1 className="text-sm text-center">
          Already have an account?{" "}
          <span className="text-blue-500 cursor-pointer underline">
          <Link to="/users/sign_in">Sign in</Link>
          </span>
        </h1>
      )}
      </div>
    </div>
  );
};

export default Form;
