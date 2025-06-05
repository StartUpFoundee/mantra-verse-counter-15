
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw, Target, Eye } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import TargetSelector from "@/components/TargetSelector";
import CompletionAlert from "@/components/CompletionAlert";
import Timer from "@/components/Timer";
import { getLifetimeCount, getTodayCount, updateMantraCounts } from "@/utils/indexedDBUtils";
import { recordDailyActivity } from "@/utils/activityUtils";
import PublicModeDialog from "@/components/PublicModeDialog";
import PublicModeScreen from "@/components/PublicModeScreen";

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

  const handleCompletion = () => {
    // If in public mode, exit it first
    if (isPublicMode) {
      setIsPublicMode(false);
    }
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
    
    // Update counts in IndexedDB and record daily activity
    try {
      const { lifetimeCount: newLifetime, todayCount: newToday } = await updateMantraCounts(1);
      setLifetimeCount(newLifetime);
      setTodayCount(newToday);
      
      // Record daily activity for the calendar
      await recordDailyActivity(1);
      
      // Only show toast if not in public mode
      if (!isPublicMode) {
        toast.success(`Mantra counted: ${newCount} 🕉️`, {
          duration: 1000,
        });
      }
    } catch (error) {
      console.error("Error updating counts:", error);
    }
  };

  const handleDecrement = () => {
    if (currentCount > 0) {
      setCurrentCount(currentCount - 1);
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

  const handleStartPublicMode = () => {
    setShowPublicModeDialog(false);
    setIsPublicMode(true);
  };

  const handleExitPublicMode = () => {
    setIsPublicMode(false);
  };

  const progressPercentage = targetCount ? (currentCount / targetCount) * 100 : 0;

  // Show public mode screen if active
  if (isPublicMode) {
    return (
      <PublicModeScreen
        onIncrement={handleIncrement}
        onExit={handleExitPublicMode}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 py-12">
        <div className="text-amber-400 text-lg mb-4">Loading your spiritual journey...</div>
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 min-h-[calc(100vh-200px)] justify-center">
      {/* Timer Section - Mobile Optimized */}
      {timerMinutes && (
        <div className="mb-4 lg:mb-6 w-full">
          <Timer 
            initialMinutes={timerMinutes}
            onTimerComplete={handleTimerComplete}
            onReset={resetTimer}
            isActive={!showTimerComplete}
          />
        </div>
      )}

      {/* Progress Section - Mobile Responsive */}
      <div className="mb-4 lg:mb-6 text-center w-full">
        <div className="text-amber-400 text-2xl lg:text-3xl xl:text-4xl mb-2 font-bold">
          {currentCount} / {targetCount}
        </div>
        <div className="text-sm lg:text-base text-gray-400 font-medium">
          {Math.round(progressPercentage)}% complete
        </div>
      </div>
      
      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="stats w-full flex gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="stat flex-1 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 lg:p-4 text-center shadow-lg">
          <h3 className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium">Lifetime</h3>
          <p className="text-lg lg:text-xl xl:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lifetimeCount}
          </p>
        </div>
        
        <div className="stat flex-1 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-xl lg:rounded-2xl p-3 lg:p-4 text-center shadow-lg">
          <h3 className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-medium">Today</h3>
          <p className="text-lg lg:text-xl xl:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {todayCount}
          </p>
        </div>
      </div>
      
      {/* Counter Display - Mobile Optimized */}
      <div className="counter-display relative mb-8 lg:mb-10">
        <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl hover:shadow-3xl transition-shadow duration-300">
          <div className="text-white text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-2 lg:mb-3">ॐ</div>
            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold">{currentCount}</div>
          </div>
        </div>
      </div>
      
      {/* Control Buttons - Mobile Responsive Layout */}
      <div className="flex items-center justify-center gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Button
          onClick={handleDecrement}
          variant="outline"
          size="icon"
          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 border-2 border-orange-300 dark:border-orange-600 shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={currentCount === 0}
        >
          <Minus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-600 dark:text-orange-400" />
        </Button>
        
        <Button
          onClick={handleIncrement}
          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-2xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
        </Button>
        
        <Button
          onClick={resetCounter}
          variant="outline"
          size="icon"
          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 border-2 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-600 dark:text-gray-400" />
        </Button>
      </div>
      
      {/* Instructions - Mobile Responsive Text */}
      <div className="text-center mb-4 lg:mb-6 px-2">
        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base lg:text-lg font-medium">
          🙏 Tap the + button for each mantra chanted
        </p>
        <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm lg:text-base mt-1 font-medium">
          प्रत्येक जाप के लिए + बटन दबाएं
        </p>
      </div>
      
      {/* Control Buttons Row - Mobile Responsive */}
      <div className="flex gap-3 lg:gap-4 mb-4">
        <Button 
          variant="outline" 
          className="bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 backdrop-blur-sm h-10 lg:h-12 px-4 lg:px-6 text-sm lg:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={handleReset}
        >
          <Target className="w-4 h-4 mr-2" />
          Change Target
        </Button>

        <Button 
          variant="outline" 
          className="bg-white/70 dark:bg-zinc-800/70 hover:bg-white dark:hover:bg-zinc-700 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600 backdrop-blur-sm h-10 lg:h-12 px-4 lg:px-6 text-sm lg:text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => setShowPublicModeDialog(true)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Public Mode
        </Button>
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
