import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type AuthUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  type?: string;
};

export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    const parsedUser = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
    if (token) {
      setUser(parsedUser);
    } else {
      setUser(null);
      if (location.pathname !== '/sign-in') {
        navigate('/sign-in');
      }
    }

    setLoading(false);
  }, [navigate, location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/sign-in', { replace: true });
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return { user, loading, logout, updateUser, isAuthenticated: !!user };
};
