'use client';

import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  endTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface TimeAnalyticsProps {
  tasks: Task[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export default function TimeAnalytics({
  tasks,
  selectedDate,
  onSelectDate,
}: TimeAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');
  const [expandedBusiestDay, setExpandedBusiestDay] = useState<string | null>(null);

  // Convert "HH:MM" to minutes since midnight
  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Convert minutes since midnight to 12h time string
  const minutesTo12h = (m: number): string => {
    const hrs = Math.floor(m / 60) % 24;
    const mins = m % 60;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const h12 = hrs % 12 || 12;
    return `${h12}:${String(mins).padStart(2, '0')} ${ampm}`;
  };

  // Format total minutes to readable hours/minutes
  const formatDuration = (totalMins: number): string => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  // Merge overlapping busy time slots
  const mergeTimeSlots = (slots: [number, number][]): [number, number][] => {
    if (slots.length === 0) return [];
    // Sort slots by start time
    const sorted = [...slots].sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const curr = sorted[i];

      if (curr[0] <= last[1]) {
        // Overlap: merge by setting end time to the max of both
        last[1] = Math.max(last[1], curr[1]);
      } else {
        // Gap: push new slot
        merged.push(curr);
      }
    }
    return merged;
  };

  // Extract raw busy slots for a specific date (clipped to awake hours 7:30 AM to 12 AM / 450 to 1440 minutes)
  const getBusySlotsForDate = (dateStr: string): [number, number][] => {
    const dayTasks = tasks.filter((t) => t.date === dateStr);
    const slots: [number, number][] = [];

    dayTasks.forEach((task) => {
      if (task.time) {
        const start = timeToMinutes(task.time);
        // If there's an endTime, use it. Otherwise, assume a 60-minute duration.
        const end = task.endTime ? timeToMinutes(task.endTime) : start + 60;
        
        // Clip to awake window [450, 1440] (exclude sleep time 12 AM to 7:30 AM)
        const clippedStart = Math.max(start, 450);
        const clippedEnd = Math.max(Math.min(end, 1440), 450);
        
        if (clippedStart < clippedEnd) {
          slots.push([clippedStart, clippedEnd]);
        }
      }
    });

    return slots;
  };

  // Get Day Analytics
  const getDayAnalytics = (dateStr: string) => {
    const rawSlots = getBusySlotsForDate(dateStr);
    const mergedSlots = mergeTimeSlots(rawSlots);

    // Sum up total busy duration
    let busyMinutes = 0;
    mergedSlots.forEach(([start, end]) => {
      busyMinutes += end - start;
    });

    const totalAwakeMins = 990; // 1440 - 450
    const freeMinutes = totalAwakeMins - busyMinutes;

    // Calculate free time slots
    const freeSlots: [number, number][] = [];
    if (mergedSlots.length === 0) {
      freeSlots.push([450, 1440]);
    } else {
      // Check from awake start (7:30 AM / 450) to first task
      if (mergedSlots[0][0] > 450) {
        freeSlots.push([450, mergedSlots[0][0]]);
      }
      // Check gaps between tasks
      for (let i = 0; i < mergedSlots.length - 1; i++) {
        const endOfCurrent = mergedSlots[i][1];
        const startOfNext = mergedSlots[i + 1][0];
        if (startOfNext > endOfCurrent) {
          freeSlots.push([endOfCurrent, startOfNext]);
        }
      }
      // Check from last task to end of day (12 AM / 1440)
      const lastSlot = mergedSlots[mergedSlots.length - 1];
      if (lastSlot[1] < 1440) {
        freeSlots.push([lastSlot[1], 1440]);
      }
    }

    const formattedFreeSlots = freeSlots.map(([start, end]) => {
      return `${minutesTo12h(start)} – ${minutesTo12h(end)}`;
    });

    return {
      busyMinutes,
      freeMinutes,
      busyPercentage: Math.round((busyMinutes / totalAwakeMins) * 100),
      freeSlots: formattedFreeSlots,
      tasksWithTimes: tasks
        .filter((t) => t.date === dateStr && t.time)
        .sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    };
  };

  // Get week date strings
  const getWeekRange = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    // Monday as start of week. If Sunday, go back 6 days, otherwise align to Monday.
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dateObj.setDate(diff));

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const temp = new Date(monday);
      temp.setDate(monday.getDate() + i);
      const yyyy = temp.getFullYear();
      const mm = String(temp.getMonth() + 1).padStart(2, '0');
      const dd = String(temp.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  // Get Week Analytics
  const getWeekAnalytics = (dateStr: string) => {
    const weekDates = getWeekRange(dateStr);
    let totalBusyMins = 0;
    const dailyMinutes = weekDates.map((date) => {
      const raw = getBusySlotsForDate(date);
      const merged = mergeTimeSlots(raw);
      let dayBusy = 0;
      merged.forEach(([start, end]) => (dayBusy += end - start));
      totalBusyMins += dayBusy;
      return dayBusy;
    });

    const totalMinutesInWeek = 7 * 990; // 6,930 mins (excluding sleep time)
    const freeMinutes = totalMinutesInWeek - totalBusyMins;

    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const barData = weekdayNames.map((name, idx) => {
      const busy = dailyMinutes[idx];
      const percent = Math.min(Math.round((busy / 990) * 100), 100);
      return {
        name,
        date: weekDates[idx],
        busyMins: busy,
        percent,
      };
    });

    return {
      totalBusyMins,
      freeMinutes,
      busyPercentage: Math.round((totalBusyMins / totalMinutesInWeek) * 100),
      barData,
      weekStart: weekDates[0],
      weekEnd: weekDates[6],
    };
  };

  // Get Month Analytics
  const getMonthAnalytics = (dateStr: string) => {
    const [y, m] = dateStr.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    let totalBusyMins = 0;
    const dates: string[] = [];
    const busyByDay: { date: string; mins: number }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      dates.push(date);
      
      const raw = getBusySlotsForDate(date);
      const merged = mergeTimeSlots(raw);
      let dayBusy = 0;
      merged.forEach(([start, end]) => (dayBusy += end - start));
      totalBusyMins += dayBusy;
      
      if (dayBusy > 0) {
        busyByDay.push({ date, mins: dayBusy });
      }
    }

    const totalMinutesInMonth = daysInMonth * 990; // excluding sleep time
    const freeMinutes = totalMinutesInMonth - totalBusyMins;

    // Busiest days sorted descending
    const busiestDays = [...busyByDay]
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 3)
      .map((d) => {
        const [, month, day] = d.date.split('-').map(Number);
        const dateObj = new Date(y, month - 1, day);
        const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
          label: dayLabel,
          date: d.date,
          duration: formatDuration(d.mins),
        };
      });

    return {
      totalBusyMins,
      freeMinutes,
      busyPercentage: Math.round((totalBusyMins / totalMinutesInMonth) * 100),
      averageDailyMins: Math.round(totalBusyMins / daysInMonth),
      busiestDays,
      daysInMonth,
      monthName: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  };

  // Active dataset based on tab selection
  const dayData = getDayAnalytics(selectedDate);
  const weekData = getWeekAnalytics(selectedDate);
  const monthData = getMonthAnalytics(selectedDate);

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatWeekLabel = (startStr: string, endStr: string) => {
    const [, sm, sd] = startStr.split('-').map(Number);
    const [, em, ed] = endStr.split('-').map(Number);
    
    const startObj = new Date(2026, sm - 1, sd);
    const endObj = new Date(2026, em - 1, ed);

    const startLabel = startObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endLabel = endObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${startLabel} – ${endLabel}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Time allocation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect busy vs. free time windows to organize your day.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1.5 p-1 bg-muted/40 dark:bg-muted/15 border border-border/40 rounded-xl max-w-xs">
        {(['day', 'week', 'month'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 px-3.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-card text-foreground shadow-sm font-bold border border-border/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Grid: Card & Data */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Side: Summary Ring Card */}
        <div className="md:col-span-5 bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {activeTab === 'day' && 'Daily allocation'}
            {activeTab === 'week' && 'Weekly allocation'}
            {activeTab === 'month' && 'Monthly allocation'}
          </span>
          <h3 className="text-base font-semibold text-foreground mb-6">
            {activeTab === 'day' && formatDateLabel(selectedDate)}
            {activeTab === 'week' && formatWeekLabel(weekData.weekStart, weekData.weekEnd)}
            {activeTab === 'month' && monthData.monthName}
          </h3>

          {/* SVG Circular Progress Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="72"
                strokeWidth="10"
                stroke="currentColor"
                className="text-muted/30 dark:text-muted/10"
                fill="transparent"
              />
              {/* Progress Circle (Busy Time) */}
              <circle
                cx="88"
                cy="88"
                r="72"
                strokeWidth="10"
                strokeDasharray={452.4}
                strokeDashoffset={
                  452.4 -
                  (452.4 *
                    (activeTab === 'day'
                      ? dayData.busyPercentage
                      : activeTab === 'week'
                      ? weekData.busyPercentage
                      : monthData.busyPercentage)) /
                    100
                }
                strokeLinecap="round"
                stroke="currentColor"
                className="text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                fill="transparent"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {activeTab === 'day' && `${dayData.busyPercentage}%`}
                {activeTab === 'week' && `${weekData.busyPercentage}%`}
                {activeTab === 'month' && `${monthData.busyPercentage}%`}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                Busy
              </span>
            </div>
          </div>

          {/* Allocation Legends */}
          <div className="grid grid-cols-2 gap-4 mt-8 w-full border-t border-border/40 pt-5">
            <div className="flex flex-col items-center border-r border-border/40">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/20" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Busy</span>
              </div>
              <span className="text-lg font-extrabold text-foreground">
                {activeTab === 'day' && formatDuration(dayData.busyMinutes)}
                {activeTab === 'week' && formatDuration(weekData.totalBusyMins)}
                {activeTab === 'month' && formatDuration(monthData.totalBusyMins)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Free</span>
              </div>
              <span className="text-lg font-extrabold text-foreground">
                {activeTab === 'day' && formatDuration(dayData.freeMinutes)}
                {activeTab === 'week' && formatDuration(weekData.freeMinutes)}
                {activeTab === 'month' && formatDuration(monthData.freeMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab-Specific Details */}
        <div className="md:col-span-7 bg-card border border-border p-6 rounded-2xl shadow-sm min-h-[380px] flex flex-col justify-between">
          {activeTab === 'day' && (
            <div className="flex flex-col gap-5 h-full">
              {/* Free Slots section */}
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
                  Free time slots today
                </h4>
                {dayData.freeSlots.length === 0 ? (
                  <p className="text-sm text-rose-500/80 dark:text-rose-400 font-semibold bg-rose-500/5 px-4 py-2.5 rounded-xl border border-rose-500/10">
                    No free slots available today. Your schedule is fully booked!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {dayData.freeSlots.map((slot, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/10 rounded-xl shadow-sm flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
                      >
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {slot}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Busy Slots section */}
              <div className="border-t border-border/40 pt-4 mt-1 flex-1">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
                  Scheduled Tasks ({dayData.tasksWithTimes.length})
                </h4>
                {dayData.tasksWithTimes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-3">
                    No tasks with times scheduled on this day.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {dayData.tasksWithTimes.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onSelectDate(task.date)}
                        className="flex items-center justify-between p-3.5 bg-muted/30 dark:bg-muted/10 border border-border/50 hover:border-cyan-500/50 rounded-xl transition-all cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20"
                      >
                        <div className="flex flex-col min-w-0 pr-3">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5 capitalize flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            {task.priority} priority
                          </span>
                        </div>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/10 shrink-0">
                          {task.time ? (task.endTime ? `${minutesTo12h(timeToMinutes(task.time))} – ${minutesTo12h(timeToMinutes(task.endTime))}` : minutesTo12h(timeToMinutes(task.time))) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'week' && (
            <div className="flex flex-col gap-6 h-full justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  Weekly busy overview
                </h4>
                {/* Visual Bar Chart */}
                <div className="flex items-end justify-between h-44 border-b border-border/60 pb-2.5 px-2 mt-4 gap-2">
                  {weekData.barData.map((day, idx) => {
                    const isSelectedDay = day.date === selectedDate;
                    return (
                      <div key={idx} className="relative flex-1 flex flex-col items-center group">
                        {/* Tooltip */}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-950 text-white text-[9px] font-semibold py-1 px-1.5 rounded-md absolute -translate-y-8 pointer-events-none border border-slate-800">
                          {formatDuration(day.busyMins)}
                        </span>
                        
                        {/* Bar */}
                        <button
                          onClick={() => {
                            onSelectDate(day.date);
                            setActiveTab('day');
                          }}
                          className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 relative cursor-pointer ${
                            day.percent === 0
                              ? 'bg-muted/30 border border-border/20 h-1.5'
                              : isSelectedDay
                              ? 'bg-cyan-500 dark:bg-cyan-400 shadow-md shadow-cyan-500/30 border border-cyan-400/20'
                              : 'bg-muted-foreground/35 hover:bg-cyan-500/80'
                          }`}
                          style={{
                            height: day.percent > 0 ? `${Math.max(day.percent, 8)}%` : '6px',
                          }}
                          title={`${day.name}: ${formatDuration(day.busyMins)}`}
                        />
                        {/* Label */}
                        <span className={`text-[10px] font-bold mt-2.5 ${isSelectedDay ? 'text-cyan-500 font-extrabold' : 'text-muted-foreground'}`}>
                          {day.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-muted/30 dark:bg-muted/10 border border-border/50 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interactive Chart: Click any weekday bar above to adjust your calendar and focus on that day's tasks.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'month' && (
            <div className="flex flex-col gap-5 h-full justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
                  Monthly allocation insights
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Daily Average card */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/40 p-4 rounded-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Daily Average Busy
                    </span>
                    <h5 className="text-xl font-extrabold text-foreground mt-1">
                      {formatDuration(monthData.averageDailyMins)}
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      average tasks block per day
                    </p>
                  </div>

                  {/* Total Days card */}
                  <div className="bg-muted/30 dark:bg-muted/10 border border-border/40 p-4 rounded-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Month Length
                    </span>
                    <h5 className="text-xl font-extrabold text-foreground mt-1">
                      {monthData.daysInMonth} Days
                    </h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      full month calculation
                    </p>
                  </div>
                </div>

                {/* Busiest Days list */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
                    Busiest Days This Month
                  </h4>
                  {monthData.busiestDays.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No tasks scheduled this month.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {monthData.busiestDays.map((day, idx) => {
                        const isExpanded = expandedBusiestDay === day.date;
                        const dayTasks = tasks
                          .filter((t) => t.date === day.date && t.time)
                          .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

                        return (
                          <div
                            key={idx}
                            className="flex flex-col bg-muted/20 dark:bg-muted/5 border border-border/50 rounded-xl overflow-hidden transition-all duration-200"
                          >
                            {/* Header / Clickable Toggle */}
                            <div
                              onClick={() => setExpandedBusiestDay(isExpanded ? null : day.date)}
                              className="flex items-center justify-between p-3.5 hover:border-cyan-500/30 cursor-pointer select-none transition-colors"
                            >
                              <span className="text-sm font-semibold text-foreground">
                                {day.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/10">
                                  {day.duration} busy
                                </span>
                                <svg
                                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-1.5 border-t border-border/20 bg-muted/10 dark:bg-muted/5 flex flex-col gap-2.5">
                                <h5 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                                  Scheduled Tasks ({dayTasks.length})
                                </h5>
                                {dayTasks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-1">
                                    No tasks with times scheduled.
                                  </p>
                                ) : (
                                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-1">
                                    {dayTasks.map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center justify-between p-2 bg-card border border-border/30 rounded-lg"
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <span className="text-xs font-semibold text-foreground truncate">
                                            {task.title}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground mt-0.5 capitalize flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                              task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            {task.priority} priority
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/10 shrink-0">
                                          {task.time ? (task.endTime ? `${minutesTo12h(timeToMinutes(task.time))} – ${minutesTo12h(timeToMinutes(task.endTime))}` : minutesTo12h(timeToMinutes(task.time))) : ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Link to Daily View */}
                                <button
                                  onClick={() => {
                                    onSelectDate(day.date);
                                    setActiveTab('day');
                                  }}
                                  className="mt-1.5 w-full py-1.5 px-3 text-center text-xs font-bold text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 hover:bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  View day allocation details
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 dark:bg-muted/10 border border-border/50 p-4 rounded-xl flex items-center gap-3 mt-4">
                <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tip: Busy time is calculated dynamically based on task start and end times. Fill out end times on tasks to refine your time allocations!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
