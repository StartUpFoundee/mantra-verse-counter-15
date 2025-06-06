
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Flame, Target, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityData, getStreakData } from "@/utils/activityUtils";
import { getTodayCount } from "@/utils/indexedDBUtils";
import ModernCard from "@/components/ModernCard";
import { getSpiritualLevel } from "@/components/SpiritualJourneyLevels";

interface ActivityData {
  [date: string]: number;
}

interface StreakData {
  currentStreak: number;
  maxStreak: number;
  totalActiveDays: number;
}

const ActiveDaysPage: React.FC = () => {
  const navigate = useNavigate();
  const [activityData, setActivityData] = useState<ActivityData>({});
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    maxStreak: 0,
    totalActiveDays: 0
  });
  const [hoveredDay, setHoveredDay] = useState<{date: string, count: number} | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const loadData = async () => {
      const activity = await getActivityData();
      const streaks = await getStreakData();
      
      // Get today's count from the main counter
      const todayCount = await getTodayCount();
      const today = new Date().toISOString().split('T')[0];
      
      // Update activity data with today's count
      const updatedActivity = { ...activity };
      if (todayCount > 0) {
        updatedActivity[today] = todayCount;
      }
      
      setActivityData(updatedActivity);
      setStreakData(streaks);
    };
    loadData();

    // Refresh data every 2 seconds to catch updates from mantra counter
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate year options only if we have past year data
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const activityDates = Object.keys(activityData).filter(date => activityData[date] > 0);
    if (activityDates.length === 0) return [currentYear];
    
    const earliestDate = activityDates.sort()[0];
    const journeyStartYear = new Date(earliestDate + 'T00:00:00').getFullYear();
    
    if (journeyStartYear === currentYear) {
      return [currentYear];
    }
    
    const years = [];
    for (let year = journeyStartYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  // Generate horizontal calendar for selected month/year
  const generateHorizontalCalendar = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const currentDate = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = activityData[dateStr] || 0;
      
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      
      days.push({
        date: dateStr,
        count,
        isToday,
        day,
        dayOfWeek: date.getDay()
      });
    }
    
    return days;
  };

  const monthDays = generateHorizontalCalendar();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const getActivityLevel = (count: number): string => {
    if (count === 0) return "bg-gray-200/50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600";
    const level = getSpiritualLevel(count);
    return "bg-emerald-200/70 dark:bg-emerald-800/50 border border-emerald-300 dark:border-emerald-600";
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Define achievement levels directly
  const achievementLevels = [
    { icon: '🔥', name: 'Beginner', range: '1-10' },
    { icon: '🧘', name: 'Seeker', range: '11-50' },
    { icon: '🕉️', name: 'Devotee', range: '51-108' },
    { icon: '🪷', name: 'Mystic', range: '109-200' },
    { icon: '🌟', name: 'Sage', range: '201-500' },
    { icon: '💎', name: 'Master', range: '501-1000' },
    { icon: '👑', name: 'Guru', range: '1000+' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-900 dark:via-black dark:to-zinc-800 p-2 md:p-4 overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4 max-w-6xl mx-auto">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 backdrop-blur-sm p-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent text-center">
          Active Days
        </h1>
        <div className="w-16"></div>
      </div>

      {/* Compact Stats Cards */}
      <div className="grid grid-cols-3 gap-2 mb-4 max-w-6xl mx-auto">
        <ModernCard className="p-3 bg-gradient-to-br from-orange-400/20 to-red-500/20 border-orange-300/30 dark:border-orange-600/30" gradient>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg mb-2">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Current Streak</h3>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{streakData.currentStreak}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">days</p>
          </div>
        </ModernCard>

        <ModernCard className="p-3 bg-gradient-to-br from-emerald-400/20 to-green-500/20 border-emerald-300/30 dark:border-emerald-600/30" gradient>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg mb-2">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Max Streak</h3>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{streakData.maxStreak}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">best</p>
          </div>
        </ModernCard>

        <ModernCard className="p-3 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 border-purple-300/30 dark:border-purple-600/30" gradient>
          <div className="flex flex-col items-center text-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg mb-2">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Total Active</h3>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{streakData.totalActiveDays}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">days</p>
          </div>
        </ModernCard>
      </div>

      {/* Compact Achievement Categories */}
      <div className="mb-4 max-w-6xl mx-auto">
        <ModernCard className="p-3 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border-amber-200/50 dark:border-amber-700/50" gradient>
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏆</span>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Achievement Categories</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {achievementLevels.map((level, index) => (
              <div
                key={index}
                className="rounded-lg p-2 text-center transition-all duration-200 hover:scale-105 border bg-gray-100 text-gray-700 border-gray-300"
              >
                <div className="flex flex-col items-center h-full justify-between">
                  <div className="text-lg mb-1 min-h-[1.5rem] flex items-center justify-center">
                    {level.icon}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="font-semibold text-xs mb-1">{level.name}</div>
                    <div className="text-xs opacity-75">{level.range}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModernCard>
      </div>

      {/* Horizontal Calendar */}
      <div className="max-w-6xl mx-auto">
        <ModernCard className="p-3 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border-amber-200/50 dark:border-amber-700/50" gradient>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Activity Calendar</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigateMonth('prev')}
                  variant="outline"
                  size="sm"
                  className="p-1 h-7 w-7"
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[100px] text-center">
                  {monthNames[selectedMonth]} {selectedYear}
                </span>
                <Button
                  onClick={() => navigateMonth('next')}
                  variant="outline"
                  size="sm"
                  className="p-1 h-7 w-7"
                  disabled={selectedYear === new Date().getFullYear() && selectedMonth >= new Date().getMonth()}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Horizontal Scrollable Calendar */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-fit pb-2">
              {monthDays.map((dayData) => {
                const spiritualLevel = getSpiritualLevel(dayData.count);
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                
                return (
                  <div
                    key={dayData.date}
                    className="flex flex-col items-center min-w-[40px]"
                  >
                    {/* Day of week */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 h-4">
                      {dayNames[dayData.dayOfWeek]}
                    </div>
                    
                    {/* Date box */}
                    <div
                      className={`w-8 h-8 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-amber-400 relative flex items-center justify-center text-xs ${
                        getActivityLevel(dayData.count)
                      } ${dayData.isToday ? 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900' : ''}`}
                      onMouseEnter={(e) => {
                        setHoveredDay({ date: dayData.date, count: dayData.count });
                        handleMouseMove(e);
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      {dayData.count > 0 && spiritualLevel.icon ? (
                        <span className="filter drop-shadow-sm text-xs absolute">
                          {spiritualLevel.icon}
                        </span>
                      ) : (
                        dayData.count > 0 && (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full absolute"></div>
                        )
                      )}
                      <span className={`text-xs font-medium ${dayData.isToday ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'} ${dayData.count > 0 ? 'mt-2' : ''}`}>
                        {dayData.day}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ModernCard>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-200/50 dark:border-amber-700/50 rounded-lg px-3 py-2 text-sm pointer-events-none shadow-xl"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 50,
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
          <div className="text-amber-600 dark:text-amber-400">
            {hoveredDay.count} jaaps completed
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">
            {getSpiritualLevel(hoveredDay.count).name} level
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveDaysPage;
