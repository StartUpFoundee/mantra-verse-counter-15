
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Pause, Play, Square } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface TimerProps {
  initialMinutes: number;
  onTimerComplete: () => void;
  onReset: () => void;
  isActive?: boolean;
}

const Timer: React.FC<TimerProps> = ({ 
  initialMinutes, 
  onTimerComplete, 
  onReset, 
  isActive = true 
}) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false); // Changed: Don't auto-start
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playAlarm();
    toast.success("🔔 Timer completed! Your meditation session is done.", {
      duration: 5000,
    });
    onTimerComplete();
  };

  const playAlarm = () => {
    // Create and play alarm sound
    try {
      const audio = new Audio("https://cdn.freesound.org/previews/221/221683_1015240-lq.mp3");
      alarmAudioRef.current = audio;
      audio.loop = true;
      audio.play().catch(e => console.error("Error playing alarm:", e));
      
      // Stop alarm after 10 seconds
      setTimeout(() => {
        if (alarmAudioRef.current) {
          alarmAudioRef.current.pause();
          alarmAudioRef.current = null;
        }
      }, 10000);
    } catch (error) {
      console.error("Error creating alarm audio:", error);
    }
  };

  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current = null;
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    stopAlarm(); // Stop alarm if running when user interacts
    
    if (!isRunning) {
      toast.success("⏰ Timer started!", { duration: 1500 });
    } else {
      toast.info("⏸️ Timer paused", { duration: 1500 });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100;

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-white/80 to-amber-50/80 dark:from-zinc-800/80 dark:to-zinc-900/80 backdrop-blur-sm border border-amber-200 dark:border-zinc-700 rounded-xl shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
          <Clock className="w-4 h-4 text-white" />
        </div>
        <span className="text-amber-600 dark:text-amber-400 font-semibold text-lg">Meditation Timer</span>
      </div>
      
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-amber-200 dark:border-zinc-600"></div>
        {/* Progress circle */}
        <svg className="absolute inset-0 w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-amber-500 transition-all duration-1000"
            strokeDasharray={`${progress * 3.77} 377`}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="text-xs text-amber-500 dark:text-amber-500 mt-1">
              {isRunning ? "Running" : "Ready"}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          onClick={toggleTimer}
          size="sm"
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
            isRunning 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </Button>
        
        <Button
          onClick={onReset}
          size="sm"
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-700 border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400"
        >
          <Square className="w-4 h-4" />
          Stop
        </Button>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {initialMinutes} minute meditation session
        </p>
        <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
          Click start when ready to begin
        </p>
      </div>
    </div>
  );
};

export default Timer;
