import React, { useEffect, useRef, useState } from "react";

interface PublicModeScreenProps {
  onIncrement: () => void;
  onExit: () => void;
}

const PublicModeScreen: React.FC<PublicModeScreenProps> = ({
  onIncrement,
  onExit,
}) => {
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const wakeLockRef = useRef<any>(null);
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Keep screen awake
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Screen wake lock activated');
        }
      } catch (error) {
        console.error('Failed to request wake lock:', error);
      }
    };

    requestWakeLock();

    // Enhanced fullscreen implementation to completely hide all UI
    const enterFullscreen = async () => {
      try {
        // Hide address bar and system UI first
        window.scrollTo(0, 1);
        
        // Request fullscreen on document element
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).mozRequestFullScreen) {
          await (document.documentElement as any).mozRequestFullScreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }

        // Additional mobile-specific fullscreen handling
        if ((screen as any).orientation && (screen as any).orientation.lock) {
          try {
            await (screen as any).orientation.lock('portrait');
          } catch (e) {
            console.log('Screen orientation lock not supported');
          }
        }

        // Force viewport to remove any system UI
        const metaViewport = document.querySelector('meta[name="viewport"]');
        if (metaViewport) {
          metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover');
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();

    // Power button exit detection - listen for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User pressed power button to turn screen back on
        console.log('Screen turned back on - exiting public mode');
        onExit();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }

      // Restore viewport
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, [onExit]);

  const triggerVibration = () => {
    // Clear any existing vibration timeout
    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
    }

    // Provide haptic feedback with timeout to prevent interference
    if ('vibrate' in navigator) {
      vibrationTimeoutRef.current = setTimeout(() => {
        navigator.vibrate(50); // Very short vibration
      }, 10); // Small delay to separate from tap detection
    }
  };

  const handleTouch = (event: React.TouchEvent) => {
    event.preventDefault();
    handleTap();
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    handleTap();
  };

  const handleTap = () => {
    const currentTime = Date.now();
    
    // Handle double tap for counting only (no exit logic via taps)
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap <= 500 && timeSinceLastTap >= 100) { // Double tap within 500ms but at least 100ms apart
      // Valid double tap for counting
      console.log('Valid double tap detected - incrementing count');
      onIncrement();
      
      // Provide haptic feedback - completely separated from any exit logic
      triggerVibration();
      
      // Reset tap tracking for counting
      setLastTapTime(0);
    } else if (timeSinceLastTap >= 300) { // Debounce - minimum 300ms between potential first taps
      // First tap of potential double tap
      setLastTapTime(currentTime);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full cursor-none select-none"
      onTouchStart={handleTouch}
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 999999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden',
        // Enhanced CSS to remove any possible UI elements
        WebkitAppearance: 'none',
        border: 'none',
        outline: 'none',
        margin: 0,
        padding: 0,
        // Ensure complete coverage including notch areas
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
        // Override any system styles
        background: '#000000 !important',
        color: 'transparent'
      }}
    >
      {/* Completely black screen - absolutely no content */}
    </div>
  );
};

export default PublicModeScreen;
