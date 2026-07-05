'use client';

import React, { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  tasks: Task[];
}

export default function Calendar({ selectedDate, onSelectDate, tasks }: CalendarProps) {
  // Parse initial state from selectedDate or fallback to current local time
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July is index 6 (0-based)

  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  }, [selectedDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar calculations
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevMonthCells = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      monthOffset: -1,
    });
  }

  const currentMonthCells = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthCells.push({
      day: i,
      isCurrentMonth: true,
      monthOffset: 0,
    });
  }

  const totalCellsSoFar = prevMonthCells.length + currentMonthCells.length;
  const nextMonthCellsNeeded = 42 - totalCellsSoFar; // Fixed 6-row calendar
  const nextMonthCells = [];
  for (let i = 1; i <= nextMonthCellsNeeded; i++) {
    nextMonthCells.push({
      day: i,
      isCurrentMonth: false,
      monthOffset: 1,
    });
  }

  const allCells = [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    setCurrentYear(todayYear);
    setCurrentMonth(todayMonth);
    const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onSelectDate(todayStr);
  };

  const getCellDateString = (day: number, monthOffset: number) => {
    let year = currentYear;
    let month = currentMonth + 1 + monthOffset;

    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="bg-card text-foreground rounded-2xl border border-border p-6 shadow-sm flex flex-col h-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Select a date to organize tasks</span>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/40 dark:bg-muted/10 p-1 rounded-xl border border-border/40">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold hover:bg-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Titles */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-bold text-muted-foreground py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[320px]">
        {allCells.map((cell, idx) => {
          const dateString = getCellDateString(cell.day, cell.monthOffset);
          const isSelected = selectedDate === dateString;
          const isToday = todayStr === dateString;
          const cellTasks = tasks.filter((t) => t.date === dateString);
          const pendingTasks = cellTasks.filter((t) => !t.completed);

          // Get counts of pending tasks by priority for this day
          const hasHigh = pendingTasks.some((t) => t.priority === 'high');
          const hasMedium = pendingTasks.some((t) => t.priority === 'medium');
          const hasLow = pendingTasks.some((t) => t.priority === 'low');
          const allCompleted = cellTasks.length > 0 && cellTasks.every((t) => t.completed);

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(dateString)}
              className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-sm font-medium transition-all group cursor-pointer aspect-square ${
                !cell.isCurrentMonth
                  ? 'text-muted-foreground/30 border-transparent bg-transparent hover:bg-muted/10'
                  : isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.03]'
                  : isToday
                  ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/20'
                  : 'bg-muted/20 dark:bg-muted/5 border-border/30 hover:border-border hover:bg-muted/50 dark:hover:bg-muted/20'
              }`}
            >
              {/* Day Number */}
              <span className={`text-sm ${isToday && !isSelected ? 'font-bold' : ''}`}>
                {cell.day}
              </span>

              {/* Task Indicators */}
              <div className="flex gap-1 justify-center mt-auto w-full h-1.5">
                {allCompleted ? (
                  <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground/60' : 'bg-muted-foreground/40'}`} />
                ) : (
                  <>
                    {hasHigh && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#C85A53] dark:bg-[#E07A72]'}`} />
                    )}
                    {hasMedium && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#C59248] dark:bg-[#E5AF65]'}`} />
                    )}
                    {hasLow && (
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#76906E] dark:bg-[#98B58F]'}`} />
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
