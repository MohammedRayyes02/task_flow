import { useState, useEffect } from "react"
import { Link } from "react-router"
import DashboardLayout from "../Layouts/DashboardLayout"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderKanban,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { getUserProjects } from "@/services/projectService"
import { getProjectTasks } from "@/services/taskService"

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth()
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return
      setLoading(true)
      try {
        const userProjects = await getUserProjects(currentUser.uid)
        setProjects(userProjects)

        // Fetch tasks for each accessible project in parallel
        const projectTaskPromises = userProjects.map(async (project) => {
          const tasks = await getProjectTasks(project.id)
          return tasks.map((t) => ({ ...t, projectName: project.name, projectId: project.id }))
        })

        const tasksNested = await Promise.all(projectTaskPromises)
        const flattenedTasks = tasksNested.flat().sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0
          const timeB = b.createdAt?.seconds || 0
          return timeB - timeA
        })

        setAllTasks(flattenedTasks)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [currentUser])

  // Helper for Overdue calculation (per SRS: dueDate < today and not done)
  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === "done") return false
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due < today
  }

  const totalTasksCount = allTasks.length
  const inProgressCount = allTasks.filter((t) => t.status === "in_progress").length
  const completedCount = allTasks.filter((t) => t.status === "done").length
  const overdueCount = allTasks.filter((t) => isOverdue(t.dueDate, t.status)).length

  const stats = [
    {
      label: "Total Projects",
      value: loading ? "-" : projects.length.toString(),
      change: `${projects.length} accessible workspace${projects.length === 1 ? "" : "s"}`,
      icon: FolderKanban,
      color: "text-primary",
      link: "/projects",
    },
    {
      label: "In Progress",
      value: loading ? "-" : inProgressCount.toString(),
      change: "Active workflow tasks",
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: "Completed",
      value: loading ? "-" : completedCount.toString(),
      change: totalTasksCount > 0 ? `${Math.round((completedCount / totalTasksCount) * 100)}% completion rate` : "No tasks yet",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Overdue Tasks",
      value: loading ? "-" : overdueCount.toString(),
      change: overdueCount > 0 ? "Action required" : "All on schedule",
      icon: AlertCircle,
      color: overdueCount > 0 ? "text-rose-500" : "text-muted-foreground",
    },
  ]

  const recentTasks = allTasks.slice(0, 6)

  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, <span className="font-semibold text-foreground">{displayName}</span>! Here is an overview of your active projects and task progress.
            </p>
          </div>
          <Link to="/projects">
            <Button className="w-fit gap-2">
              <Plus className="h-4 w-4" />
              Manage Projects & Tasks
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="mt-3">
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Accessible Projects Summary Banner */}
        {projects.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Your Projects</h2>
                <p className="text-xs text-muted-foreground">Jump directly to any of your active project boards</p>
              </div>
              <Link to="/projects" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {projects.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="group rounded-lg border border-border/80 bg-muted/30 p-3.5 hover:border-foreground/30 hover:bg-muted/50 transition"
                >
                  <p className="font-semibold text-sm group-hover:text-primary transition truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {p.description || "No description"}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{p.memberIds?.length || 1} members</span>
                    <span className="text-primary font-medium group-hover:underline">Open Board &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tasks Table */}
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Recent Tasks</h2>
              <p className="text-sm text-muted-foreground">Monitor and track your most recent project tasks</p>
            </div>
            {recentTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Showing {recentTasks.length} of {totalTasksCount}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading recent tasks...</p>
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold">No tasks created yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                Create a project to start adding and assigning tasks to your team.
              </p>
              <Link to="/projects">
                <Button size="sm">Go to Projects</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto p-2">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Task Name</th>
                    <th className="px-4 py-3 font-semibold">Project</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status)

                    return (
                      <tr key={task.id} className="hover:bg-muted/40 transition">
                        <td className="px-4 py-3.5 font-medium">
                          <Link to={`/projects/${task.projectId}`} className="hover:underline">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          <Link to={`/projects/${task.projectId}`} className="hover:underline">
                            {task.projectName}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.priority === "high"
                                ? "bg-rose-500/10 text-rose-500"
                                : task.priority === "medium"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.status === "done"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : task.status === "in_progress"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {task.status === "done"
                              ? "Completed"
                              : task.status === "in_progress"
                              ? "In Progress"
                              : "To Do"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground text-xs">
                          {task.dueDate ? (
                            <span className={overdue ? "text-destructive font-semibold" : ""}>
                              {task.dueDate} {overdue && "(Overdue)"}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
