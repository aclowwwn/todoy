
import React, { useState, useEffect } from 'react';
import { ProjectManager } from './components/ProjectManager';
import { Calendar } from './components/Calendar';
import { DayView } from './components/DayView';
import { AIPlannerModal } from './components/AIPlannerModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { LandingPage } from './components/LandingPage';
import { Project, Task, User } from './types';
import { Calendar as CalendarIcon, Sparkles, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, setYear, setMonth } from 'date-fns';
import { api } from './services/api';

type ViewMode = 'month' | 'day';

const DEFAULT_PROJECT_BUCKETS: Project[] = [
  { id: 'proj-health', name: 'Health/Fitness', color: '#34d399' },
  { id: 'proj-career', name: 'Career', color: '#a855f7' },
  { id: 'proj-finance', name: 'Finance', color: '#f43f5e' },
  { id: 'proj-appearance', name: 'Physical Appearance', color: '#6366f1' },
  { id: 'proj-family', name: 'Family', color: '#3b82f6' },
  { id: 'proj-social', name: 'Social Life', color: '#f59e0b' },
  { id: 'proj-growth', name: 'Spirituality/Growth', color: '#8b5cf6' },
  { id: 'proj-rr', name: 'Rest & Recreation', color: '#ec4899' },
];

const SEED_TASKS_FEB_11: Partial<Task>[] = [
  { 
    id: 't1', projectId: 'proj-health', title: 'Stretches & Light Workout', date: '2026-02-11', startTime: '13:00', endTime: '13:30', 
    description: 'Morning stretches and quick cardio.',
    checklist: [
      { id: 'cl1', text: 'Neck and shoulder rolls', completed: false },
      { id: 'cl2', text: '5-minute core activation', completed: false },
      { id: 'cl3', text: 'Full body stretch', completed: false }
    ]
  },
  { 
    id: 't2', projectId: 'proj-growth', title: 'Read & Pray', date: '2026-02-11', startTime: '13:30', endTime: '14:00', 
    description: 'Personal spiritual time.',
    checklist: [
      { id: 'cl4', text: 'Daily devotional reading', completed: false },
      { id: 'cl5', text: 'Intercessory prayer', completed: false },
      { id: 'cl6', text: 'Gratitude journaling', completed: false }
    ]
  },
  { 
    id: 't3', projectId: 'proj-appearance', title: 'Morning Routine & Styling', date: '2026-02-11', startTime: '14:00', endTime: '14:30', 
    description: 'Getting ready and styling hair.',
    checklist: [
      { id: 'cl7', text: 'Skincare routine', completed: false },
      { id: 'cl8', text: 'Style hair (waves/updo)', completed: false },
      { id: 'cl9', text: 'Select jewelry', completed: false }
    ]
  },
  { 
    id: 't4', projectId: 'proj-career', title: 'SAHM Duties & Chores', date: '2026-02-11', startTime: '14:30', endTime: '15:15', 
    description: 'House chores and organizational tasks.',
    checklist: [
      { id: 'cl10', text: 'Load/Unload dishwasher', completed: false },
      { id: 'cl11', text: 'Tidy living room', completed: false },
      { id: 'cl12', text: 'Fold one load of laundry', completed: false }
    ]
  },
  { 
    id: 't5', projectId: 'proj-finance', title: 'Budget & Bills', date: '2026-02-11', startTime: '15:15', endTime: '15:45', 
    description: 'Reviewing monthly budget and paying bills.',
    checklist: [
      { id: 'cl13', text: 'Review bank transactions', completed: false },
      { id: 'cl14', text: 'Pay utility bills', completed: false },
      { id: 'cl15', text: 'Update savings goal tracker', completed: false }
    ]
  },
  { 
    id: 't6', projectId: 'proj-career', title: 'Social Media Management', date: '2026-02-11', startTime: '15:45', endTime: '16:15', 
    description: 'Posting and engagement.',
    checklist: [
      { id: 'cl16', text: 'Draft new post caption', completed: false },
      { id: 'cl17', text: 'Reply to comments', completed: false },
      { id: 'cl18', text: 'Schedule tomorrow\'s post', completed: false }
    ]
  },
  { 
    id: 't7', projectId: 'proj-rr', title: 'Practice Songs', date: '2026-02-11', startTime: '16:15', endTime: '16:45', 
    description: 'Vocal/instrumental practice.',
    checklist: [
      { id: 'cl19', text: 'Vocal warmups', completed: false },
      { id: 'cl20', text: 'Practice new melody', completed: false },
      { id: 'cl21', text: 'Record a practice clip', completed: false }
    ]
  },
  { 
    id: 't8', projectId: 'proj-growth', title: 'Study Preparation', date: '2026-02-11', startTime: '16:45', endTime: '17:15', 
    description: 'Preparing notes for the Doxologia session.',
    checklist: [
      { id: 'cl22', text: 'Review last week\'s notes', completed: false },
      { id: 'cl23', text: 'Highlight key passages', completed: false },
      { id: 'cl24', text: 'Prepare 2 discussion questions', completed: false }
    ]
  },
  { 
    id: 't9', projectId: 'proj-appearance', title: 'Prep for Study & Mirror Selfie', date: '2026-02-11', startTime: '17:15', endTime: '17:40', 
    description: 'Final touches and OOTD photo.',
    checklist: [
      { id: 'cl25', text: 'Refresh makeup', completed: false },
      { id: 'cl26', text: 'Check lighting for study call', completed: false },
      { id: 'cl27', text: 'Take mirror selfie (OOTD)', completed: false }
    ]
  },
  { 
    id: 't10', projectId: 'proj-family', title: 'Play with the Boys', date: '2026-02-11', startTime: '17:40', endTime: '18:00', 
    description: 'Undivided attention for the kids.',
    checklist: [
      { id: 'cl28', text: 'Build a block tower', completed: false },
      { id: 'cl29', text: 'Read a picture book', completed: false }
    ]
  },
  { 
    id: 't11', projectId: 'proj-family', title: 'Dinner & Bedtime', date: '2026-02-11', startTime: '18:00', endTime: '19:00', 
    description: 'Family dinner and putting the boys to sleep.',
    checklist: [
      { id: 'cl30', text: 'Prepare balanced dinner', completed: false },
      { id: 'cl31', text: 'Bath time for boys', completed: false },
      { id: 'cl32', text: 'Bedtime story & prayer', completed: false }
    ]
  },
  { 
    id: 't12', projectId: 'proj-social', title: 'Study Night: Doxologia', date: '2026-02-11', startTime: '19:00', endTime: '22:00', 
    description: 'Evening social study group.',
    checklist: [
      { id: 'cl33', text: 'Log into group session', completed: false },
      { id: 'cl34', text: 'Participate in discussion', completed: false },
      { id: 'cl35', text: 'Note down action items', completed: false }
    ]
  },
];

