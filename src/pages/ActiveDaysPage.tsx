import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Flame, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getActivityData, 
  getStreakData, 
  getCategoryCounts, 
  getSpiritualCategory,
  DailyActivity,
  StreakData,
  CategoryCounts
} from "@/utils/activityUtils";
import ModernCard from "@/components/ModernCard";
import SpiritualJourneyLevels from "@/components/SpiritualJourneyLevels";

const ActiveDaysPage: React.FC = () => {
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<{[date: string]: DailyActivity}>({});
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    totalActiveDays: 0
  });
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [hoveredDay, setHoveredDay] = useState<{date: string, activity: DailyActivity} | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Force data refresh when component mounts
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading activity data...');
      const activity = await getActivityData();
      const streaks = await getStreakData();
      const categories = await getCategoryCounts();
      
      console.log('Activity data:', activity);
      console.log('Streak data:', streaks);
      console.log('Category counts:', categories);
      
      setActivityData(activity);
      setStreakData(streaks);
      setCategoryCounts(categories);
    };
    loadData();
  }, []);

  const generateCalendarData = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= today) {
      const dateStr = currentDay.toISOString().split('T')[0];
      const activity = activityData[dateStr];
      const isToday = dateStr === today.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        activity: activity || { date: dateStr, count: 0, timestamp: 0 },
        isToday,
        dayOfWeek: currentDay.getDay(),
        month: currentDay.getMonth(),
        dayOfMonth: currentDay.getDate(),
        displayDate: new Date(currentDay)
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarData();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const renderDayIcon = (activity: DailyActivity) => {
    const category = getSpiritualCategory(activity.count);
    
    // For Rogi (0 jaaps), show nothing - keep calendar clean
    if (category.id === 0) {
      return (
        <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-sm bg-gray-200 dark:bg-gray-700">
        </div>
      );
    }
    
    // Special handling for Jivanmukta level - use custom image
    if (category.id === 6) {
      return (
        <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-sm overflow-hidden">
          <img 
            src="/lovable-uploads/c74d731e-65cc-4acc-94a8-b537d1013a2d.png" 
            alt="Jivanmukta"
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    // For other categories, use emoji icons with better visibility
    return (
      <div className={`w-3 h-3 lg:w-4 lg:h-4 rounded-sm flex items-center justify-center text-[8px] lg:text-[10px] bg-gradient-to-br ${category.gradient}`}>
        <span className="text-white drop-shadow-sm">{category.icon}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-900 dark:via-black dark:to-zinc-800 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent text-center">
          Spiritual Practice Tracker
        </h1>
        <div className="w-28"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 max-w-7xl mx-auto">
        <ModernCard className="p-6 lg:p-8 bg-gradient-to-br from-orange-400/20 to-red-500/20 border-orange-300/30 dark:border-orange-600/30" gradient>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Flame className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold text-orange-600 dark:text-orange-400 mb-1">Current Streak</h3>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{streakData.currentStreak}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">days in a row</p>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-6 lg:p-8 bg-gradient-to-br from-emerald-400/20 to-green-500/20 border-emerald-300/30 dark:border-emerald-600/30" gradient>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Max Streak</h3>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{streakData.maxStreak}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">personal best</p>
            </div>
          </div>
        </ModernCard>

        <ModernCard className="p-6 lg:p-8 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 border-purple-300/30 dark:border-purple-600/30" gradient>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Target className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg lg:text-xl font-semibold text-purple-600 dark:text-purple-400 mb-1">Total Active Days</h3>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{streakData.totalActiveDays}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">lifetime practice</p>
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Spiritual Journey Levels */}
      <div className="max-w-7xl mx-auto">
        <SpiritualJourneyLevels categoryCounts={categoryCounts} />
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto">
        <ModernCard className="p-6 lg:p-8 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border-amber-200/50 dark:border-amber-700/50" gradient>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 lg:w-7 lg:h-7 text-amber-600 dark:text-amber-400" />
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Practice Calendar</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Your spiritual evolution journey over the past year</p>
          </div>

          <div className="space-y-4">
            {/* Weekday Labels */}
            <div className="flex gap-1 lg:gap-2 ml-12 lg:ml-16">
              {weekdays.map((day) => (
                <div key={day} className="w-3 h-3 lg:w-4 lg:h-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  {day[0]}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex gap-1 lg:gap-2 overflow-x-auto pb-4">
              {Array.from({ length: 53 }, (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1 lg:gap-2">
                  {/* Month label */}
                  {weekIndex === 0 || (calendarDays[weekIndex * 7] && calendarDays[weekIndex * 7].displayDate.getDate() <= 7) ? (
                    <div className="h-4 lg:h-6 text-xs text-gray-500 dark:text-gray-400 mb-1 lg:mb-2 min-w-[40px] lg:min-w-[60px]">
                      {calendarDays[weekIndex * 7] && months[calendarDays[weekIndex * 7].month]}
                    </div>
                  ) : (
                    <div className="h-4 lg:h-6 mb-1 lg:mb-2"></div>
                  )}
                  
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = calendarDays[weekIndex * 7 + dayIndex];
                    if (!dayData) return <div key={dayIndex} className="w-3 h-3 lg:w-4 lg:h-4"></div>;
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-amber-400 relative ${
                          dayData.isToday ? 'ring-2 ring-amber-500' : ''
                        }`}
                        onMouseEnter={(e) => {
                          setHoveredDay({ date: dayData.date, activity: dayData.activity });
                          handleMouseMove(e);
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {renderDayIcon(dayData.activity)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-200/50 dark:border-amber-700/50 rounded-xl px-4 py-3 text-sm pointer-events-none shadow-xl"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 80,
          }}
        >
          <div className="text-gray-900 dark:text-white font-medium mb-1">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-amber-600 dark:text-amber-400 mb-1">
            {hoveredDay.activity.count} jaaps completed
          </div>
          {hoveredDay.activity.count > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getSpiritualCategory(hoveredDay.activity.count).sanskritName}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveDaysPage;
