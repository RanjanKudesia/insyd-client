'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/app/_context/AuthContext';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const WS_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL ??
  'wss://m75xolz360.execute-api.eu-north-1.amazonaws.com/prod';

interface SocketContextValue {
  status: WSStatus;
  unread: number;
  resetUnread: () => void;
  send: (payload: object) => void;
}

export const useInsydSocket = (): SocketContextValue => {
  const { user, isAuthenticated } = useAuth();
  
  const [status, setStatus] = useState<WSStatus>('disconnected');
  const [unread, setUnread] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<NodeJS.Timeout | null>(null);
  const retriesRef = useRef(0);
  const isConnectingRef = useRef(false);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up WebSocket connection');
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'client cleanup');
      wsRef.current = null;
    }
    
    isConnectingRef.current = false;
    setStatus('disconnected');
  }, []);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      console.log('📤 Sent message:', payload);
    } else {
      console.warn('❌ Cannot send message - WebSocket not open');
    }
  }, []);

  const startHeartbeat = useCallback((ws: WebSocket) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    
    heartbeatRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingMessage = JSON.stringify({ 
          action: 'ping', 
          timestamp: Date.now() 
        });
        console.log('💓 Sending heartbeat');
        ws.send(pingMessage);
      }
    }, 15000); // Reduced to 15 seconds
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user?.userId) {
      console.log('🚫 Cannot connect - user not authenticated');
      return;
    }

    if (isConnectingRef.current) {
      console.log('🔄 Already connecting, skipping');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      cleanup();
    }

    const wsUrl = `${WS_URL}?userId=${user.userId}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    setStatus('connecting');
    isConnectingRef.current = true;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setStatus('connected');
        isConnectingRef.current = false;
        retriesRef.current = 0;
        
        // Start heartbeat
        startHeartbeat(ws);
      };

      ws.onmessage = (evt) => {
        console.log('📨 Raw WebSocket message:', evt.data);
        
        try {
          const msg = JSON.parse(evt.data);
          console.log('📨 Parsed message:', msg);
          
          if (msg.type === 'notification') {
            console.log('🔔 Processing notification:', msg);
            setUnread(prev => prev + 1);
            
            // Show browser notification
            if (Notification.permission === 'granted' && msg.data) {
              new Notification(msg.data.title || 'New Notification', {
                body: msg.data.message || 'You have a new notification',
                tag: msg.data.id || Date.now().toString(),
                icon: '/favicon.ico',
              });
            }
          } else if (msg.type === 'pong') {
            console.log('💓 Received pong');
          } else {
            console.log(`❓ Unknown message type: "${msg.type}"`);
          }
        } catch (err) {
          console.error('❌ Failed to parse message:', err);
          console.error('Raw data:', evt.data);
        }
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        isConnectingRef.current = false;
        
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }

        // Only attempt reconnect if it wasn't a clean close and we haven't exceeded retry limit
        if (!event.wasClean && retriesRef.current < 5 && isAuthenticated && user) {
          retriesRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, retriesRef.current - 1), 30000);
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${retriesRef.current}/5)`);
          setStatus('connecting');
          
          retryRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setStatus(event.wasClean ? 'disconnected' : 'error');
          wsRef.current = null;
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setStatus('error');
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setStatus('error');
      isConnectingRef.current = false;
    }
  }, [isAuthenticated, user, cleanup, startHeartbeat]);

  // Connection effect - removed openSocket from dependencies to prevent infinite loops
  useEffect(() => {
    if (isAuthenticated && user?.userId) {
      console.log('🔌 Auth state: connecting WebSocket');
      connect();
    } else {
      console.log('🚫 Auth state: cleaning up WebSocket');
      cleanup();
    }

    // Cleanup on unmount
    return cleanup;
  }, [isAuthenticated, user?.userId]); // Removed connect and cleanup from deps

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('🔔 Notification permission:', permission);
      });
    }
  }, []);

  // Add visibility change handler to reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user?.userId) {
        // Check if connection is still alive when tab becomes visible
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('👁️ Tab visible: reconnecting WebSocket');
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user?.userId, connect]);

  return {
    status,
    unread,
    resetUnread: () => {
      console.log('🔄 Resetting unread count');
      setUnread(0);
    },
    send,
  };
};
