"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare,
  Plus,
  X,
  Clock,
  User,
  AlertCircle,
  Calendar,
  GripVertical,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import {
  formatDate,
  cn,
  getStatusColor,
  getPriorityColor,
} from "@/lib/utils";
import type { TaskWithDetails } from "@/types";

interface TasksResponse {
  tasks: TaskWithDetails[];
  users: { id: string; name: string; role: string }[];
  summary: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
  };
}

const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  inventory: "Inventory",
  orders: "Orders",
  shipping: "Shipping",
  quality: "Quality",
  admin: "Admin",
};

export default function TasksPage() {
  const [data, setData] = useState<TasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general",
    dueDate: "",
    assigneeId: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    fetch(`/api/tasks?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterStatus, filterPriority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createTask = async () => {
    if (!newTask.title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        dueDate: newTask.dueDate || undefined,
        assigneeId: newTask.assigneeId || undefined,
      }),
    });
    setShowNewForm(false);
    setNewTask({ title: "", description: "", priority: "medium", category: "general", dueDate: "", assigneeId: "" });
    fetchData();
  };

  const updateTask = async (id: string, updates: Record<string, unknown>) => {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchData();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  const columns = ["todo", "in_progress", "review", "done"];
  const columnColors: Record<string, string> = {
    todo: "border-t-gray-400",
    in_progress: "border-t-blue-500",
    review: "border-t-yellow-500",
    done: "border-t-green-500",
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricCard title="To Do" value={data.summary.todo.toString()} icon={CheckSquare} iconColor="bg-gray-100 text-gray-600" />
          <MetricCard title="In Progress" value={data.summary.inProgress.toString()} icon={Clock} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="In Review" value={data.summary.review.toString()} icon={AlertCircle} iconColor="bg-yellow-100 text-yellow-600" />
          <MetricCard title="Completed" value={data.summary.done.toString()} icon={CheckSquare} iconColor="bg-green-100 text-green-600" />
          <MetricCard title="Overdue" value={data.summary.overdue.toString()} icon={AlertCircle} iconColor="bg-red-100 text-red-600" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select w-auto">
            <option value="">All Statuses</option>
            {columns.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="select w-auto">
            <option value="">All Priorities</option>
            {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* New Task Form */}
      {showNewForm && (
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">New Task</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">Title *</label>
              <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="input" placeholder="Task title" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">Description</label>
              <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="input" rows={2} placeholder="Task description" />
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="select">
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="select">
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select value={newTask.assigneeId} onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })} className="select">
                <option value="">Unassigned</option>
                {data?.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={createTask} className="btn-primary">Create Task</button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((status) => {
          const tasks = (data?.tasks || []).filter((t) => t.status === status);
          return (
            <div key={status} className={cn("card border-t-4", columnColors[status])}>
              <div className="card-header flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{statusLabels[status]}</h3>
                <span className="badge bg-gray-100 text-gray-600">{tasks.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[200px]">
                {tasks.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                  return (
                    <div key={task.id} className={cn("rounded-lg border p-3 bg-white hover:shadow-sm transition-shadow", isOverdue && "border-red-200 bg-red-50/50")}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
                        <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className={cn("badge text-[10px]", getPriorityColor(task.priority))}>
                          {priorityLabels[task.priority]}
                        </span>
                        <span className="badge bg-gray-100 text-gray-600 text-[10px]">
                          {categoryLabels[task.category] || task.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {task.assignee ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {task.assignee.name}
                          </span>
                        ) : (
                          <span>Unassigned</span>
                        )}
                        {task.dueDate && (
                          <span className={cn("flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
                            <Calendar className="h-3 w-3" /> {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                      {/* Status change buttons */}
                      <div className="flex gap-1 mt-2 pt-2 border-t border-gray-100">
                        {columns.filter((s) => s !== status).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateTask(task.id, { status: s })}
                            className="flex-1 text-[10px] py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
