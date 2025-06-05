
import React, { useEffect, useRef, useState } from "react";

interface PublicModeScreenProps {
  onIncrement: () => void;
  onExit: () => void;
  currentCount: number;
}

const PublicModeScreen: React.FC<PublicModeScreenProps> = ({
  onIncrement,
  onExit,
  currentCount,
}) => {
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const wakeLockRef = useRef<any>(null);
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showCounter, setShowCounter] = useState(false);

  // 10 minutes in milliseconds
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

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

    // Enhanced fullscreen implementation with better locking
    const enterFullscreen = async () => {
      try {
        // Hide address bar first
        window.scrollTo(0, 1);
        
        // Request fullscreen
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          await (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }

        // Lock orientation if possible
        if ((screen as any).orientation && (screen as any).orientation.lock) {
          try {
            await (screen as any).orientation.lock('portrait');
          } catch (e) {
            console.log('Screen orientation lock not supported');
          }
        }

        // Update viewport meta tag for maximum immersion
        let metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
          metaViewport = document.createElement('meta');
          metaViewport.setAttribute('name', 'viewport');
          document.head.appendChild(metaViewport);
        }
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover, minimal-ui');

        // Hide browser UI completely
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Disable context menu and selection globally
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('selectstart', (e) => e.preventDefault());
        document.addEventListener('dragstart', (e) => e.preventDefault());
        
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();

    // Power button exit detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Screen turned back on - exiting public mode');
        onExit();
      }
    };

    // Prevent keyboard shortcuts and system interactions
    const preventSystemInteractions = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', preventSystemInteractions);
    document.addEventListener('keyup', preventSystemInteractions);

    // Setup inactivity timer
    const resetInactivityTimer = () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      
      inactivityTimeoutRef.current = setTimeout(() => {
        console.log('10 minutes of inactivity - exiting public mode');
        onExit();
      }, INACTIVITY_TIMEOUT);
    };

    resetInactivityTimer();

    // Cleanup
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
      }

      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', preventSystemInteractions);
      document.removeEventListener('keyup', preventSystemInteractions);
      
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

      // Restore viewport and body styles
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [onExit]);

  const triggerVibration = () => {
    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
    }

    if ('vibrate' in navigator) {
      vibrationTimeoutRef.current = setTimeout(() => {
        // Enhanced vibration pattern for better feedback
        navigator.vibrate([300, 100, 300, 100, 300]);
        console.log('Enhanced vibration triggered for count increment');
      }, 10);
    }
  };

  const resetInactivityTimer = () => {
    setLastActivityTime(Date.now());
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('10 minutes of inactivity - exiting public mode');
      onExit();
    }, INACTIVITY_TIMEOUT);
  };

  const handleTouch = (event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    resetInactivityTimer();
    handleTap();
  };

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    resetInactivityTimer();
    handleTap();
  };

  const handleTap = () => {
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap <= 500 && timeSinceLastTap >= 100) {
      // Valid double tap
      console.log('Valid double tap detected - incrementing count');
      onIncrement();
      triggerVibration();
      
      // Show counter briefly
      setShowCounter(true);
      setTimeout(() => setShowCounter(false), 1500);
      
      setLastTapTime(0);
    } else if (timeSinceLastTap >= 300) {
      // First tap
      setLastTapTime(currentTime);
    }
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen cursor-none select-none bg-black flex items-center justify-center"
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
        minHeight: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#000000',
        zIndex: 999999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden',
        WebkitAppearance: 'none',
        border: 'none',
        outline: 'none',
        margin: 0,
        padding: 0,
        background: '#000000 !important',
        WebkitOverflowScrolling: 'touch',
        pointerEvents: 'auto',
        isolation: 'isolate',
        contain: 'layout style paint',
        willChange: 'transform',
        transform: 'translateZ(0)',
        WebkitUserModify: 'read-only',
        WebkitTextSizeAdjust: 'none',
        boxShadow: 'none',
        textShadow: 'none',
        filter: 'none',
        backdropFilter: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        visibility: 'visible',
        opacity: 1,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitUserDrag: 'none',
        WebkitCallout: 'none',
      }}
    >
      {/* Large Counter Display that fills entire screen */}
      <div 
        className={`transition-opacity duration-300 w-full h-full flex items-center justify-center ${showCounter ? 'opacity-100' : 'opacity-0'}`}
        style={{
          color: '#ffffff',
          fontSize: 'min(25vw, 25vh)',
          fontWeight: 'bold',
          fontFamily: 'monospace',
          textAlign: 'center',
          lineHeight: 1,
          textShadow: '0 0 30px rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {currentCount}
      </div>
    </div>
  );
};

export default PublicModeScreen;
