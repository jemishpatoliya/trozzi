import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();

  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const socketUrl = useMemo(() => {
    if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
    if (typeof window !== 'undefined' && String(window.location.port) === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:5051`;
    }
    return window.location.origin;
  }, []);

  const refreshNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications', { params: { page: 1, limit: 50 } });
      const items = Array.isArray(res?.data?.data) ? res.data.data : [];
      const metaUnread = Number(res?.data?.meta?.unreadCount ?? 0) || 0;
      setNotifications(items);
      setUnreadCount(metaUnread);
    } finally {
      setLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/notifications/unread-count');
      const count = Number(res?.data?.data?.count ?? 0) || 0;
      setUnreadCount(count);
    } catch (_e) {
      // ignore
    }
  };

  const markRead = async (id) => {
    const nid = String(id || '');
    if (!nid) return;

    try {
      await apiClient.post('/notifications/mark-read', { id: nid });
      setNotifications((prev) => prev.map((n) => (String(n?.id) === nid ? { ...n, isRead: true } : n)));
      await refreshUnreadCount();
    } catch (_e) {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_e) {
      // ignore
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const s = io(socketUrl, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
    });

    socketRef.current = s;
    setSocket(s);

    const onNewNotification = (payload) => {
      const id = String(payload?.id || '');
      if (!id) return;

      setNotifications((prev) => {
        const exists = prev.some((n) => String(n?.id) === id);
        if (exists) return prev;
        return [payload, ...prev].slice(0, 50);
      });

      if (!payload?.isRead) {
        setUnreadCount((c) => (Number(c) || 0) + 1);
      }
    };

    s.on('notification:new', onNewNotification);

    s.on('connect', () => {
      refreshUnreadCount();
      refreshNotifications();
    });

    s.on('reconnect', () => {
      refreshUnreadCount();
      refreshNotifications();
    });

    return () => {
      s.off('notification:new', onNewNotification);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, token, user, socketUrl]);

  const value = useMemo(() => {
    return {
      socket,
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      refreshUnreadCount,
      markRead,
      markAllRead,
    };
  }, [socket, notifications, unreadCount, loading]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
