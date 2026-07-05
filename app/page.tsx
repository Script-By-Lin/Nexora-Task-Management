'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Calendar from '@/components/Calendar';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import TimeAnalytics from '@/components/TimeAnalytics';

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

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [currentView, setView] = useState<'today' | 'all' | 'calendar' | 'analytics'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Helper to get today's date in local YYYY-MM-DD
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Mount logic - read localStorage
  useEffect(() => {
    // 1. Theme initialization
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDarkMode(initialDark);

    // 2. Tasks initialization
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
      }
    }

    // 3. Set default selected date
    setSelectedDate(getTodayDateString());
    setHasMounted(true);

    // 4. Register service worker for PWA installability
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (reg) => console.log('ServiceWorker registration successful with scope: ', reg.scope),
        (err) => console.error('ServiceWorker registration failed: ', err)
      );
    }
  }, []);

  // Update theme class on HTML element
  useEffect(() => {
    if (!hasMounted) return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, hasMounted]);

  // Sync tasks to localStorage
  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('tasks', JSON.stringify(newTasks));
  };

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // CRUD handlers
  const handleAddTask = (
    taskData: Omit<Task, 'id' | 'completed'> & {
      repeat?: { endDate: string; days: number[] };
    }
  ) => {
    const { repeat, ...baseTaskData } = taskData;

    if (repeat) {
      const generatedTasks: Task[] = [];
      const recurrenceGroupId = Date.now().toString();
      
      const start = new Date(baseTaskData.date + 'T00:00:00');
      const end = new Date(repeat.endDate + 'T00:00:00');
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        const current = new Date(start);
        let index = 0;
        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (repeat.days.includes(dayOfWeek)) {
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            generatedTasks.push({
              ...baseTaskData,
              date: dateStr,
              id: `${recurrenceGroupId}-${index}`,
              completed: false,
              recurrenceGroupId,
            });
            index++;
          }
          current.setDate(current.getDate() + 1);
        }
      }
      
      if (generatedTasks.length > 0) {
        saveTasks([...generatedTasks, ...tasks]);
      } else {
        const newTask: Task = {
          ...baseTaskData,
          id: Date.now().toString(),
          completed: false,
        };
        saveTasks([newTask, ...tasks]);
      }
    } else {
      const newTask: Task = {
        ...baseTaskData,
        id: Date.now().toString(),
        completed: false,
      };
      saveTasks([newTask, ...tasks]);
    }
  };

  const handleEditTask = (taskData: Omit<Task, 'id' | 'completed'>) => {
    if (!editingTask) return;

    if (editingTask.recurrenceGroupId) {
      const updateSeries = window.confirm(
        'This is a recurring task.\n\nClick "OK" to update ALL instances in this series.\nClick "Cancel" to update THIS single instance only.'
      );
      if (updateSeries) {
        const updatedTasks = tasks.map((task) =>
          task.recurrenceGroupId === editingTask.recurrenceGroupId
            ? { ...task, ...taskData }
            : task
        );
        saveTasks(updatedTasks);
        setEditingTask(null);
        return;
      }
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id ? { ...task, ...taskData } : task
    );
    saveTasks(updatedTasks);
    setEditingTask(null);
  };

  const handleToggleComplete = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    saveTasks(updatedTasks);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    
    if (taskToDelete?.recurrenceGroupId) {
      const deleteSeries = window.confirm(
        'This is a recurring task.\n\nClick "OK" to delete ALL instances in this series.\nClick "Cancel" to delete THIS single instance only.'
      );
      if (deleteSeries) {
        const updatedTasks = tasks.filter(
          (t) => t.recurrenceGroupId !== taskToDelete.recurrenceGroupId
        );
        saveTasks(updatedTasks);
        return;
      }
    }

    const updatedTasks = tasks.filter((task) => task.id !== id);
    saveTasks(updatedTasks);
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleOpenNewTaskForm = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  // Navigation handlers
  const handleViewChange = (newView: 'today' | 'all' | 'calendar' | 'analytics') => {
    setView(newView);
    if (newView === 'today') {
      setSelectedDate(getTodayDateString());
    }
  };

  // Calculate filtered tasks for display
  const getFilteredTasks = () => {
    // 1. Filter by view type
    let viewFiltered = tasks;
    if (currentView === 'today') {
      const todayStr = getTodayDateString();
      viewFiltered = tasks.filter((t) => t.date === todayStr);
    } else if (currentView === 'calendar' || currentView === 'analytics') {
      viewFiltered = tasks.filter((t) => t.date === selectedDate);
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return viewFiltered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    return viewFiltered;
  };

  // Compute stats for navbar progress bar
  const getTaskStats = () => {
    // Stats are computed on search-filtered list or global list?
    // Let's compute stats on ALL tasks for today or all tasks globally based on view.
    // That gives the progress bar more semantic meaning (e.g. today's progress vs overall progress).
    let statsTasks = tasks;
    if (currentView === 'today') {
      const todayStr = getTodayDateString();
      statsTasks = tasks.filter((t) => t.date === todayStr);
    } else if (currentView === 'calendar' || currentView === 'analytics') {
      statsTasks = tasks.filter((t) => t.date === selectedDate);
    }

    const total = statsTasks.length;
    const completed = statsTasks.filter((t) => t.completed).length;
    const pending = total - completed;

    return { total, pending, completed };
  };

  // Prevent server-side hydration flash/mismatch
  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading Nexora...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = getFilteredTasks();
  const taskStats = getTaskStats();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground transition-all duration-300">
      {/* Navbar (Sidebar / Header) */}
      <Navbar
        currentView={currentView}
        setView={handleViewChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        taskStats={taskStats}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        {currentView === 'calendar' ? (
          /* Calendar View (Double column dashboard) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 h-full">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                tasks={tasks}
              />
            </div>
            <div className="lg:col-span-5 h-full bg-card rounded-2xl border border-border p-6 shadow-sm">
              <TaskList
                tasks={filteredTasks}
                selectedDate={selectedDate}
                currentView={currentView}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleStartEdit}
                onDeleteTask={handleDeleteTask}
                onOpenForm={handleOpenNewTaskForm}
              />
            </div>
          </div>
        ) : currentView === 'analytics' ? (
          /* Time Analytics View */
          <TimeAnalytics
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        ) : (
          /* List Views (Today & All Tasks - Centered dashboard container) */
          <div className="max-w-3xl mx-auto bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
            <TaskList
              tasks={filteredTasks}
              selectedDate={selectedDate}
              currentView={currentView}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleStartEdit}
              onDeleteTask={handleDeleteTask}
              onOpenForm={handleOpenNewTaskForm}
            />
          </div>
        )}
      </main>

      {/* Task Creation & Editing Modal Dialog */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={editingTask ? handleEditTask : handleAddTask}
        taskToEdit={editingTask}
        defaultDate={selectedDate}
      />
    </div>
  );
}
