import './App.css';
import AppRoutes from './routes/AppRoutes';
import Footer from './components/Footer';

import 'react-toastify/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import RefreshHandler from './components/RefreshHandler';

const HIDE_FOOTER_ON = ['/', '/landing', '/landing-chif', '/landing-clint', '/login', '/signup'];

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdminPage = location.pathname.startsWith('/admin');
  const showFooter = !HIDE_FOOTER_ON.includes(location.pathname) && !isAdminPage;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
      <RefreshHandler
        setIsAuthenticated={setIsAuthenticated}
        setUserRole={setUserRole}
        setAuthLoading={setAuthLoading}
      />
      <AppRoutes
        isAuthenticated={isAuthenticated}
        userRole={userRole}
        authLoading={authLoading}
      />
      {showFooter && <Footer />}
    </>
  );
}

export default App;