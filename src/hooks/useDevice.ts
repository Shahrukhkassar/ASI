import { useState, useEffect } from 'react';

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isPWA: boolean;
  isTouch: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
}

export function useDevice(): DeviceInfo {
  const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPWA: false,
        isTouch: false,
        orientation: 'portrait',
        screenWidth: 1200,
        screenHeight: 800,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    const orientation = height > width ? 'portrait' : 'landscape';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isPWA,
      isTouch,
      orientation,
      screenWidth: width,
      screenHeight: height,
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use matchMedia queries for efficient, shift-free updates
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const pwaQuery = window.matchMedia('(display-mode: standalone)');
    const orientationQuery = window.matchMedia('(orientation: portrait)');

    const updateDevice = () => {
      setDeviceInfo(getDeviceInfo());
    };

    // Add listeners using modern API with fallback
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', updateDevice);
      tabletQuery.addEventListener('change', updateDevice);
      desktopQuery.addEventListener('change', updateDevice);
      pwaQuery.addEventListener('change', updateDevice);
      orientationQuery.addEventListener('change', updateDevice);
    } else {
      window.addEventListener('resize', updateDevice);
      window.addEventListener('orientationchange', updateDevice);
    }

    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', updateDevice);
        tabletQuery.removeEventListener('change', updateDevice);
        desktopQuery.removeEventListener('change', updateDevice);
        pwaQuery.removeEventListener('change', updateDevice);
        orientationQuery.removeEventListener('change', updateDevice);
      } else {
        window.removeEventListener('resize', updateDevice);
        window.removeEventListener('orientationchange', updateDevice);
      }
    };
  }, []);

  return deviceInfo;
}

export default useDevice;