const App: React.FC = () => {
  // --- State ---
  const [showLanding, setShowLanding] = useState(true);
  const [user, setUser] = useState<User | null>({
    id: 'default-user',
    email: 'family@example.com',
    name: 'Family Planner'
  });
  
  const [currentDate, setCurrentDate] = useState(() => {
    // Start the calendar in February 2026
    let d = new Date();
    d = setYear(d, 2026);
    d = setMonth(d, 1); // 1 is February (0-indexed)
    return d;
  });

  const [view, setView] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 1, 11));
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- Data Loading & Seeding ---
  useEffect(() => {
    if (showLanding || !user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        let loadedProjects = await api.getProjects();
        let loadedTasks = await api.getTasks();

        // Seed default buckets if no projects exist
        if (loadedProjects.length === 0) {
          for (const bucket of DEFAULT_PROJECT_BUCKETS) {
            await api.createProject(bucket);
          }
          loadedProjects = DEFAULT_PROJECT_BUCKETS;
        }

        // Seed Feb 11 tasks if task list is empty
        if (loadedTasks.length === 0) {
          const newTasks: Task[] = SEED_TASKS_FEB_11.map(t => ({
            ...t,
            completed: false,
            checklist: t.checklist || [],
            contentIdeas: t.contentIdeas || []
          } as Task));
          
          for (const t of newTasks) {
            await api.createTask(t);
          }
          loadedTasks = newTasks;
        }

        setProjects(loadedProjects);
        setTasks(loadedTasks);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showLanding, user]);

  const handleClearData = () => {
    if (confirm("This will clear all your locally saved projects and tasks. Are you sure?")) {
      localStorage.removeItem('familyPlanner_projects');
      localStorage.removeItem('familyPlanner_events');
      setProjects([]);
      setTasks([]);
      window.location.reload();
    }
  };

  // --- Handlers ---
  
  const handleAddTasks = async (newTasks: Task[]) => {
    setTasks(prev => [...prev, ...newTasks]);
    for (const task of newTasks) {
      await api.createTask(task);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(prev => prev.map(e => e.id === updatedTask.id ? updatedTask : e));
    if (selectedTask && selectedTask.id === updatedTask.id) {
       setSelectedTask(updatedTask);
    }
    await api.updateTask(updatedTask);
  };

  const handleMoveTask = async (task: Task, newDate: Date) => {
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    if (task.date === newDateStr) return;
    
    const updatedTask = { ...task, date: newDateStr };
    handleUpdateTask(updatedTask);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(e => e.id !== taskId));
    setSelectedTask(null);
    await api.deleteTask(taskId);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setView('day');
  };

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  const currentProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : undefined;

  // --- Render ---

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">Family Planner 2026</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">
                  {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(selectedDate, 'PPP')}
                </p>
              </div>
            </div>
            
            {view === 'month' && (
              <div className="hidden md:flex items-center bg-slate-100 rounded-lg p-1 mx-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 text-sm font-bold text-slate-700 min-w-[140px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
                <button onClick={nextMonth} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>
              <button
                onClick={handleClearData}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Clear all data"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-3 space-y-6 hidden lg:block">
              <ProjectManager 
                projects={projects} 
                setProjects={setProjects} 
              />
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Project Progress</h3>
                <div className="space-y-4">
                  {projects.map(p => {
                    const pTasks = tasks.filter(e => e.projectId === p.id);
                    const total = pTasks.length;
                    
                    if (total === 0) return null;

                    let totalCompletionScore = 0;
                    
                    pTasks.forEach(e => {
                      if (e.completed) {
                        totalCompletionScore += 1;
                      } else if (e.checklist && e.checklist.length > 0) {
                        const checked = e.checklist.filter(i => i.completed).length;
                        totalCompletionScore += (checked / e.checklist.length);
                      }
                    });

                    const percent = Math.round((totalCompletionScore / total) * 100);
                    const displayPercent = Math.min(100, Math.max(0, percent));

                    return (
                      <div key={p.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-600">{p.name}</span>
                          <span className="text-slate-400">{displayPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${displayPercent}%`, backgroundColor: p.color }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                  {tasks.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No tasks scheduled yet.</p>}
                </div>
              </div>
            </div>

            <div className="lg:col-span-9 h-[calc(100vh-8rem)]">
              {view === 'month' ? (
                <div className="h-full flex flex-col gap-4">
                   <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                      <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={20}/></button>
                      <span className="font-bold">{format(currentDate, 'MMMM yyyy')}</span>
                      <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronRight size={20}/></button>
                   </div>
                  <Calendar 
                    currentDate={currentDate}
                    projects={projects}
                    tasks={tasks}
                    onTaskClick={setSelectedTask}
                    onDayClick={handleDayClick}
                    onTaskMove={handleMoveTask}
                  />
                </div>
              ) : (
                <DayView
                  date={selectedDate}
                  projects={projects}
                  tasks={tasks}
                  onBack={() => setView('month')}
                  onTaskClick={setSelectedTask}
                  onUpdateTask={handleUpdateTask}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <AIPlannerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        projects={projects}
        onAddTasks={handleAddTasks}
        activeMonth={currentDate}
      />

      <TaskDetailModal
        task={selectedTask}
        project={currentProject}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default App;
