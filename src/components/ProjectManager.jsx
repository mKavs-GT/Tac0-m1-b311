import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Calendar, X, ChevronRight, ChevronDown, Clock, Activity, Trash2, Edit3, MoreVertical, Layers 
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants/users';
import { EmptyState } from './ui/EmptyState';
import { io } from 'socket.io-client';
import { API_BASE_URL, WS_URL, authHeader } from '../config';

const COLUMN_TITLES = {
  TASKS: 'Tasks',
  IN_PROGRESS: 'In Progress',
  TESTING: 'Testing',
  PRODUCTION: 'Production'
};

const PRIORITY_ORDER = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const ProjectManager = ({ user, projects = [], onRefresh, externalOpen, onExternalClose }) => {
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [activeSprintMap, setActiveSprintMap] = useState({});
  const [tasks, setTasks] = useState([]);
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  
  const [openProjectMenu, setOpenProjectMenu] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedSprintId, setSelectedSprintId] = useState(null);

  const [projectFormData, setProjectFormData] = useState({ name: '', description: '', client: '', status: 'Active', startDate: '', endDate: '', members: [] });
  const [renameFormData, setRenameFormData] = useState({ name: '', overallProgress: 0 });
  const [sprintFormData, setSprintFormData] = useState({ name: '', dueDate: '' });
  const [taskFormData, setTaskFormData] = useState({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '', estimatedHours: '' });

  useEffect(() => {
    if (expandedProjects.size === 0 && projects.length > 0) {
      setExpandedProjects(new Set([projects[0].id || projects[0]._id]));
      if (projects[0].sprints && projects[0].sprints.length > 0) {
        setActiveSprintMap(prev => ({ ...prev, [projects[0].id || projects[0]._id]: projects[0].sprints[0].id || projects[0].sprints[0]._id }));
      }
    }
  }, [projects]);

  useEffect(() => {
    if (externalOpen) {
      setIsProjectModalOpen(true);
      onExternalClose?.();
    }
  }, [externalOpen]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, { headers: { ...authHeader() } });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    
    const socket = io(`${WS_URL}/staff`);
    socket.on('taskUpdated', fetchTasks);
    
    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const sortTasks = (tasksList) => {
    return [...tasksList].sort((a, b) => {
      if (PRIORITY_ORDER[a.priority] !== PRIORITY_ORDER[b.priority]) {
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(projectFormData)
      });
      if (res.ok) {
        await onRefresh();
        setIsProjectModalOpen(false);
        setProjectFormData({ name: '', description: '', client: '', status: 'Active', startDate: '', endDate: '', members: [] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMember = (uid) => {
    setProjectFormData(prev => ({
      ...prev,
      members: prev.members.includes(uid) ? prev.members.filter(m => m !== uid) : [...prev.members, uid]
    }));
  };

  const handleAddSprint = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects/${selectedProjectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(sprintFormData) 
      });
      if (res.ok) {
        await onRefresh();
        setIsSprintModalOpen(false);
        setSprintFormData({ name: '', dueDate: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects/${projectId}`, {
        method: 'DELETE',
        headers: { ...authHeader() }
      });
      if (res.ok) {
        await onRefresh();
        setOpenProjectMenu(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameProject = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin-projects/${selectedProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(renameFormData)
      });
      if (res.ok) {
        await onRefresh();
        setIsRenameModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ 
          ...taskFormData,
          projectId: selectedProjectId,
          sprintId: selectedSprintId
        })
      });
      if (res.ok) {
        fetchTasks();
        setIsTaskModalOpen(false);
        setTaskFormData({ title: '', description: '', priority: 'MEDIUM', assignedTo: '', dueDate: '', estimatedHours: '' });
      } else {
        const err = await res.json();
        alert('Failed to add task: ' + (err.error || 'Unknown'));
      }
    } catch (err) {
      console.error('Add task failed:', err);
    }
  };

  const handleTaskAction = async (taskId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: action === 'pass-testing' ? JSON.stringify({ testingNotes: 'Looks good' }) : null
      });
      if (res.ok) {
        fetchTasks();
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        alert('Action failed: ' + err.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 pb-20 transition-colors">
      <div className="flex items-end justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main">Sprint Plan</h2>
          <p className="text-sm text-text-muted mt-1">Manage active sprints and team roadmap</p>
        </div>
        {user?.isExecutive && (
          <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm transition-all shadow-sm active:scale-95">
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {projects.map(project => {
          const pId = project.id || project._id;
          return (
          <div key={pId} className="bg-bg-surface border border-border-main rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-6 flex items-center justify-between border-b border-border-main">
              <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => {
                setExpandedProjects(prev => {
                  const next = new Set(prev);
                  if (next.has(pId)) next.delete(pId);
                  else next.add(pId);
                  return next;
                });
              }}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${expandedProjects.has(pId) ? 'bg-text-main text-bg-surface' : 'bg-bg-muted text-text-muted'}`}>
                  {expandedProjects.has(pId) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-text-main">{project.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user?.isExecutive && (
                  <button onClick={() => { setSelectedProjectId(pId); setIsSprintModalOpen(true); }} className="flex items-center justify-center h-10 px-4 rounded-lg border border-current bg-transparent text-text-main hover:bg-bg-muted font-medium text-sm transition-all shadow-sm">
                    Add Sprint
                  </button>
                )}
                <div className="relative">
                  <button onClick={() => setOpenProjectMenu(openProjectMenu === pId ? null : pId)} className={`p-2 rounded-lg transition-colors ${openProjectMenu === pId ? 'bg-text-main text-bg-surface' : 'text-text-muted hover:bg-bg-muted'}`}>
                    <MoreVertical size={18} />
                  </button>
                  <AnimatePresence>
                    {openProjectMenu === pId && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenProjectMenu(null)} />
                        <motion.div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border-main rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
                          <button onClick={() => handleDeleteProject(pId)} className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 border-t border-border-main">
                            <Trash2 size={14} /> Delete Project
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {expandedProjects.has(pId) && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                   <div className="px-6 py-4 bg-bg-root border-b border-border-main flex gap-3 overflow-x-auto scrollbar-hide">
                      {(project.sprints || []).map(sprint => {
                        const sId = sprint.id || sprint._id;
                        return (
                        <button key={sId} onClick={() => setActiveSprintMap(prev => ({ ...prev, [pId]: sId }))} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${activeSprintMap[pId] === sId ? 'bg-text-main text-bg-surface border-text-main shadow-sm' : 'bg-bg-surface border-border-main text-text-muted hover:bg-bg-muted'}`}>
                          {sprint.name}
                        </button>
                      )})}
                   </div>

                   <div className="p-6">
                      {activeSprintMap[pId] && (project.sprints || []).filter(s => (s.id || s._id) === activeSprintMap[pId]).map(sprint => {
                        const sId = sprint.id || sprint._id;
                        const sprintTasks = tasks.filter(t => t.sprintId === sId);
                        
                        return (
                        <div key={sId} className="space-y-8">
                           <div className="flex items-end justify-between">
                             <div className="flex items-center gap-3">
                               <div className="w-1.5 h-10 bg-brand-purple rounded-full"></div>
                               <div>
                                 <h4 className="text-xl font-black tracking-tight text-text-main">{sprint.name}</h4>
                               </div>
                             </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {Object.entries(COLUMN_TITLES).map(([key, title]) => {
                                const colTasks = sprintTasks.filter(t => t.status === key);
                                return (
                                <div key={key} className="space-y-4">
                                   <div className="flex items-center justify-between px-2">
                                      <h5 className="text-sm font-semibold text-text-main">{title}</h5>
                                      <span className="text-xs font-semibold bg-bg-muted text-text-muted px-2 py-0.5 rounded-full border border-border-main">
                                        {colTasks.length}
                                      </span>
                                   </div>

                                   <div className="space-y-3 min-h-[200px] p-3 bg-gray-100 dark:bg-[#1A1C20] rounded-xl border border-dashed border-border-main">
                                      {colTasks.length === 0 ? (
                                        <EmptyState 
                                          icon={Layers}
                                          title="No tasks yet"
                                          subtitle={`No tasks in ${title} at the moment.`}
                                        />
                                      ) : (
                                        sortTasks(colTasks).map(task => (
                                          <div key={task.id} className="bg-bg-surface p-4 rounded-lg border border-border-main shadow-sm hover:shadow-md transition-all group">
                                             <div className={`w-8 h-1 rounded-full mb-3 ${task.priority?.toUpperCase() === 'HIGH' || task.priority?.toUpperCase() === 'URGENT' ? 'bg-danger' : task.priority?.toUpperCase() === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`} />
                                             <p className="text-sm font-black text-text-main leading-tight mb-2">{task.title}</p>
                                             <p className="text-xs font-semibold text-text-muted leading-relaxed mb-4">{task.description}</p>
                                             
                                             <div className="flex items-center justify-between mt-4 border-t border-border-main pt-3">
                                                <div className="flex items-center gap-2">
                                                  {task.assigneeUser?.avatar && (
                                                    <img src={task.assigneeUser.avatar} alt="" className="w-6 h-6 rounded-full border-2 border-bg-surface" title={task.assigneeUser.name} />
                                                  )}
                                                </div>
                                                <div>
                                                  {key === 'TASKS' && task.assignedTo === user?.uid && (
                                                    <button onClick={() => handleTaskAction(task.id, 'accept')} className="px-3 py-1.5 bg-primary-tint text-primary text-[10px] font-black uppercase tracking-widest rounded hover:bg-primary/10 transition-colors border border-primary/20">
                                                      Accept
                                                    </button>
                                                  )}
                                                  {key === 'IN_PROGRESS' && task.assignedTo === user?.uid && (
                                                    <button onClick={() => handleTaskAction(task.id, 'complete')} className="px-3 py-1.5 bg-success-tint text-success text-[10px] font-black uppercase tracking-widest rounded hover:bg-success/10 transition-colors border border-success/20">
                                                      Mark Complete
                                                    </button>
                                                  )}
                                                  {key === 'TESTING' && user?.uid === 'MGT-DEV-02' && (
                                                    <button onClick={() => handleTaskAction(task.id, 'pass-testing')} className="px-3 py-1.5 bg-testing-tint text-testing text-[10px] font-black uppercase tracking-widest rounded hover:bg-testing/10 transition-colors border border-testing/20">
                                                      Pass Testing
                                                    </button>
                                                  )}
                                                  {key === 'TESTING' && user?.isExecutive && (
                                                    <button onClick={() => handleTaskAction(task.id, 'approve')} className="px-3 py-1.5 bg-danger-tint text-danger text-[10px] font-black uppercase tracking-widest rounded hover:bg-danger/10 transition-colors border border-danger/20">
                                                      Approve
                                                    </button>
                                                  )}
                                                  {key === 'PRODUCTION' && (
                                                    <span className="text-[10px] font-bold text-success uppercase flex items-center gap-1"><Clock size={10} /> Done</span>
                                                  )}
                                                </div>
                                             </div>
                                          </div>
                                        ))
                                      )}
                                      {user?.isExecutive && key === 'TASKS' && (
                                        <button 
                                          onClick={() => {
                                            setSelectedProjectId(pId);
                                            setSelectedSprintId(sId);
                                            setIsTaskModalOpen(true);
                                          }}
                                          className="w-full flex items-center justify-center h-10 px-4 border border-current bg-transparent text-text-muted rounded-lg text-sm font-medium hover:bg-bg-muted transition-all"
                                        >
                                          + Add Task
                                        </button>
                                      )}
                                   </div>
                                </div>
                              )})}
                           </div>
                        </div>
                      )})}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )})}
      </div>

      <AnimatePresence>
        {isProjectModalOpen && (
          <Modal onClose={() => setIsProjectModalOpen(false)} title="New Project">
            <form onSubmit={handleCreateProject} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Project Name *</label>
                <input type="text" required value={projectFormData.name} onChange={e => setProjectFormData({ ...projectFormData, name: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm font-bold text-text-main focus:outline-none focus:border-text-main" />
              </div>
              <button type="submit" className="w-full py-3 bg-text-main text-bg-surface rounded-lg font-bold text-sm shadow-lg">Create Project</button>
            </form>
          </Modal>
        )}

        {isSprintModalOpen && (
          <Modal onClose={() => setIsSprintModalOpen(false)} title="Add Sprint">
            <form onSubmit={handleAddSprint} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Sprint Name</label>
                 <input type="text" value={sprintFormData.name} onChange={e => setSprintFormData({...sprintFormData, name: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm font-bold text-text-main focus:outline-none focus:border-text-main" />
               </div>
               <button type="submit" className="w-full py-3 bg-text-main text-bg-surface rounded-lg font-bold text-sm shadow-lg">Confirm</button>
            </form>
          </Modal>
        )}

        {isTaskModalOpen && (
          <Modal onClose={() => setIsTaskModalOpen(false)} title="New Task">
            <form onSubmit={handleAddTask} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Title *</label>
                 <input required value={taskFormData.title} onChange={e => setTaskFormData({...taskFormData, title: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm font-bold text-text-main focus:outline-none focus:border-text-main" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Description</label>
                 <textarea rows={2} value={taskFormData.description} onChange={e => setTaskFormData({...taskFormData, description: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm text-text-main focus:outline-none focus:border-text-main" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Priority</label>
                    <select value={taskFormData.priority} onChange={e => setTaskFormData({...taskFormData, priority: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm font-bold text-text-main">
                      <option value="LOW">Low Cortisol</option>
                      <option value="MEDIUM">Medium Cortisol</option>
                      <option value="HIGH">High Cortisol</option>
                      <option value="URGENT">Urgent Cortisol</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest ml-1">Assignee *</label>
                    <select required value={taskFormData.assignedTo} onChange={e => setTaskFormData({...taskFormData, assignedTo: e.target.value})} className="w-full px-4 py-3 rounded-lg bg-bg-root border border-border-main text-sm font-bold text-text-main">
                      <option value="">Select Member</option>
                      {TEAM_MEMBERS.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                    </select>
                  </div>
               </div>
               <button type="submit" className="w-full py-3 bg-text-main text-bg-surface rounded-lg font-bold text-sm shadow-lg">Add to Board</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManager;

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-bg-root/60 backdrop-blur-md" />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-bg-surface rounded-xl border border-border-main shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-8 text-text-main">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black tracking-tight">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg bg-bg-muted text-text-muted hover:text-text-main transition-colors"><X size={18} /></button>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
