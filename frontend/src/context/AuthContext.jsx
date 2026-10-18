import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('vds-user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('vds-token') || null;
  });

  const [loading, setLoading] = useState(false);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vds-user');
    localStorage.removeItem('vds-token');
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('vds-user');
    const storedToken = localStorage.getItem('vds-token');
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);

        // Fetch fresh profile in background
        fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then(res => {
            if (res.ok) return res.json();
            if (res.status === 401) {
              logout();
            }
            return null;
          })
          .then(data => {
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem('vds-user', JSON.stringify(data.user));
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error("Failed to parse stored user", err);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('vds-user', JSON.stringify(userData));
    localStorage.setItem('vds-token', jwtToken);
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('vds-user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
