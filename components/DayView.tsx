
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, isSameDay, isWithinInterval } from 'date-fns';
import { CheckSquare, Clock, Video, Image as ImageIcon, CircleDashed, Sparkles } from 'lucide-react';
import { Project, Task } from '../types';

interface DayViewProps {
  date: Date;
  projects: Project[];
  tasks: Task[];
  onBack: () => void;
  onTaskClick: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
}

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

  const dayTasks = useMemo(() => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => task.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, date]);

  useEffect(() => {
    if (dragState) return;
    if (selectedTaskId && dayTasks.some(e => e.id === selectedTaskId)) return;
    const now = new Date();
    const isToday = isSameDay(date, now);
    if (isToday) {
      const current = dayTasks.find(e => {
        const start = new Date(`${e.date}T${e.startTime}:00`);
        const end = new Date(`${e.date}T${e.endTime}:00`);
        return isWithinInterval(now, { start, end });
      });
      if (current) { setSelectedTaskId(current.id); return; }
    }
    if (dayTasks.length > 0) setSelectedTaskId(dayTasks[0].id);
  }, [dayTasks, date, selectedTaskId, dragState]);

  const activeTaskData = useMemo(() => {
    const baseTask = dayTasks.find(e => e.id === selectedTaskId);
    if (!baseTask) return null;
    if (dragPreview && dragPreview.taskId === baseTask.id) {
      return { ...baseTask, startTime: dragPreview.newStartTime, endTime: dragPreview.newEndTime };
    }
    return baseTask;
  }, [dayTasks, selectedTaskId, dragPreview]);

  const VIEW_SIZE = 320; 
  const CENTER = VIEW_SIZE / 2;
  const RADIUS_PM = 110; 
  const RADIUS_AM = 75;  
  const STROKE_WIDTH_TRACK = 28; 
  const STROKE_WIDTH_EVENT = 24; 

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  const getAngleFromPoint = (x: number, y: number) => {
    const dx = x - CENTER; const dy = y - CENTER;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handleMouseDown = (e: React.MouseEvent, taskId: string, isPm: boolean) => {
    e.preventDefault(); e.stopPropagation();
    if (!svgRef.current) return;
    const task = dayTasks.find(ev => ev.id === taskId);
    if (!task) return;
    const [startH, startM] = task.startTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const [endH, endM] = task.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - startTotal;
    const rect = svgRef.current.getBoundingClientRect();
    const angle = getAngleFromPoint(e.clientX - rect.left, e.clientY - rect.top);
    setSelectedTaskId(taskId);
    setDragState({ taskId, originalStartMin: startTotal, duration, startAngle: angle, isPm });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const currentAngle = getAngleFromPoint(e.clientX - rect.left, e.clientY - rect.top);
      let deltaAngle = currentAngle - dragState.startAngle;
      if (deltaAngle > 180) deltaAngle -= 360; if (deltaAngle < -180) deltaAngle += 360;
      const deltaMinutes = Math.round(deltaAngle * 2);
      const snappedDelta = Math.round(deltaMinutes / 5) * 5;
      let newStartMin = dragState.originalStartMin + snappedDelta;
      if (!dragState.isPm) newStartMin = Math.max(0, Math.min(719 - dragState.duration, newStartMin));
      else newStartMin = Math.max(720, Math.min(1440 - dragState.duration, newStartMin));
      const formatTime = (t: number) => `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
      setDragPreview({ taskId: dragState.taskId, newStartTime: formatTime(newStartMin), newEndTime: formatTime(newStartMin + dragState.duration) });
    };
    const handleMouseUp = () => {
      if (dragState && dragPreview) {
        const task = dayTasks.find(e => e.id === dragState.taskId);
        if (task) onUpdateTask({ ...task, startTime: dragPreview.newStartTime, endTime: dragPreview.newEndTime });
      }
      setDragState(null); setDragPreview(null);
    };
    if (dragState) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragState, dragPreview, dayTasks, onUpdateTask]);

  const taskSegments = useMemo(() => {
    const segments: any[] = [];
    dayTasks.forEach(task => {
      const isDragging = dragPreview?.taskId === task.id;
      const effectiveStartTime = isDragging ? dragPreview!.newStartTime : task.startTime;
      const effectiveEndTime = isDragging ? dragPreview!.newEndTime : task.endTime;
      const [startH, startM] = effectiveStartTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const [endH, endM] = effectiveEndTime.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      
      const project = projects.find(p => p.id === task.projectId);
      
      // Calculate progress
      const totalItems = task.checklist.length;
      const completedItems = task.checklist.filter(i => i.completed).length;
      
      let progress = 0;
      if (totalItems > 0) {
        progress = completedItems / totalItems;
      } else {
        progress = task.completed ? 1 : 0;
      }

      // Logic: Color intensifies (more opaque) with each todo. 
      // 0% progress = 10% opacity. 
      // 100% progress = 0% opacity (vanishes).
      const taskOpacity = progress === 1 ? 1 : 0.1 + (progress * 0.8);
      const taskColor = project?.color || '#cbd5e1';

      const addSegment = (isPm: boolean, startMin: number, endMin: number) => {
        let startDeg = ((startMin / 60) % 12) * 30 + (startMin % 60) * 0.5;
        let endDeg = ((endMin / 60) % 12) * 30 + (endMin % 60) * 0.5;
        if (endDeg <= startDeg) endDeg += 360;
        segments.push({
          id: task.id, 
          task, 
          isPm, 
          path: describeArc(CENTER, CENTER, isPm ? RADIUS_PM : RADIUS_AM, startDeg, endDeg),
          color: taskColor, 
          opacity: taskOpacity,
          isDragging,
          progress
        });
      };
      if (startMinutes < 720 && endMinutes <= 720) addSegment(false, startMinutes, endMinutes);
      else if (startMinutes >= 720) addSegment(true, startMinutes, endMinutes);
      else { addSegment(false, startMinutes, 720); addSegment(true, 720, endMinutes); }
    });
    return segments;
  }, [dayTasks, projects, dragPreview]);

  const toggleChecklistItem = (task: Task, itemId: string) => {
    const updatedChecklist = task.checklist.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
    onUpdateTask({ ...task, checklist: updatedChecklist, completed: updatedChecklist.every(i => i.completed) && updatedChecklist.length > 0 });
  };

  const currentHandDegrees = ((currentTime.getHours() % 12) * 30) + (currentTime.getMinutes() * 0.5);
  const isCurrentPm = currentTime.getHours() >= 12;

  return (
    <div className="flex-1 flex flex-col items-center bg-slate-50 min-h-full pb-12 overflow-y-auto">
      <div className="w-full max-w-[340px] aspect-square relative my-6 flex-shrink-0 p-2">
        <svg ref={svgRef} viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="w-full h-full" style={{ touchAction: 'none' }}>
          <circle cx={CENTER} cy={CENTER} r={RADIUS_AM - 15} fill="white" className="shadow-sm" />
          
          <text x={CENTER} y={CENTER} textAnchor="middle" dominantBaseline="middle" className="text-3xl font-black fill-slate-800 tracking-tight">{format(currentTime, 'h:mm')}</text>
          <text x={CENTER} y={CENTER + 22} textAnchor="middle" dominantBaseline="middle" className="text-[11px] font-black fill-slate-400 uppercase tracking-[0.2em]">{format(currentTime, 'a')}</text>
          
          <circle cx={CENTER} cy={CENTER} r={RADIUS_PM} fill="none" stroke={isCurrentPm ? "rgba(99, 102, 241, 0.12)" : "rgba(0,0,0,0.04)"} strokeWidth={STROKE_WIDTH_TRACK} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS_AM} fill="none" stroke={!isCurrentPm ? "rgba(99, 102, 241, 0.12)" : "rgba(0,0,0,0.04)"} strokeWidth={STROKE_WIDTH_TRACK} />

          {taskSegments.map((seg, idx) => {
            const isSelected = selectedTaskId === seg.id;
            return (
              <g key={`${seg.id}-${idx}`} onClick={() => setSelectedTaskId(seg.id)} onMouseDown={(e) => handleMouseDown(e, seg.id, seg.isPm)} className="cursor-pointer group">
                {/* White Halo Selection Border - Visible even if segment is 0% opacity */}
                {isSelected && (
                  <path 
                    d={seg.path} 
                    fill="none" 
                    stroke="white" 
                    strokeWidth={STROKE_WIDTH_EVENT + 8} 
                    strokeLinecap="round" 
                    strokeOpacity={1}
                  />
                )}
                {/* Intensifying Task Segment */}
                <path 
                  d={seg.path} 
                  fill="none" 
                  stroke={seg.color} 
                  strokeWidth={STROKE_WIDTH_EVENT} 
                  strokeLinecap="round" 
                  strokeOpacity={seg.opacity} 
                  className="transition-all duration-300 group-hover:stroke-opacity-100"
                />
              </g>
            );
          })}

          {isSameDay(date, new Date()) && (
            <g transform={`rotate(${currentHandDegrees}, ${CENTER}, ${CENTER})`} className="pointer-events-none transition-transform duration-1000 ease-linear">
                <line x1={CENTER} y1={CENTER} x2={CENTER} y2={CENTER - RADIUS_PM - 6} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx={CENTER} cy={CENTER} r="3.5" fill="#ef4444" />
            </g>
          )}
        </svg>
      </div>

      <div className="w-full px-4 max-w-lg animate-in slide-in-from-bottom-6 duration-400">
        {activeTaskData ? (
          <div className="bg-white rounded-[2rem] shadow-2xl border border-white overflow-hidden">
             <div className="p-5 border-b border-slate-50 flex justify-between items-start bg-slate-50/40">
               <div className="flex-1">
                  <span 
                    className="text-[10px] font-black uppercase tracking-[0.15em] text-white px-2.5 py-1 rounded-lg shadow-sm transition-colors duration-300" 
                    style={{ backgroundColor: projects.find(p => p.id === activeTaskData.projectId)?.color }}
                  >
                    {projects.find(p => p.id === activeTaskData.projectId)?.name}
                  </span>
                  <h3 className="text-xl font-black text-slate-800 mt-2 leading-tight tracking-tight">{activeTaskData.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">
                    <Clock size={14} className="text-slate-300" /> {activeTaskData.startTime} — {activeTaskData.endTime}
                  </div>
               </div>
               <button onClick={() => onTaskClick(activeTaskData)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors">Edit</button>
             </div>

             <div className="p-6 space-y-4">
               <div className="space-y-3">
                 {activeTaskData.checklist.map(item => (
                   <div key={item.id} className="flex items-start gap-4 cursor-pointer group" onClick={() => toggleChecklistItem(activeTaskData, item.id)}>
                      <div className={`mt-0.5 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-green-500 border-green-500 scale-95 shadow-inner' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}>
                        {item.completed && <CheckSquare size={16} className="text-white" />}
                      </div>
                      <span className={`text-[15px] font-bold flex-1 leading-snug transition-all ${item.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{item.text}</span>
                   </div>
                 ))}
                 {activeTaskData.checklist.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No checklist items for this task.</p>}
               </div>

               {activeTaskData.contentIdeas?.length > 0 && (
                 <div className="pt-5 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">Social Media Ideas</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                       {activeTaskData.contentIdeas.map(idea => (
                         <div key={idea.id} className="flex-shrink-0 bg-slate-50 rounded-2xl p-3 w-32 flex flex-col items-center text-center border border-slate-100 hover:border-indigo-100 transition-colors">
                           {idea.type === 'video' ? <Video size={18} className="text-purple-500" /> : idea.type === 'story' ? <CircleDashed size={18} className="text-pink-500" /> : <ImageIcon size={18} className="text-blue-500" />}
                           <span className="text-[10px] font-black text-slate-600 mt-2.5 line-clamp-2 leading-snug uppercase tracking-tight">{idea.text}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-300">
            <Sparkles size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black text-sm uppercase tracking-widest">Select a task on the clock</p>
          </div>
        )}
      </div>
    </div>
  );
};
