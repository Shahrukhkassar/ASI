/**
 * ASI Performance & Low-End Device Optimization Utility
 * Specially tuned for low-end Android phones & rural mobile networks (Mawana / Niwari / Meerut)
 */

export interface DevicePerformanceProfile {
  isLowEnd: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  connectionEffectiveType: string;
  isSaveData: boolean;
  disableBlur: boolean;
  disableConfetti: boolean;
  disableHeavyAnimations: boolean;
}

/**
 * Detects whether the user is on a resource-constrained or low-end device
 */
export function getDevicePerformanceProfile(): DevicePerformanceProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isLowEnd: false,
      hardwareConcurrency: 8,
      deviceMemory: 8,
      connectionEffectiveType: '4g',
      isSaveData: false,
      disableBlur: false,
      disableConfetti: false,
      disableHeavyAnimations: false
    };
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionEffectiveType = connection?.effectiveType || '4g';
  const isSaveData = Boolean(connection?.saveData);

  // Low-end criteria: < 4 CPU cores, < 4GB RAM, or slow 2g/3g/saveData mode
  const isLowEnd = 
    hardwareConcurrency < 4 || 
    deviceMemory < 4 || 
    connectionEffectiveType === '2g' || 
    connectionEffectiveType === 'slow-2g' ||
    connectionEffectiveType === '3g' ||
    isSaveData;

  return {
    isLowEnd,
    hardwareConcurrency,
    deviceMemory,
    connectionEffectiveType,
    isSaveData,
    disableBlur: isLowEnd,
    disableConfetti: isLowEnd,
    disableHeavyAnimations: isLowEnd
  };
}

// Global cached profile
export const currentPerformanceProfile = getDevicePerformanceProfile();

/**
 * Conditionally fire canvas-confetti only on devices capable of smooth 60fps
 */
export async function triggerOptimizedConfetti(options?: any) {
  if (currentPerformanceProfile.disableConfetti) {
    return;
  }
  try {
    const confettiModule = await import('canvas-confetti');
    const confettiFn: any = confettiModule.default || confettiModule;
    confettiFn({
      particleCount: currentPerformanceProfile.isLowEnd ? 30 : 80,
      spread: 60,
      origin: { y: 0.6 },
      disableForReducedMotion: true,
      ...options
    });
  } catch {
    // ignore on failure
  }
}

/**
 * Safe CSS helper class to remove heavy GPU blurs on low-end APKs
 */
export function getOptimizedBackdropClass(defaultBackdrop = 'backdrop-blur-md'): string {
  if (currentPerformanceProfile.disableBlur) {
    return 'bg-slate-950/95'; // Solid opacity instead of expensive backdrop blur filter
  }
  return defaultBackdrop;
}
