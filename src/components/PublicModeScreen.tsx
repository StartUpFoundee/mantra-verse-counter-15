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
  const [tapCount, setTapCount] = useState<number>(0);
  const [exitTapSequence, setExitTapSequence] = useState<number[]>([]);
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

    // Hide status bars and make fullscreen - Enhanced implementation
    const enterFullscreen = async () => {
      try {
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

        // Hide address bar on mobile browsers
        if (window.screen && (window.screen as any).orientation) {
          window.scrollTo(0, 1);
        }
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    };

    enterFullscreen();

    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
      
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
      }
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    };
  }, []);

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
    
    // Handle exit sequence (6 quick taps within 3 seconds) - FIXED: Changed from 4 to 6 taps
    const newExitSequence = [...exitTapSequence, currentTime];
    
    // Keep only taps within the last 3 seconds - FIXED: Changed from 2 to 3 seconds
    const recentExitTaps = newExitSequence.filter(time => currentTime - time <= 3000);
    setExitTapSequence(recentExitTaps);
    
    // Check if 6 quick taps occurred - FIXED: Changed from 4 to 6 taps
    if (recentExitTaps.length >= 6) {
      console.log('Exit sequence detected - 6 quick taps');
      onExit();
      return;
    }
    
    // Handle double tap for counting - Completely separate from exit logic
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap <= 500 && timeSinceLastTap >= 100) { // Double tap within 500ms but at least 100ms apart
      // Valid double tap for counting
      console.log('Valid double tap detected - incrementing count');
      onIncrement();
      
      // Provide haptic feedback - FIXED: Separated vibration from tap detection
      triggerVibration();
      
      // Reset tap tracking for counting
      setTapCount(0);
      setLastTapTime(0);
    } else if (timeSinceLastTap >= 300) { // Debounce - minimum 300ms between potential first taps
      // First tap of potential double tap
      setTapCount(1);
      setLastTapTime(currentTime);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 w-full h-full cursor-none select-none"
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
        zIndex: 9999,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        overflow: 'hidden'
      }}
    >
      {/* Completely black screen - no content */}
    </div>
  );
};

export default PublicModeScreen;
