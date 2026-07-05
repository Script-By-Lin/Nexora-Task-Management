'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  endTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  recurrenceGroupId?: string;
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    title: string;
    description: string;
    date: string;
    time?: string;
    endTime?: string;
    priority: 'low' | 'medium' | 'high';
    repeat?: {
      endDate: string;
      days: number[];
    };
  }) => void;
  taskToEdit?: Task | null;
  defaultDate: string; // YYYY-MM-DD
}

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
  defaultDate,
}: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Recurrence states
  const [isRecurring, setIsRecurring] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on open or change of taskToEdit
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setDate(taskToEdit.date);
        setTime(taskToEdit.time || '');
        setEndTime(taskToEdit.endTime || '');
        setPriority(taskToEdit.priority);
        setIsRecurring(false);
        setEndDate(taskToEdit.date);
        setRepeatDays([]);
      } else {
        setTitle('');
        setDescription('');
        const initialDate = defaultDate || new Date().toISOString().split('T')[0];
        setDate(initialDate);
        setTime('');
        setEndTime('');
        setPriority('medium');
        setIsRecurring(false);
        setEndDate(initialDate);
        
        const d = new Date(initialDate + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          setRepeatDays([d.getDay()]);
        } else {
          setRepeatDays([1]); // default to Monday
        }
      }

      // Auto-focus title field
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, taskToEdit, defaultDate]);

  // Sync repeatDays with selected start date if it changes
  useEffect(() => {
    if (date && !taskToEdit) {
      const d = new Date(date + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        const day = d.getDay();
        setRepeatDays([day]);
        setEndDate(prev => (prev < date ? date : prev));
      }
    }
  }, [date, taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || undefined,
      endTime: endTime || undefined,
      priority,
      ...(isRecurring && !taskToEdit ? {
        repeat: {
          endDate,
          days: repeatDays,
        }
      } : {})
    });
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="bg-card text-foreground rounded-2xl border border-border/80 shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20 shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {taskToEdit ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              ref={titleInputRef}
              type="text"
              required
              placeholder="e.g. Design Dashboard Prototypes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-description" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              placeholder="Add details, notes or action items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Date
            </label>
            <input
              id="task-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-time" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Start Time (Optional)
              </label>
              <input
                id="task-time"
                type="time"
                value={time}
                onChange={(e) => {
                  const val = e.target.value;
                  setTime(val);
                  if (!val) {
                    setEndTime('');
                  } else if (endTime && endTime < val) {
                    setEndTime(val);
                  }
                }}
                className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-endTime" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                End Time (Optional)
              </label>
              <input
                id="task-endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min={time || undefined}
                disabled={!time}
                className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Priority
            </span>
            <div className="grid grid-cols-3 gap-3">
              {/* Low */}
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 px-3 text-sm font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'low'
                    ? 'bg-[#F1F5EE] border-[#76906E] text-[#4D6446] dark:bg-[#151E14] dark:border-[#98B58F] dark:text-[#C9DEC4] font-bold scale-[1.02]'
                    : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Low
              </button>

              {/* Medium */}
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 px-3 text-sm font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-[#FAF6EE] border-[#C59248] text-[#96671D] dark:bg-[#281D10] dark:border-[#E5AF65] dark:text-[#FCDAA2] font-bold scale-[1.02]'
                    : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Medium
              </button>

              {/* High */}
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 px-3 text-sm font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'high'
                    ? 'bg-[#FAF0EE] border-[#C85A53] text-[#9E2C25] dark:bg-[#2A1615] dark:border-[#E07A72] dark:text-[#FCA59E] font-bold scale-[1.02]'
                    : 'border-border bg-muted/10 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Repeat Task Selection (only visible when creating new task) */}
          {!taskToEdit && (
            <div className="flex flex-col gap-4 border-t border-border/40 pt-4">
              <label className="flex items-center gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 border-border rounded-md cursor-pointer accent-primary focus:ring-0 focus:outline-none"
                />
                <span className="text-sm font-semibold text-foreground">Repeat this task</span>
              </label>

              {isRecurring && (
                <div className="flex flex-col gap-4 pl-8.5 animate-fade-in">
                  {/* Repeat End Date */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="repeat-end-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Repeat Until (End Date)
                    </label>
                    <input
                      id="repeat-end-date"
                      type="date"
                      required
                      min={date}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-muted/40 dark:bg-muted/10 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground cursor-pointer"
                    />
                  </div>

                  {/* Repeat Weekdays Selector */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Repeat on Days
                    </span>
                    <div className="flex gap-2 justify-between max-w-sm">
                      {daysOfWeek.map((label, idx) => {
                        const isActive = repeatDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleDay(idx)}
                            title={dayNames[idx]}
                            className={`w-9 h-9 text-xs font-bold rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-border/40 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || (isRecurring && repeatDays.length === 0)}
              className="px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-all shadow-md shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
