import { useEffect, useRef, useCallback } from 'react';

/**
 * Type for back button handler callback.
 * Return `true` if the back event was consumed/handled (preventing default navigation or exit).
 * Return `false` or `void` to pass to the next handler in the stack or default action.
 */
export type BackButtonHandler = () => boolean | void | Promise<boolean | void>;

interface HandlerRegistration {
  id: string;
  handler: BackButtonHandler;
  priority: number;
}

// Global LIFO stack of registered back button handlers
const handlerStack: HandlerRegistration[] = [];
let isGlobalListenerInitialized = false;

/**
 * Safely push a history state trap to ensure mobile hardware back fires `popstate`
 * instead of closing the PWA/APK.
 */
export function pushHistoryTrap(stateName = 'asi_trap') {
  if (typeof window === 'undefined') return;
  try {
    window.history.pushState({ asiTrap: stateName, timestamp: Date.now() }, '', window.location.href);
  } catch (e) {
    // ignore
  }
}

/**
 * Initialize global popstate and Capacitor App back button listener
 */
function initGlobalBackButtonListener() {
  if (isGlobalListenerInitialized || typeof window === 'undefined') return;
  isGlobalListenerInitialized = true;

  // 1. Web / PWA Hardware Back Listener via popstate
  window.addEventListener('popstate', async (event) => {
    if (handlerStack.length > 0) {
      // Find the highest priority or most recent handler
      const top = handlerStack[handlerStack.length - 1];
      try {
        const handled = await top.handler();
        if (handled !== false) {
          // Re-push state to keep the back-button trap active for future presses
          pushHistoryTrap('asi_active_trap');
          return;
        }
      } catch (err) {
        console.warn('Error in back button handler:', err);
      }
    }
  });

  // 2. Capacitor / Cordova Native APK Fallback if running inside Capacitor Android container
  try {
    const capacitorApp = (window as any).Capacitor?.Plugins?.App;
    if (capacitorApp && typeof capacitorApp.addListener === 'function') {
      capacitorApp.addListener('backButton', async (data: { canGoBack?: boolean }) => {
        if (handlerStack.length > 0) {
          const top = handlerStack[handlerStack.length - 1];
          try {
            const handled = await top.handler();
            if (handled !== false) {
              return;
            }
          } catch (err) {
            console.warn('Error in native back button handler:', err);
          }
        }

        // If no handlers left, fallback to Capacitor exit or default back
        if (data && data.canGoBack) {
          window.history.back();
        } else {
          // At root screen, prompt or minimize
          try {
            capacitorApp.minimizeApp?.();
          } catch {
            // ignore
          }
        }
      });
    }
  } catch (e) {
    // Capacitor not present, standard PWA mode active
  }
}

/**
 * Register a back button handler.
 * Useful for modals, drawers, TestPlayer confirmation dialogs, and sub-views.
 *
 * @param handler Callback to execute when back button is pressed. Return `true` to consume the event.
 * @param enabled Whether this handler is currently active.
 * @param priority Higher priority handlers execute first. Default: 0.
 */
export function useBackButton(
  handler: BackButtonHandler,
  enabled: boolean = true,
  priority: number = 0
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const idRef = useRef<string>(`h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    initGlobalBackButtonListener();

    if (!enabled) return;

    // Push a trap state so the browser has a history entry to pop
    pushHistoryTrap(idRef.current);

    const registration: HandlerRegistration = {
      id: idRef.current,
      handler: () => handlerRef.current(),
      priority
    };

    handlerStack.push(registration);
    // Sort by priority ascending so highest priority is at the top of the stack
    handlerStack.sort((a, b) => a.priority - b.priority);

    return () => {
      const idx = handlerStack.findIndex((item) => item.id === idRef.current);
      if (idx !== -1) {
        handlerStack.splice(idx, 1);
      }
    };
  }, [enabled, priority]);

  const triggerBack = useCallback(() => {
    if (enabled) {
      return handlerRef.current();
    }
    return false;
  }, [enabled]);

  return { triggerBack };
}

export default useBackButton;
