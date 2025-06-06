import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Target, Eye, Volume2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import TargetSelector from "@/components/TargetSelector";
import CompletionAlert from "@/components/CompletionAlert";
import Timer from "@/components/Timer";
import { getLifetimeCount, getTodayCount, updateMantraCounts } from "@/utils/indexedDBUtils";
import { recordDailyActivity } from "@/utils/activityUtils";
import PublicModeDialog from "@/components/PublicModeDialog";
import PublicModeScreen from "@/components/PublicModeScreen";
import { NativeFeatures } from "@/utils/nativeFeatures";

const ManualCounter: React.FC = () => {
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [showCompletionAlert, setShowCompletionAlert] = useState<boolean>(false);
  const [lifetimeCount, setLifetimeCount] = useState<number>(0);
  const [todayCount, setTodayCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [showTimerComplete, setShowTimerComplete] = useState<boolean>(false);
  const [showPublicModeDialog, setShowPublicModeDialog] = useState<boolean>(false);
  const [isPublicMode, setIsPublicMode] = useState<boolean>(false);
  const [volumeButtonEnabled, setVolumeButtonEnabled] = useState<boolean>(true);
  const [volumeButtonDetected, setVolumeButtonDetected] = useState<boolean>(false);
  const [volumeButtonLastUsed, setVolumeButtonLastUsed] = useState<number>(0);

  // Initialize native features and media session
  useEffect(() => {
    const initNativeFeatures = async () => {
      await NativeFeatures.setStatusBarStyle(false);
      
      // Initialize media session for better web volume button detection
      NativeFeatures.initializeMediaSession();
      
      // Listen for app state changes
      NativeFeatures.addAppStateListener((isActive) => {
        if (!isActive && isPublicMode) {
          setIsPublicMode(false);
          console.log('App backgrounded - exiting public mode');
        }
      });
    };

    initNativeFeatures();
  }, [isPublicMode]);

  // Enhanced volume button detection with guaranteed counter increment
  useEffect(() => {
    if (volumeButtonEnabled && targetCount !== null) {
      const handleVolumePress = async () => {
        const now = Date.now();
        
        // Prevent multiple triggers within short timespan
        if (now - volumeButtonLastUsed < 300) {
          return;
        }
        
        setVolumeButtonLastUsed(now);
        setVolumeButtonDetected(true);
        
        console.log('Volume button pressed - incrementing counter');
        
        // Call handleIncrement directly to ensure counter increments
        await handleIncrement();
        
        // Enhanced feedback for volume button usage
        toast.success("📱 Volume button → Counter +1!", {
          duration: 1500,
          style: { 
            background: '#16a34a', 
            color: 'white',
            border: '2px solid #22c55e'
          }
        });
        
        // Reset the visual indicator after a delay
        setTimeout(() => {
          setVolumeButtonDetected(false);
        }, 500);
      };
      
      NativeFeatures.addVolumeButtonListener(handleVolumePress);
      console.log('Volume button detection enabled - counter will increment on press');
      
      // Show initial setup toast
      if (volumeButtonEnabled) {
        setTimeout(() => {
          toast.info("📱 Volume buttons active! Press volume up/down to count mantras.", {
            duration: 4000,
            style: { 
              background: '#3b82f6', 
              color: 'white'
            }
          });
        }, 1000);
      }
    } else {
      NativeFeatures.removeVolumeButtonListener();
    }

    return () => {
      NativeFeatures.removeVolumeButtonListener();
    };
  }, [volumeButtonEnabled, targetCount, volumeButtonLastUsed]);

  // Load saved counts from IndexedDB on component mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        setIsLoading(true);
        const lifetime = await getLifetimeCount();
        const today = await getTodayCount();
        
        setLifetimeCount(lifetime);
        setTodayCount(today);
      } catch (error) {
        console.error("Error loading counts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCounts();
  }, []);

  useEffect(() => {
    // Check if target is reached
    if (targetCount !== null && currentCount >= targetCount && targetCount > 0) {
      handleCompletion();
    }
  }, [currentCount, targetCount]);

  const handleCompletion = async () => {
    if (isPublicMode) {
      setIsPublicMode(false);
      await NativeFeatures.showStatusBar();
    }
    
    // Enhanced completion haptics
    await NativeFeatures.triggerHaptic('heavy');
    setTimeout(async () => {
      await NativeFeatures.triggerHaptic('medium');
    }, 200);
    
    setShowCompletionAlert(true);
  };

  const handleSelectTarget = (target: number, timer?: number) => {
    setTargetCount(target);
    setTimerMinutes(timer || null);
    setCurrentCount(0);
    setShowCompletionAlert(false);
    setShowTimerComplete(false);
  };

  const handleTimerComplete = () => {
    setShowTimerComplete(true);
  };

  const resetTimer = () => {
    setTimerMinutes(null);
    setShowTimerComplete(false);
  };

  const handleIncrement = async () => {
    const newCount = currentCount + 1;
    setCurrentCount(newCount);
    
    console.log(`Counter incremented: ${currentCount} → ${newCount}`);
    
    // Enhanced haptic feedback for counting
    await NativeFeatures.triggerMantraHaptic();
    
    try {
      const { lifetimeCount: newLifetime, todayCount: newToday } = await updateMantraCounts(1);
      setLifetimeCount(newLifetime);
      setTodayCount(newToday);
      
      await recordDailyActivity(1);
      
      if (!isPublicMode) {
        toast.success(`Mantra counted: ${newCount} 🕉️`, {
          duration: 1000,
        });
      }
    } catch (error) {
      console.error("Error updating counts:", error);
    }
  };

  const handleDecrement = async () => {
    if (currentCount > 0) {
      setCurrentCount(currentCount - 1);
      await NativeFeatures.triggerHaptic('light');
      toast.info("Count decreased", {
        duration: 800,
      });
    }
  };

  const resetCounter = () => {
    setCurrentCount(0);
    setShowCompletionAlert(false);
    toast.info("Counter reset", {
      duration: 800,
    });
  };

  const handleReset = () => {
    resetCounter();
    setTargetCount(null);
  };

  const handleStartPublicMode = async () => {
    setShowPublicModeDialog(false);
    await NativeFeatures.hideStatusBar();
    setIsPublicMode(true);
  };

  const handleExitPublicMode = async () => {
    await NativeFeatures.showStatusBar();
    setIsPublicMode(false);
  };

  const toggleVolumeButton = () => {
    const newState = !volumeButtonEnabled;
    setVolumeButtonEnabled(newState);
    
    if (newState) {
      toast.success("📱 Volume button counting ENABLED! Press volume up/down to count.", {
        duration: 3000,
        style: { 
          background: '#16a34a', 
          color: 'white'
        }
      });
    } else {
      toast.info("📱 Volume button counting DISABLED", {
        duration: 2000,
        style: { 
          background: '#6b7280', 
          color: 'white'
        }
      });
    }
  };

  const testVolumeButton = () => {
    // Simulate volume button press for testing
    handleIncrement();
    toast.success("📱 Test increment! Now try your device's volume buttons.", {
      duration: 3000,
      style: { 
        background: '#16a34a', 
        color: 'white'
      }
    });
  };

  const progressPercentage = targetCount ? (currentCount / targetCount) * 100 : 0;

  // Show public mode screen if active
  if (isPublicMode) {
    return (
      <PublicModeScreen
        onIncrement={handleIncrement}
        onExit={handleExitPublicMode}
        currentCount={currentCount}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 py-8">
        <div className="text-amber-400 text-base mb-3">Loading your spiritual journey...</div>
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (targetCount === null) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <TargetSelector onSelectTarget={handleSelectTarget} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-3 min-h-[calc(100vh-120px)] justify-center">
      {/* Timer Section - Compact Mobile */}
      {timerMinutes && (
        <div className="mb-3 w-full">
          <Timer 
            initialMinutes={timerMinutes}
            onTimerComplete={handleTimerComplete}
            onReset={resetTimer}
            isActive={!showTimerComplete}
          />
        </div>
      )}

      {/* Progress Section - Compact */}
      <div className="mb-3 text-center w-full">
        <div className="text-amber-400 text-xl md:text-2xl lg:text-3xl mb-1 font-bold">
          {currentCount} / {targetCount}
        </div>
        <div className="text-xs md:text-sm text-gray-400 font-medium">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>
      
      {/* Stats Cards - Compact Mobile */}
      <div className="stats w-full flex gap-2 mb-4">
        <div className="stat flex-1 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-lg p-2 text-center shadow-lg">
          <h3 className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lifetime</h3>
          <p className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-400">
            {lifetimeCount}
          </p>
        </div>
        
        <div className="stat flex-1 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-lg p-2 text-center shadow-lg">
          <h3 className="text-xs text-gray-500 dark:text-gray-400 font-medium">Today</h3>
          <p className="text-base md:text-lg font-bold text-amber-600 dark:text-amber-400">
            {todayCount}
          </p>
        </div>
      </div>
      
      {/* Counter Display - More Compact */}
      <div className="counter-display relative mb-6">
        <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 ${
          volumeButtonDetected ? 'ring-4 ring-green-400 ring-opacity-75 animate-pulse scale-105' : ''
        }`}>
          <div className="text-white text-center">
            <div className="text-2xl md:text-3xl mb-1">ॐ</div>
            <div className="text-2xl md:text-3xl font-bold">{currentCount}</div>
          </div>
        </div>
        
        {/* Enhanced Volume Button Detection Indicator */}
        {volumeButtonDetected && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-bounce shadow-lg border-2 border-green-300">
            📱 Volume → +1!
          </div>
        )}
        
        {/* Volume Button Status Indicator */}
        {volumeButtonEnabled && !volumeButtonDetected && (
          <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-75">
            📱
          </div>
        )}
      </div>
      
      {/* Control Buttons - Compact Layout */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <Button
          onClick={handleDecrement}
          variant="outline"
          size="icon"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 border-2 border-orange-300 dark:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={currentCount === 0}
        >
          <Minus className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
        </Button>
        
        <Button
          onClick={handleIncrement}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
        </Button>
        
        <Button
          onClick={resetCounter}
          variant="outline"
          size="icon"
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 border-2 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
        </Button>
      </div>
      
      {/* Compact Instructions */}
      <div className="text-center mb-3 px-2">
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
          🙏 Tap + or press volume buttons
        </p>
        <p className="text-amber-600 dark:text-amber-400 text-xs mt-1 font-medium">
          + बटन दबाएं या वॉल्यूम बटन दबाएं
        </p>
        {volumeButtonEnabled && (
          <div className="mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full inline-block">
            <p className="text-green-700 dark:text-green-400 text-xs font-medium">
              📱 Volume buttons active
            </p>
          </div>
        )}
      </div>
      
      {/* Control Buttons Row - Compact */}
      <div className="flex gap-2 mb-3">
        <Button 
          variant="outline" 
          className="bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 backdrop-blur-sm h-8 px-3 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={handleReset}
        >
          <Target className="w-3 h-3 mr-1" />
          Change Target
        </Button>

        <Button 
          variant="outline" 
          className="bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600 backdrop-blur-sm h-8 px-3 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setShowPublicModeDialog(true)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Public Mode
        </Button>
      </div>

      {/* Volume Button Controls - Compact */}
      <div className="flex gap-2 mb-3">
        <Button 
          variant={volumeButtonEnabled ? "default" : "outline"}
          className={`h-8 px-3 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200 ${
            volumeButtonEnabled 
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
              : 'bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
          }`}
          onClick={toggleVolumeButton}
        >
          <Volume2 className="w-3 h-3 mr-1" />
          Volume {volumeButtonEnabled ? 'ON' : 'OFF'}
        </Button>

        {volumeButtonEnabled && (
          <Button 
            variant="outline"
            className="h-8 px-2 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600"
            onClick={testVolumeButton}
          >
            Test +1
          </Button>
        )}
      </div>

      <CompletionAlert 
        isOpen={showCompletionAlert} 
        targetCount={targetCount} 
        onClose={() => setShowCompletionAlert(false)} 
      />

      <PublicModeDialog
        isOpen={showPublicModeDialog}
        onClose={() => setShowPublicModeDialog(false)}
        onStart={handleStartPublicMode}
      />

      {showTimerComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 text-center max-w-sm w-full">
            <h3 className="text-2xl text-orange-600 mb-4">🔔 Timer Complete!</h3>
            <p className="text-gray-700 mb-4">Your meditation session time is up.</p>
            <Button 
              onClick={() => setShowTimerComplete(false)}
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualCounter;
