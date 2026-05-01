import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function RefreshHandler({ setIsAuthenticated, setUserRole, setAuthLoading }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    const clearSession = () => {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userRole');
      setIsAuthenticated(false);
      setUserRole(null);
    };

    const validateTokenWithServer = async () => {
      try {
        const response = await fetch('http://127.0.0.1:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          clearSession();
          navigate('/login', { replace: true });
          return;
        }

        const payload = await response.json();
        const serverUser = payload?.data?.user || payload?.user || payload?.data;
        if (serverUser?.role) {
          setUserRole(serverUser.role);
          localStorage.setItem('userRole', serverUser.role);
        }

        if (serverUser) {
          localStorage.setItem(
            'loggedInUser',
            JSON.stringify({
              name: serverUser.name || '',
              username: serverUser.username || serverUser.name || '',
              email: serverUser.email || '',
              role: serverUser.role || 'customer',
            })
          );
        }
      } catch {
        clearSession();
        navigate('/login', { replace: true });
      }
    };

    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log("✅ Decoded Token:", decoded);

        setIsAuthenticated(true);
        setUserRole(decoded.role || "customer");
        localStorage.setItem('userRole', decoded.role || "customer");

        // Smart redirect logic
        const publicPaths = ['/', '/landing', '/landing-chif', '/landing-clint', '/login', '/signup'];

        if (publicPaths.includes(location.pathname)) {
          if (decoded.role === "admin" || decoded.role === "chief") {
            console.log("Admin detected → Redirecting to /admin");
            navigate("/admin", { replace: true });
          } else if (decoded.role === "user") {
            console.log("User detected → Redirecting to /client-home");
            navigate("/client-home", { replace: true });
          } else {
            console.log("Customer detected → Redirecting to /home");
            navigate("/home", { replace: true });
          }
        }

        validateTokenWithServer();
      } catch (error) {
        console.error("Invalid token:", error);
        clearSession();
      }
    } else {
      clearSession();
    }

    setAuthLoading(false);
  }, [location.pathname, navigate, setIsAuthenticated, setUserRole, setAuthLoading]);

  return null;
}

export default RefreshHandler;