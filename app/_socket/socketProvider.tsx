'use client';

import { createContext, useContext } from 'react';
import { useInsydSocket } from './useInsydSocket';

const SocketContext = createContext<ReturnType<typeof useInsydSocket> | null>(
  null
);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useInsydSocket();
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be inside <SocketProvider>');
  return ctx;
};
