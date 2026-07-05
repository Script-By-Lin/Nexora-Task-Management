'use client';

import React from 'react';

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

interface TaskListProps {
  tasks: Task[];
  selectedDate: string;
  currentView: 'today' | 'all' | 'calendar';
  onToggleComplete: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onOpenForm: () => void;
}

export default function TaskList({
  tasks,
  selectedDate,
  currentView,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onOpenForm,
}: TaskListProps) {
  // Helper to format the header date
  const formatHeaderDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const today = new Date();

    const isToday =
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();

    if (isToday) return 'Today';

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow =
      dateObj.getDate() === tomorrow.getDate() &&
      dateObj.getMonth() === tomorrow.getMonth() &&
      dateObj.getFullYear() === tomorrow.getFullYear();

    if (isTomorrow) return 'Tomorrow';

    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Helper to format due time (convert 24h to 12h)
  const formatTime12h = (time24?: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // Format start time and end time range
  const formatTimeRange = (time24?: string, endTime24?: string) => {
    if (!time24 && !endTime24) return '';
    if (time24 && endTime24) {
      return `${formatTime12h(time24)} – ${formatTime12h(endTime24)}`;
    }
    if (time24) {
      return formatTime12h(time24);
    }
    return `Until ${formatTime12h(endTime24)}`;
  };

  // Format single task date badge (for 'All Tasks' view)
  const formatTaskDateBadge = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Sorting logic:
  // 1. Uncompleted tasks first, then completed.
  // 2. Sort by time if specified.
  // 3. Sort by priority (high > medium > low).
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Sort by time
    if (a.time && b.time) {
      const timeCompare = a.time.localeCompare(b.time);
      if (timeCompare !== 0) return timeCompare;
      
      // If start times are identical, sort by end time
      if (a.endTime && b.endTime) {
        return a.endTime.localeCompare(b.endTime);
      }
      if (a.endTime) return -1;
      if (b.endTime) return 1;
      return 0;
    }
    if (a.time) return -1;
    if (b.time) return 1;

    // Sort by priority
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    return priorityWeights[b.priority] - priorityWeights[a.priority];
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const getHeaderTitle = () => {
    if (currentView === 'all') return 'All Active Planner Tasks';
    if (currentView === 'today') return "Today's Agenda";
    return `Schedule for ${formatHeaderDate(selectedDate)}`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {getHeaderTitle()}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.length === 0 ? (
              'No tasks scheduled'
            ) : (
              <>
                <span className="font-semibold text-foreground">{pendingCount}</span> pending,{' '}
                <span className="font-semibold text-primary">{completedCount}</span> completed
              </>
            )}
          </p>
        </div>

        <button
          onClick={onOpenForm}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/10 hover:opacity-95 transition-all scale-100 hover:scale-[1.02] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Task</span>
        </button>
      </div>

      {/* Task Cards Grid/List */}
      {sortedTasks.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border border-dashed text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted/40 dark:bg-muted/10 flex items-center justify-center text-muted-foreground/60 mb-5">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">No tasks match your selection</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Tap the button above to add a new task or modify your calendar selectors to find other lists.
          </p>
        </div>
      ) : (
        /* Task Cards Container */
        <div className="flex flex-col gap-3">
          {sortedTasks.map((task) => {
            const priorityBorderStyles = {
              high: 'border-l-4 border-l-[#C85A53] bg-[#FAF0EE]/30 hover:bg-[#FAF0EE]/60 dark:border-l-[#E07A72] dark:bg-[#2A1615]/20 dark:hover:bg-[#2A1615]/30 border-border',
              medium: 'border-l-4 border-l-[#C59248] bg-[#FAF6EE]/30 hover:bg-[#FAF6EE]/60 dark:border-l-[#E5AF65] dark:bg-[#281D10]/20 dark:hover:bg-[#281D10]/30 border-border',
              low: 'border-l-4 border-l-[#76906E] bg-[#F1F5EE]/30 hover:bg-[#F1F5EE]/60 dark:border-l-[#98B58F] dark:bg-[#151E14]/20 dark:hover:bg-[#151E14]/30 border-border',
            };

            const priorityBadgeStyles = {
              high: 'bg-[#FAF0EE] text-[#9E2C25] dark:bg-[#2A1615] dark:text-[#FCA59E]',
              medium: 'bg-[#FAF6EE] text-[#96671D] dark:bg-[#281D10] dark:text-[#FCDAA2]',
              low: 'bg-[#F1F5EE] text-[#4D6446] dark:bg-[#151E14] dark:text-[#C9DEC4]',
            };

            return (
              <div
                key={task.id}
                className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                  task.completed ? 'opacity-55 scale-[0.99] hover:opacity-75' : ''
                } ${priorityBorderStyles[task.priority]}`}
              >
                {/* Left side: Checkbox + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => onToggleComplete(task.id)}
                    className={`mt-1.5 flex items-center justify-center w-5.5 h-5.5 rounded-full border transition-all duration-300 cursor-pointer shrink-0 ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                        : 'border-muted-foreground/30 hover:border-primary bg-card text-transparent'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  {/* Task details */}
                  <div className="flex flex-col min-w-0 pr-2">
                    <h4
                      className={`text-base font-semibold leading-snug break-words text-foreground transition-all duration-200 ${
                        task.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p
                        className={`text-sm text-muted-foreground mt-1 whitespace-pre-line leading-relaxed break-words ${
                          task.completed ? 'line-through opacity-80' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {/* Priority Badge */}
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${priorityBadgeStyles[task.priority]}`}>
                        {task.priority}
                      </span>

                      {/* Time Badge */}
                      {(task.time || task.endTime) && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 dark:bg-muted/20 px-2 py-0.5 rounded-md border border-border/20">
                          <svg className="w-3.5 h-3.5 text-muted-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatTimeRange(task.time, task.endTime)}</span>
                        </span>
                      )}

                      {/* Date Badge (Show on 'All Tasks' view) */}
                      {currentView === 'all' && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 dark:bg-muted/20 px-2 py-0.5 rounded-md border border-border/20">
                          <svg className="w-3.5 h-3.5 text-muted-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formatTaskDateBadge(task.date)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex items-center gap-1 shrink-0 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
