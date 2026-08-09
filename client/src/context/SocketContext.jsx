import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const SESSION_KEY = 'hm_socket_session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(() => readSession());

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(identity));
  }, [identity]);

  useEffect(() => {
    let s = null;
    if (identity && (identity.restaurantId || identity.customerId)) {
      s = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: true });
      setSocket(s);
      s.on('connect', () => {
        setConnected(true);
        s.emit('join', identity);
      });
      s.on('disconnect', () => setConnected(false));
    }
    return () => {
      s?.off('connect');
      s?.off('disconnect');
      s?.disconnect();
    };
  }, [identity]);

  /** (Re)join the restaurant + customer rooms; the effect reconnects and emits. */
  const join = useCallback((restaurantId, customerId = null) => {
    setIdentity((prev) => ({ ...prev, restaurantId: restaurantId || prev.restaurantId, customerId: customerId || prev.customerId }));
  }, []);

  const on = useCallback((event, handler) => {
    socket?.on(event, handler);
  }, [socket]);

  const off = useCallback(
    (event, handler) => {
      socket?.off(event, handler);
    },
    [socket]
  );

  const value = useMemo(() => ({ socket, connected, join, on, off }), [socket, connected, join, on, off]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}

export default SocketContext;