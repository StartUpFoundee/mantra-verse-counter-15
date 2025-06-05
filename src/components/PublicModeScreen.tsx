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

    // Hide status bars and make fullscreen
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
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
      
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    };
  }, []);

  const handleTouch = (event: React.TouchEvent) => {
    event.preventDefault();
    const currentTime = Date.now();
    
    // Handle exit sequence (4 quick taps within 2 seconds)
    const newExitSequence = [...exitTapSequence, currentTime];
    
    // Keep only taps within the last 2 seconds
    const recentTaps = newExitSequence.filter(time => currentTime - time <= 2000);
    setExitTapSequence(recentTaps);
    
    // Check if 4 quick taps occurred
    if (recentTaps.length >= 4) {
      onExit();
      return;
    }
    
    // Handle double tap for counting
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap <= 500 && timeSinceLastTap >= 100) { // Double tap within 500ms but at least 100ms apart
      // Valid double tap
      onIncrement();
      
      // Provide haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Very short vibration
      }
      
      // Reset tap tracking
      setTapCount(0);
      setLastTapTime(0);
    } else if (timeSinceLastTap >= 300) { // Debounce - minimum 300ms between potential first taps
      // First tap of potential double tap
      setTapCount(1);
      setLastTapTime(currentTime);
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    // Handle mouse clicks the same way as touches (for desktop testing)
    const currentTime = Date.now();
    
    // Handle exit sequence (4 quick clicks within 2 seconds)
    const newExitSequence = [...exitTapSequence, currentTime];
    const recentTaps = newExitSequence.filter(time => currentTime - time <= 2000);
    setExitTapSequence(recentTaps);
    
    if (recentTaps.length >= 4) {
      onExit();
      return;
    }
    
    // Handle double click for counting
    const timeSinceLastTap = currentTime - lastTapTime;
    
    if (timeSinceLastTap <= 500 && timeSinceLastTap >= 100) {
      onIncrement();
      
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      setTapCount(0);
      setLastTapTime(0);
    } else if (timeSinceLastTap >= 300) {
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
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Completely black screen - no content */}
    </div>
  );
};

export default PublicModeScreen;
