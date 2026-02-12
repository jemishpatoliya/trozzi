import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const socketErrorLoggedRef = useRef(false);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const socketEnabled = useMemo(() => {
    return Boolean(process.env.REACT_APP_SOCKET_URL);
  }, []);

  const socketUrl = useMemo(() => {
    if (process.env.REACT_APP_SOCKET_URL) return process.env.REACT_APP_SOCKET_URL;
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  }, []);

  const socketOptions = useMemo(() => {
    const explicit = Boolean(process.env.REACT_APP_SOCKET_URL);
    return {
      path: '/socket.io',
      transports: explicit ? ['websocket', 'polling'] : ['polling'],
      upgrade: explicit,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
      timeout: 8000,
    };
  }, []);

  const refreshNotifications = useCallback(async () => {
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
  }, [isAuthenticated]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiClient.get('/notifications/unread-count');
      const count = Number(res?.data?.data?.count ?? 0) || 0;
      setUnreadCount(count);
    } catch (_e) {
      // ignore
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id) => {
    const nid = String(id || '');
    if (!nid) return;

    try {
      await apiClient.post('/notifications/mark-read', { id: nid });
      setNotifications((prev) => prev.map((n) => (String(n?.id) === nid ? { ...n, isRead: true } : n)));
      await refreshUnreadCount();
    } catch (_e) {
      // ignore
    }
  }, [refreshUnreadCount]);

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_e) {
      // ignore
    }
  }, []);

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

    if (!socketEnabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      return;
    }

    let cancelled = false;

    const connectIfAvailable = async () => {
      if (cancelled) return;
      socketErrorLoggedRef.current = false;

      const s = io(socketUrl, {
        auth: token ? { token } : {},
        ...socketOptions,
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

      s.on('connect_error', (err) => {
        if (socketErrorLoggedRef.current) return;
        socketErrorLoggedRef.current = true;
        // eslint-disable-next-line no-console
        console.warn('[notifications] socket connection error:', err?.message || err);
      });

      return () => {
        s.off('notification:new', onNewNotification);
        s.off('connect_error');
        s.disconnect();
      };
    };

    let cleanupSocket = null;
    void (async () => {
      cleanupSocket = await connectIfAvailable();
    })();

    return () => {
      cancelled = true;
      if (typeof cleanupSocket === 'function') cleanupSocket();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, socketEnabled, token, user, socketOptions, socketUrl, refreshNotifications, refreshUnreadCount]);

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
  }, [socket, notifications, unreadCount, loading, markAllRead, markRead, refreshNotifications, refreshUnreadCount]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
