
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, isSameDay, parse, isWithinInterval } from 'date-fns';
// Added Sparkles to the import list below
import { ArrowLeft, CheckSquare, Clock, Video, Image as ImageIcon, CircleDashed, List, LayoutGrid, ChevronRight, ChevronLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Project, Task } from '../types';

interface DayViewProps {
  date: Date;
  projects: Project[];
  tasks: Task[];
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

type DisplayMode = 'dial' | 'agenda';

export const DayView: React.FC<DayViewProps> = ({
  date,
  projects,
  tasks,
  onBack,
  onTaskClick,
  onUpdateTask,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayMode, setDisplayMode] = useState<DisplayMode>('dial');

  // --- Dragging State ---
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<{
    taskId: string;
    originalStartMin: number;
    duration: number;
    startAngle: number;
    isPm: boolean;
  } | null>(null);
  
  const [dragPreview, setDragPreview] = useState<{
    taskId: string;
    newStartTime: string;
    newEndTime: string;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filter tasks for this day
  const dayTasks = useMemo(() => {
    return tasks.filter(task => 
      isSameDay(parse(task.date, 'yyyy-MM-dd', new Date()), date)
    ).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, date]);

  // Handle default selection
  useEffect(() => {
    if (dragState) return;
    if (selectedTaskId && dayTasks.some(e => e.id === selectedTaskId)) return;

    const now = new Date();
    const isToday = isSameDay(date, now);
    
    if (isToday) {
      const current = dayTasks.find(e => {
        const start = parse(`${e.date} ${e.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const end = parse(`${e.date} ${e.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        return isWithinInterval(now, { start, end });
      });
      if (current) {
        setSelectedTaskId(current.id);
        return;
      }
    } else if (dayTasks.length > 0) {
      setSelectedTaskId(dayTasks[0].id);
    }
  }, [dayTasks, date, selectedTaskId, dragState]);

  const activeTaskData = useMemo(() => {
    const baseTask = dayTasks.find(e => e.id === selectedTaskId);
    if (!baseTask) return null;
    
    if (dragPreview && dragPreview.taskId === baseTask.id) {
      return {
        ...baseTask,
        startTime: dragPreview.newStartTime,
        endTime: dragPreview.newEndTime
      };
    }
    return baseTask;
  }, [dayTasks, selectedTaskId, dragPreview]);


  // --- SVG Math Helpers ---
  const VIEW_SIZE = 340;
  const CENTER = VIEW_SIZE / 2;
  const RADIUS_PM = 120; // Outer ring
  const RADIUS_AM = 80;  // Inner ring
  const STROKE_WIDTH_TRACK = 30; // Background track
  const STROKE_WIDTH_EVENT = 26; // Event stroke

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  const getAngleFromPoint = (x: number, y: number) => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  // --- Drag Handlers ---
  const handleMouseDown = (e: React.MouseEvent, taskId: string, isPm: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!svgRef.current) return;

    const task = dayTasks.find(ev => ev.id === taskId);
    if (!task) return;

    const [startH, startM] = task.startTime.split(':').map(Number);
    const [endH, endM] = task.endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    
    const rect = svgRef.current.getBoundingClientRect();
    const angle = getAngleFromPoint(e.clientX - rect.left, e.clientY - rect.top);

    setSelectedTaskId(taskId);
    setDragState({
      taskId,
      originalStartMin: startTotal,
      duration: endTotal - startTotal,
      startAngle: angle,
      isPm
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const currentAngle = getAngleFromPoint(e.clientX - rect.left, e.clientY - rect.top);
      
      let deltaAngle = currentAngle - dragState.startAngle;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      const deltaMinutes = Math.round(deltaAngle * 2);
      const snappedDelta = Math.round(deltaMinutes / 5) * 5;

      let newStartMin = dragState.originalStartMin + snappedDelta;
      
      if (!dragState.isPm) {
        newStartMin = Math.max(0, Math.min(719 - dragState.duration, newStartMin));
      } else {
        newStartMin = Math.max(720, Math.min(1440 - dragState.duration, newStartMin));
      }

      const newEndMin = newStartMin + dragState.duration;

      const formatTime = (totalMin: number) => {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      };

      setDragPreview({
        taskId: dragState.taskId,
        newStartTime: formatTime(newStartMin),
        newEndTime: formatTime(newEndMin)
      });
    };

    const handleMouseUp = () => {
      if (dragState && dragPreview) {
        const task = dayTasks.find(e => e.id === dragState.taskId);
        if (task) {
          onUpdateTask({
            ...task,
            startTime: dragPreview.newStartTime,
            endTime: dragPreview.newEndTime
          });
        }
      }
      setDragState(null);
      setDragPreview(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, dragPreview, dayTasks, onUpdateTask]);


  // Process tasks into visual segments
  const taskSegments = useMemo(() => {
    const segments: any[] = [];

    dayTasks.forEach(task => {
      const isDragging = dragPreview?.taskId === task.id;
      const effectiveStartTime = isDragging ? dragPreview!.newStartTime : task.startTime;
      const effectiveEndTime = isDragging ? dragPreview!.newEndTime : task.endTime;

      const [startH, startM] = effectiveStartTime.split(':').map(Number);
      const [endH, endM] = effectiveEndTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const project = projects.find(p => p.id === task.projectId);

      const addSegment = (isPm: boolean, startMin: number, endMin: number) => {
        let startDeg = ((startMin / 60) % 12) * 30 + (startMin % 60) * 0.5;
        let endDeg = ((endMin / 60) % 12) * 30 + (endMin % 60) * 0.5;
        
        if (endDeg <= startDeg) endDeg += 360;

        segments.push({
          id: task.id,
          task,
          isPm,
          path: describeArc(CENTER, CENTER, isPm ? RADIUS_PM : RADIUS_AM, startDeg, endDeg),
          color: project?.color || '#cbd5e1',
          isActive: isWithinInterval(currentTime, {
            start: parse(`${task.date} ${effectiveStartTime}`, 'yyyy-MM-dd HH:mm', new Date()),
            end: parse(`${task.date} ${effectiveEndTime}`, 'yyyy-MM-dd HH:mm', new Date()),
          }),
          duration: endMin - startMin,
          isDragging
        });
      };

      if (startMinutes < 720 && endMinutes <= 720) {
        addSegment(false, startMinutes, endMinutes);
      } else if (startMinutes >= 720) {
        addSegment(true, startMinutes, endMinutes);
      } else {
        addSegment(false, startMinutes, 720); 
        addSegment(true, 720, endMinutes);   
      }
    });

    return segments.sort((a, b) => {
      if (a.isDragging) return 1;
      if (b.isDragging) return -1;
      return b.duration - a.duration;
    });
  }, [dayTasks, projects, currentTime, dragPreview]);

  const getOpacity = (task: Task) => {
    if (dragPreview?.taskId === task.id) return 0.9;
    const total = task.checklist.length;
    const completed = task.checklist.filter(i => i.completed).length;
    if (task.completed) return 1;
    if (total === 0) return 0.2;
    return 0.2 + (completed / total) * 0.8;
  };

  const toggleChecklistItem = (task: Task, itemId: string) => {
    const updatedChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    const allCompleted = updatedChecklist.every(i => i.completed);
    onUpdateTask({ ...task, checklist: updatedChecklist, completed: allCompleted && updatedChecklist.length > 0 });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} className="text-purple-500" />;
      case 'story': return <CircleDashed size={14} className="text-pink-500" />;
      case 'image': return <ImageIcon size={14} className="text-blue-500" />;
      default: return <ImageIcon size={14} className="text-slate-400" />;
    }
  };

  const isViewingToday = isSameDay(date, new Date());
  const now = new Date();
  const currentHandDegrees = ((now.getHours() % 12) * 30) + (now.getMinutes() * 0.5);
  const isCurrentPm = now.getHours() >= 12;

  const BASE_COLOR_RGB = "99, 102, 241"; 
  const activeRingColor = `rgba(${BASE_COLOR_RGB}, 0.15)`;
  const inactiveRingColor = `rgba(${BASE_COLOR_RGB}, 0.05)`;
  const amRingColor = !isCurrentPm ? activeRingColor : inactiveRingColor; 
  const pmRingColor = isCurrentPm ? activeRingColor : inactiveRingColor;
  const topTextPos = polarToCartesian(CENTER, CENTER, CENTER - 25, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 leading-none">
              {format(date, 'EEEE')}
            </h2>
            <p className="text-sm text-indigo-600 font-medium">
              {format(date, 'MMMM do')}
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="bg-slate-100 rounded-lg p-1 flex items-center">
           <button 
            onClick={() => setDisplayMode('dial')}
            className={`p-1.5 rounded-md transition-all ${displayMode === 'dial' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Clock View"
           >
             <LayoutGrid size={18} />
           </button>
           <button 
            onClick={() => setDisplayMode('agenda')}
            className={`p-1.5 rounded-md transition-all ${displayMode === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Agenda List"
           >
             <List size={18} />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
        {displayMode === 'dial' ? (
          <div className="flex flex-col items-center w-full min-h-full">
            {/* Clock Viz */}
            <div className="w-full max-w-[340px] aspect-square relative my-4 flex-shrink-0">
              <svg 
                ref={svgRef}
                viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} 
                className="w-full h-full drop-shadow-xl"
                style={{ touchAction: 'none' }}
              >
                <circle cx={CENTER} cy={CENTER} r={CENTER - 10} fill="white" className="shadow-sm" />
                
                <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-slate-700 tracking-tight">
                  {format(currentTime, 'h:mm')}
                </text>
                <text x={CENTER} y={CENTER + 20} textAnchor="middle" dominantBaseline="middle" className="text-xs font-bold fill-slate-400 uppercase tracking-widest">
                  {format(currentTime, 'a')}
                </text>

                <text x={topTextPos.x} y={topTextPos.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-slate-300">
                  12
                </text>

                <circle cx={CENTER} cy={CENTER} r={RADIUS_PM} fill="none" stroke={pmRingColor} strokeWidth={STROKE_WIDTH_TRACK} />
                <circle cx={CENTER} cy={CENTER} r={RADIUS_AM} fill="none" stroke={amRingColor} strokeWidth={STROKE_WIDTH_TRACK} />

                {taskSegments.map((seg, idx) => (
                  <g 
                    key={`${seg.id}-${idx}`} 
                    onMouseDown={(e) => handleMouseDown(e, seg.id, seg.isPm)}
                    className={`transition-opacity ${dragState ? (dragState.taskId === seg.id ? 'cursor-grabbing' : 'opacity-50') : 'cursor-grab hover:opacity-80'}`}
                  >
                    {seg.isActive && !dragState && (
                       <path d={seg.path} fill="none" stroke={seg.color} strokeWidth={STROKE_WIDTH_EVENT + 8} strokeLinecap="round" className="opacity-30 animate-pulse" />
                    )}
                    <path d={seg.path} fill="none" stroke={seg.color} strokeWidth={STROKE_WIDTH_EVENT} strokeLinecap="round" strokeOpacity={getOpacity(seg.task)} />
                    {seg.isDragging && (
                      <path d={seg.path} fill="none" stroke="white" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" className="opacity-50" />
                    )}
                  </g>
                ))}

                {isViewingToday && (
                  <g transform={`rotate(${currentHandDegrees}, ${CENTER}, ${CENTER})`} className="pointer-events-none transition-transform duration-1000 ease-linear">
                     <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - RADIUS_PM - 10} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                     <circle cx={CENTER} cy={CENTER} r="4" fill="#ef4444" />
                     <circle cx={CENTER} cy={CENTER - RADIUS_PM - 10} r="3" fill="#ef4444" />
                  </g>
                )}
              </svg>

              {/* Navigation Arrows for tasks */}
              {dayTasks.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                   <button 
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg pointer-events-auto hover:bg-white text-slate-400 hover:text-indigo-600 transition-all"
                    onClick={() => {
                      const idx = dayTasks.findIndex(t => t.id === selectedTaskId);
                      const prev = dayTasks[(idx - 1 + dayTasks.length) % dayTasks.length];
                      setSelectedTaskId(prev.id);
                    }}
                   >
                     <ChevronLeft size={20} />
                   </button>
                   <button 
                    className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg pointer-events-auto hover:bg-white text-slate-400 hover:text-indigo-600 transition-all"
                    onClick={() => {
                      const idx = dayTasks.findIndex(t => t.id === selectedTaskId);
                      const next = dayTasks[(idx + 1) % dayTasks.length];
                      setSelectedTaskId(next.id);
                    }}
                   >
                     <ChevronRight size={20} />
                   </button>
                </div>
              )}
            </div>

            {/* Selected Task Details Card */}
            <div className="w-full px-4 pb-8 max-w-md animate-in slide-in-from-bottom-4 duration-300">
              {activeTaskData ? (
                <div className={`bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transition-all ${dragPreview ? 'ring-2 ring-indigo-400 scale-[1.02]' : ''}`}>
                   <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                     <div>
                        <span 
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider mb-1"
                          style={{ backgroundColor: projects.find(p => p.id === activeTaskData.projectId)?.color || '#cbd5e1' }}
                        >
                          {projects.find(p => p.id === activeTaskData.projectId)?.name}
                        </span>
                        <h3 className="font-bold text-slate-800 leading-tight">{activeTaskData.title}</h3>
                        <div className={`flex items-center gap-1 text-xs mt-1 transition-colors ${dragPreview ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                          <Clock size={12} />
                          {activeTaskData.startTime} - {activeTaskData.endTime}
                          {dragPreview && <span className="ml-2 bg-indigo-100 text-indigo-700 px-1.5 rounded text-[10px]">MOVING</span>}
                        </div>
                     </div>
                     {!dragPreview && (
                       <button onClick={() => onTaskClick(activeTaskData)} className="text-indigo-600 text-xs font-semibold hover:underline">
                         Edit
                       </button>
                     )}
                   </div>

                   <div className={`p-4 space-y-3 ${dragPreview ? 'opacity-50 pointer-events-none' : ''}`}>
                     <div className="space-y-2">
                       {activeTaskData.checklist.map(item => (
                         <div key={item.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleChecklistItem(activeTaskData, item.id)}>
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                              {item.completed && <CheckSquare size={10} className="text-white" />}
                            </div>
                            <span className={`text-sm flex-1 leading-snug ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.text}
                            </span>
                         </div>
                       ))}
                       {activeTaskData.checklist.length === 0 && (
                         <p className="text-xs text-slate-400 italic">No items in checklist.</p>
                       )}
                     </div>

                     {activeTaskData.contentIdeas && activeTaskData.contentIdeas.length > 0 && (
                       <div className="pt-3 border-t border-slate-100">
                         <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Content Ideas</p>
                         <div className="flex gap-2 overflow-x-auto pb-2">
                           {activeTaskData.contentIdeas.map(idea => (
                             <div key={idea.id} className="flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg p-2 w-24 flex flex-col gap-1 items-center text-center">
                               {getIconForType(idea.type)}
                               <span className="text-[10px] text-slate-600 line-clamp-2 leading-tight">{idea.text}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">Select a time slot on the dial</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 max-w-2xl mx-auto animate-in fade-in duration-300">
             {dayTasks.map((task) => {
               const project = projects.find(p => p.id === task.projectId);
               const isCurrent = isWithinInterval(currentTime, {
                 start: parse(`${task.date} ${task.startTime}`, 'yyyy-MM-dd HH:mm', new Date()),
                 end: parse(`${task.date} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date()),
               });

               return (
                 <div 
                   key={task.id} 
                   className={`bg-white rounded-xl shadow-sm border transition-all ${isCurrent ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'}`}
                 >
                   <div className="p-4 flex gap-4">
                     {/* Time & Marker */}
                     <div className="flex flex-col items-center gap-1 min-w-[60px] pt-1">
                        <span className="text-xs font-bold text-slate-800">{task.startTime}</span>
                        <div className="w-1 flex-1 bg-slate-100 rounded-full relative">
                           <div className="absolute top-0 w-full h-full rounded-full opacity-20" style={{ backgroundColor: project?.color }} />
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{task.endTime}</span>
                     </div>

                     {/* Content */}
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span 
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: project?.color }}
                            >
                              {project?.name}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 mt-1">{task.title}</h3>
                          </div>
                          <button onClick={() => onTaskClick(task)} className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-lg">
                             <ChevronRight size={20} />
                          </button>
                        </div>

                        {/* Summary Stats */}
                        <div className="flex items-center gap-4 mb-4">
                           <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <CheckCircle2 size={14} className={task.completed ? 'text-green-500' : 'text-slate-300'} />
                              <span>{task.checklist.filter(i => i.completed).length} / {task.checklist.length} items</span>
                           </div>
                           {task.contentIdeas && task.contentIdeas.length > 0 && (
                             <div className="flex items-center gap-1.5 text-xs text-slate-500">
                               <Sparkles size={14} className="text-yellow-500" />
                               <span>{task.contentIdeas.length} ideas</span>
                             </div>
                           )}
                        </div>

                        {/* Checklist - In-place editing */}
                        <div className="space-y-2 bg-slate-50 rounded-lg p-3">
                           {task.checklist.map(item => (
                             <div 
                              key={item.id} 
                              className="flex items-start gap-3 group cursor-pointer" 
                              onClick={() => toggleChecklistItem(task, item.id)}
                             >
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                                  {item.completed && <CheckSquare size={10} className="text-white" />}
                                </div>
                                <span className={`text-sm flex-1 leading-snug ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                  {item.text}
                                </span>
                             </div>
                           ))}
                           {task.checklist.length === 0 && (
                             <p className="text-xs text-slate-400 italic">No checklist items.</p>
                           )}
                        </div>
                     </div>
                   </div>
                 </div>
               );
             })}

             {dayTasks.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <LayoutGrid size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">No tasks scheduled for this day.</p>
                  <button onClick={onBack} className="mt-4 text-indigo-600 hover:underline">Back to Month View</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
