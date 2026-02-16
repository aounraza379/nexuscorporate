import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, Task } from "@/hooks/useTasks";
import { useEmployeeList } from "@/hooks/useEmployeeList";
import { exportToCsv } from "@/lib/exportCsv";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  GripVertical,
  Download,
  UserCircle,
} from "lucide-react";

const statusColumns = [
  { id: "pending", label: "Pending", icon: Clock },
  { id: "in_progress", label: "In Progress", icon: AlertCircle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

const priorityColors = {
  low: "bg-nexus-success/20 text-nexus-success",
  medium: "bg-nexus-warning/20 text-nexus-warning",
  high: "bg-nexus-error/20 text-nexus-error",
};

export default function TasksPage() {
  const { userRole } = useAuth();
  const { tasks, isLoading, updateTask, createTask } = useTasks();
  const { data: employees } = useEmployeeList();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    assigned_to: null as string | null,
    due_date: null as string | null,
    sentiment_score: null as number | null,
    created_by: null as string | null,
  });

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask.mutateAsync(newTask);
    setNewTask({ title: "", description: "", priority: "medium", status: "pending", assigned_to: null, due_date: null, sentiment_score: null, created_by: null });
    setIsCreateOpen(false);
  };

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    await updateTask.mutateAsync({ id: taskId, updates: { status: newStatus } });
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return null;
    return employees?.find((e) => e.id === id)?.full_name || null;
  };

  const handleExport = () => {
    if (!tasks.length) return;
    exportToCsv("tasks-export", tasks.map((t) => ({
      Title: t.title,
      Description: t.description || "",
      Status: t.status || "",
      Priority: t.priority || "",
      "Assigned To": getEmployeeName(t.assigned_to) || t.assigned_to || "",
      "Due Date": t.due_date ? new Date(t.due_date).toLocaleDateString() : "",
      "Created At": t.created_at ? new Date(t.created_at).toLocaleDateString() : "",
    })));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {userRole === "employee" ? "My Tasks" : "Team Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {tasks.length} total tasks • {tasks.filter((t) => t.status === "completed").length} completed
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>

          {(userRole === "manager" || userRole === "hr") && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="glow" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-xl border-border">
                <DialogHeader>
                  <DialogTitle>Create & Assign Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />

                  {/* Assign to employee */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Assign To</label>
                    <Select
                      value={newTask.assigned_to || "unassigned"}
                      onValueChange={(value) =>
                        setNewTask({ ...newTask, assigned_to: value === "unassigned" ? null : value })
                      }
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-4 h-4 text-muted-foreground" />
                          <SelectValue placeholder="Select employee" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name || "Unknown"} {emp.department ? `(${emp.department})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Priority</label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
                      <Input
                        type="date"
                        value={newTask.due_date || ""}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value || null })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateTask}
                    disabled={!newTask.title.trim() || createTask.isPending}
                    className="w-full"
                  >
                    {createTask.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Create & Assign Task"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusColumns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <column.icon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{column.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {getTasksByStatus(column.id).length}
              </Badge>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusUpdate={handleStatusUpdate}
                  isUpdating={updateTask.isPending}
                  userRole={userRole}
                  assigneeName={getEmployeeName(task.assigned_to)}
                />
              ))}

              {getTasksByStatus(column.id).length === 0 && (
                <div className="h-32 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TaskCard({
  task,
  onStatusUpdate,
  isUpdating,
  userRole,
  assigneeName,
}: {
  task: Task;
  onStatusUpdate: (id: string, status: string) => void;
  isUpdating: boolean;
  userRole: string | null;
  assigneeName: string | null;
}) {
  const nextStatus = task.status === "pending" ? "in_progress" : task.status === "in_progress" ? "completed" : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.medium}>
            {task.priority}
          </Badge>
          {task.due_date && (
            <Badge variant="outline" className="text-xs">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {assigneeName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle className="w-3.5 h-3.5" />
            <span>{assigneeName}</span>
          </div>
        )}

        {nextStatus && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs"
            onClick={() => onStatusUpdate(task.id, nextStatus)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : nextStatus === "in_progress" ? (
              "Start Working"
            ) : (
              "Mark Complete"
            )}
          </Button>
        )}
      </GlassCard>
    </motion.div>
  );
}
