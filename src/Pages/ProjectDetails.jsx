import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from "@/services/projectService"
import {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/taskService"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Users,
  UserPlus,
  User,
  Check,
} from "lucide-react"

export default function ProjectDetails() {
  const { projectId } = useParams()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")

  // Edit Project Modal
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Delete Project Confirmation
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false)
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false)

  // Manage Members Modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [memberLoading, setMemberLoading] = useState(false)
  const [memberError, setMemberError] = useState("")
  const [memberSuccess, setMemberSuccess] = useState("")

  // Create / Edit Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDesc, setTaskDesc] = useState("")
  const [taskStatus, setTaskStatus] = useState("todo")
  const [taskPriority, setTaskPriority] = useState("medium")
  const [taskDueDate, setTaskDueDate] = useState("")
  const [taskAssigneeId, setTaskAssigneeId] = useState("")
  const [taskLoading, setTaskLoading] = useState(false)
  const [taskError, setTaskError] = useState("")

  // Delete Task Confirmation
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [deleteTaskLoading, setDeleteTaskLoading] = useState(false)

  const reloadTasks = async () => {
    if (!projectId) return
    try {
      const taskList = await getProjectTasks(projectId)
      setTasks(taskList)
    } catch (err) {
      console.error("Error refreshing tasks:", err)
    }
  }

  const reloadMembers = async (memberIds) => {
    try {
      const memberDetails = await getProjectMembers(memberIds)
      setMembers(memberDetails)
    } catch (err) {
      console.error("Error refreshing members:", err)
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!projectId || !currentUser) return
      try {
        const proj = await getProjectById(projectId)
        if (ignore) return

        if (!proj) {
          setError("Project not found.")
          setLoading(false)
          return
        }

        const isMember =
          proj.memberIds?.includes(currentUser.uid) || proj.ownerId === currentUser.uid
        if (!isMember) {
          setError("Access Denied: You are not a member of this project.")
          setLoading(false)
          return
        }

        setProject(proj)
        setEditName(proj.name)
        setEditDesc(proj.description || "")

        const [taskList, memberList] = await Promise.all([
          getProjectTasks(projectId),
          getProjectMembers(proj.memberIds || [proj.ownerId]),
        ])

        if (!ignore) {
          setTasks(taskList)
          setMembers(memberList)
          setLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading project details:", err)
          setError("Failed to load project details.")
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [projectId, currentUser])

  const isOwner = project && project.ownerId === currentUser?.uid

  // Project Edit & Delete Handlers
  const handleUpdateProject = async (e) => {
    e.preventDefault()
    if (!editName || editName.trim().length < 3 || editName.trim().length > 80) {
      alert("Project name must be between 3 and 80 characters.")
      return
    }

    setEditLoading(true)
    try {
      await updateProject(projectId, { name: editName, description: editDesc })
      setProject((prev) => ({ ...prev, name: editName.trim(), description: editDesc.trim() }))
      setIsEditProjectOpen(false)
    } catch (err) {
      console.error("Update project error:", err)
      alert("Failed to update project: " + err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    setDeleteProjectLoading(true)
    try {
      await deleteProject(projectId)
      navigate("/projects")
    } catch (err) {
      console.error("Delete project error:", err)
      alert("Failed to delete project: " + err.message)
    } finally {
      setDeleteProjectLoading(false)
    }
  }

  // Member Management Handlers
  const handleAddMember = async (e) => {
    e.preventDefault()
    setMemberError("")
    setMemberSuccess("")

    if (!newMemberEmail || !newMemberEmail.trim()) {
      setMemberError("Please enter a valid email address.")
      return
    }

    setMemberLoading(true)
    try {
      const addedUser = await addProjectMember(projectId, newMemberEmail)
      setMemberSuccess(`Successfully added ${addedUser.fullName || addedUser.email} to the project.`)
      setNewMemberEmail("")

      // Update local project memberIds and members list
      const updatedMemberIds = [...(project.memberIds || []), addedUser.id]
      setProject((prev) => ({ ...prev, memberIds: updatedMemberIds }))
      await reloadMembers(updatedMemberIds)
    } catch (err) {
      console.error("Add member error:", err)
      setMemberError(err.message || "Failed to add member.")
    } finally {
      setMemberLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this member from the project? Their assigned tasks will be unassigned.")) {
      return
    }

    setMemberLoading(true)
    setMemberError("")
    setMemberSuccess("")
    try {
      await removeProjectMember(projectId, memberId, project.ownerId)
      const updatedMemberIds = (project.memberIds || []).filter((id) => id !== memberId)
      setProject((prev) => ({ ...prev, memberIds: updatedMemberIds }))
      await Promise.all([reloadMembers(updatedMemberIds), reloadTasks()])
      setMemberSuccess("Member removed and their tasks have been unassigned.")
    } catch (err) {
      console.error("Remove member error:", err)
      setMemberError(err.message || "Failed to remove member.")
    } finally {
      setMemberLoading(false)
    }
  }

  // Task Handlers
  const openCreateTaskModal = () => {
    setEditingTask(null)
    setTaskTitle("")
    setTaskDesc("")
    setTaskStatus("todo")
    setTaskPriority("medium")
    setTaskDueDate("")
    setTaskAssigneeId("")
    setTaskError("")
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task)
    setTaskTitle(task.title)
    setTaskDesc(task.description || "")
    setTaskStatus(task.status || "todo")
    setTaskPriority(task.priority || "medium")
    setTaskDueDate(task.dueDate || "")
    setTaskAssigneeId(task.assigneeId || "")
    setTaskError("")
    setIsTaskModalOpen(true)
  }

  const handleSaveTask = async (e) => {
    e.preventDefault()
    setTaskError("")

    if (!taskTitle || taskTitle.trim().length < 3 || taskTitle.trim().length > 120) {
      setTaskError("Task title must be between 3 and 120 characters.")
      return
    }

    setTaskLoading(true)
    try {
      if (editingTask) {
        // Update task
        await updateTask(projectId, editingTask.id, {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          status: taskStatus,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssigneeId || null,
        })
      } else {
        // Create task
        await createTask(projectId, {
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          status: taskStatus,
          priority: taskPriority,
          dueDate: taskDueDate || null,
          assigneeId: taskAssigneeId || null,
          createdBy: currentUser.uid,
        })
      }

      setIsTaskModalOpen(false)
      await reloadTasks()
    } catch (err) {
      console.error("Save task error:", err)
      setTaskError(err.message || "Failed to save task.")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(projectId, taskId, { status: newStatus })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
    } catch (err) {
      console.error("Status update error:", err)
      alert("Failed to update status: " + err.message)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return
    setDeleteTaskLoading(true)
    try {
      await deleteTask(projectId, taskToDelete.id)
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id))
      setTaskToDelete(null)
    } catch (err) {
      console.error("Delete task error:", err)
      alert("Failed to delete task: " + err.message)
    } finally {
      setDeleteTaskLoading(false)
    }
  }

  // Filter & Search Logic (SRS FR-13: Status, Priority, Assignee, and Title Search)
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    let matchesAssignee = true
    if (assigneeFilter === "me") {
      matchesAssignee = task.assigneeId === currentUser.uid
    } else if (assigneeFilter === "unassigned") {
      matchesAssignee = !task.assigneeId
    } else if (assigneeFilter !== "all") {
      matchesAssignee = task.assigneeId === assigneeFilter
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee
  })

  // Date utilities
  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === "done") return false
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  const formatDueDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return isNaN(d) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getMemberInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !project) {
    return (
      <DashboardLayout>
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
          <h2 className="text-lg font-semibold">{error || "Project Not Found"}</h2>
          <Link to="/projects" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Back to Projects
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Link & Project Header */}
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    isOwner
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {isOwner ? "Owner" : "Member"}
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-2xl">
                {project.description || "No project description provided."}
              </p>

              {/* Members Quick Preview Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {members.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      title={`${m.fullName} (${m.email})`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-semibold text-secondary-foreground"
                    >
                      {getMemberInitials(m.fullName)}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsMembersModalOpen(true)}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>{members.length} {members.length === 1 ? "Member" : "Members"}</span>
                  {isOwner && <span className="text-[10px] text-primary font-semibold">+ Manage</span>}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditProjectOpen(true)}
                    className="gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteProjectOpen(true)}
                    className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={openCreateTaskModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </div>

        {/* Task Discovery Bar: Search & Complete Filters (FR-13) */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            {/* Assignee Filter (FR-13) */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring max-w-[160px] truncate"
            >
              <option value="all">All Assignees</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks Grid / Cards */}
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/30">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold">No tasks found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mb-4">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"
                ? "No tasks match your current filters. Try resetting them."
                : "This project has no tasks yet. Create one to get moving!"}
            </p>
            {tasks.length === 0 ? (
              <Button size="sm" onClick={openCreateTaskModal} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create First Task
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setAssigneeFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status)
              const canEdit = isOwner || task.createdBy === currentUser.uid || task.assigneeId === currentUser.uid
              const canDelete = isOwner || task.createdBy === currentUser.uid

              const assignedMember = members.find((m) => m.id === task.assigneeId)

              return (
                <Card key={task.id} className="flex flex-col justify-between hover:border-foreground/20 transition">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                        {task.title}
                      </CardTitle>

                      {/* Priority Badge */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          task.priority === "high"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : task.priority === "medium"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                        {task.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-2">
                    {/* Assignee Information (FR-12) */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      {assignedMember ? (
                        <span className="font-medium text-foreground truncate">
                          {assignedMember.fullName}
                          {assignedMember.id === currentUser.uid && " (You)"}
                        </span>
                      ) : (
                        <span className="italic text-muted-foreground/70">Unassigned</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
                      {/* Status Selector (Quick update) */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={task.status}
                          onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                          className={`h-7 rounded-md px-2 text-xs font-medium border outline-none cursor-pointer ${
                            task.status === "done"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : task.status === "in_progress"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      {/* Due Date & Overdue Badge */}
                      {task.dueDate && (
                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                            overdue
                              ? "bg-destructive/10 text-destructive border border-destructive/20 font-semibold"
                              : "text-muted-foreground bg-muted/60"
                          }`}
                          title={overdue ? "Task is overdue!" : `Due: ${task.dueDate}`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{formatDueDate(task.dueDate)}</span>
                          {overdue && <span className="ml-0.5 uppercase text-[9px]">(Overdue)</span>}
                        </div>
                      )}
                    </div>

                    {/* Task Actions (Edit / Delete) */}
                    {(canEdit || canDelete) && (
                      <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-border/50">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditTaskModal(task)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Edit task"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setTaskToDelete(task)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Task Modal (Create & Edit with Assignee Selection FR-08, FR-12) */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
              <DialogDescription>
                {editingTask
                  ? "Update the details and properties of this task."
                  : "Add a new task to your project workflow."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {taskError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  {taskError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="taskTitle">Task Title *</Label>
                <Input
                  id="taskTitle"
                  placeholder="e.g. Implement authentication flow"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  maxLength={120}
                  required
                />
                <span className="text-xs text-muted-foreground">3 to 120 characters</span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="taskDesc">Description (Optional)</Label>
                <textarea
                  id="taskDesc"
                  placeholder="Add details, acceptance criteria, or context..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="taskStatus">Status</Label>
                  <select
                    id="taskStatus"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taskPriority">Priority</Label>
                  <select
                    id="taskPriority"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="taskDueDate">Due Date (Optional)</Label>
                  <Input
                    id="taskDueDate"
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                {/* Assignee Field (FR-12: Must be an active member of this project) */}
                <div className="grid gap-2">
                  <Label htmlFor="taskAssignee">Assignee</Label>
                  <select
                    id="taskAssignee"
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring truncate"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTaskModalOpen(false)}
                  disabled={taskLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={taskLoading}>
                  {taskLoading ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manage Project Members Modal (FR-07) */}
        <Dialog open={isMembersModalOpen} onOpenChange={setIsMembersModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Project Members
              </DialogTitle>
              <DialogDescription>
                Collaborators who can view, create, and be assigned tasks in this project.
              </DialogDescription>
            </DialogHeader>

            {/* Add Member Form (Owner Only) */}
            {isOwner && (
              <form onSubmit={handleAddMember} className="space-y-3 border-b border-border pb-4">
                <Label htmlFor="memberEmail" className="text-xs font-semibold">
                  Add New Member by Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="h-9 flex-1 text-sm"
                  />
                  <Button type="submit" size="sm" disabled={memberLoading} className="gap-1.5 shrink-0">
                    <UserPlus className="h-4 w-4" />
                    {memberLoading ? "Adding..." : "Add"}
                  </Button>
                </div>

                {memberError && (
                  <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive border border-destructive/20">
                    {memberError}
                  </div>
                )}
                {memberSuccess && (
                  <div className="rounded-md bg-emerald-500/10 p-2.5 text-xs text-emerald-600 border border-emerald-500/20 flex items-center gap-1.5">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{memberSuccess}</span>
                  </div>
                )}
              </form>
            )}

            {/* Current Members List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Members ({members.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border">
                {members.map((member) => {
                  const isProjectOwner = member.id === project.ownerId
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 text-sm hover:bg-muted/30 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {getMemberInitials(member.fullName)}
                        </div>
                        <div className="truncate">
                          <p className="font-medium text-foreground text-xs leading-none truncate">
                            {member.fullName}
                            {member.id === currentUser.uid && " (You)"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-1">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isProjectOwner
                              ? "bg-primary/15 text-primary border border-primary/20"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {isProjectOwner ? "Owner" : "Member"}
                        </span>

                        {isOwner && !isProjectOwner && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setIsMembersModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Task Confirmation */}
        <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Delete Task
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete task{" "}
                <strong className="text-foreground">{taskToDelete?.title}</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setTaskToDelete(null)}
                disabled={deleteTaskLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTask}
                disabled={deleteTaskLoading}
              >
                {deleteTaskLoading ? "Deleting..." : "Delete Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Project Modal */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project name and description.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateProject} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="editName">Project Name *</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={80}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editDesc">Description (Optional)</Label>
                <textarea
                  id="editDesc"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditProjectOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Project Modal */}
        <Dialog open={isDeleteProjectOpen} onOpenChange={setIsDeleteProjectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Delete Project
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete{" "}
                <strong className="text-foreground">{project?.name}</strong> and all of its tasks?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteProjectOpen(false)}
                disabled={deleteProjectLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleteProjectLoading}
              >
                {deleteProjectLoading ? "Deleting..." : "Delete Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
