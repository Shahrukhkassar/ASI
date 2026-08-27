import React, { createContext, useContext, ReactNode } from 'react';
import { useDevice, DeviceInfo } from '../hooks/useDevice';

const DeviceContext = createContext<DeviceInfo | undefined>(undefined);

export interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const deviceInfo = useDevice();

  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
};

export function useDeviceContext(): DeviceInfo {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
}

export default DeviceContext;
