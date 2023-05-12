import './App.css';
import Dashboard from './core/Dashboard';
import Form from './core/Form';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({children})=>{
  const isLoggedIn = localStorage.getItem("user:token") !== null;
  
  if(!isLoggedIn){
    return(
      <Navigate to="/users/sign_in" />
    )
  }
  else{
    return children;
  }
}

const Anonymous = () => {
  const isLoggedIn = localStorage.getItem("user:token") !== null;
  
  return isLoggedIn ? <Navigate to="/" replace /> : <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<PrivateRoute><Dashboard/></PrivateRoute>} />
      <Route element={<Anonymous/>}>
        <Route path='/users/sign_in' element={<Form isSignInPage={true}/>} />
        <Route path='/users/sign_up' element={<Form isSignInPage={false}/>} />
      </Route>
    </Routes>
  );
}

export default App;
