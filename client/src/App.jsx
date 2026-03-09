import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import {Toaster} from "react-hot-toast";
import { AuthContext } from '../context/AuthContext';

const App = () => {
  const { authUser } = useContext(AuthContext)

  return(
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] font-sans antialiased selection:bg-[#6366F1]/30">
      <Toaster 
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #FFFFFF)',
            backdropFilter: 'blur(10px)',
            color: 'var(--toast-text, #0F172A)',
            border: '1px solid var(--toast-border, #E2E8F0)'
          }
        }}
      />
      <Routes>
        <Route path='/' element={ authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path='/login' element={ !authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/profile' element={ authUser ? <ProfilePage />: <Navigate to="/login" />} />
      </Routes>
    </div>
  )
}

export default App;