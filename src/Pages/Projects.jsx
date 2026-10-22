import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
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
  getUserProjects,
  createProject,
  deleteProject,
} from "@/services/projectService"
import {
  FolderKanban,
  Plus,
  Users,
  Trash2,
  Calendar,
  AlertCircle,
} from "lucide-react"

export default function Projects() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Create Project Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [projectDesc, setProjectDesc] = useState("")
  const [createLoading, setCreateLoading] = useState(false)
  const [formError, setFormError] = useState("")

  // Delete Confirmation Dialog State
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const refreshProjects = async () => {
    if (!currentUser) return
    try {
      const data = await getUserProjects(currentUser.uid)
      setProjects(data)
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects. Please try again.")
    }
  }

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!currentUser) return
      try {
        const data = await getUserProjects(currentUser.uid)
        if (!ignore) {
          setProjects(data)
          setLoading(false)
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error fetching projects:", err)
          setError("Failed to load projects. Please try again.")
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      ignore = true
    }
  }, [currentUser])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setFormError("")

    if (projectName.trim().length < 3 || projectName.trim().length > 80) {
      setFormError("Project name must be between 3 and 80 characters.")
      return
    }

    setCreateLoading(true)
    try {
      const created = await createProject({
        name: projectName,
        description: projectDesc,
        ownerId: currentUser.uid,
      })
      setIsCreateOpen(false)
      setProjectName("")
      setProjectDesc("")
      // Refresh list and optionally navigate
      await refreshProjects()
      navigate(`/projects/${created.id}`)
    } catch (err) {
      console.error("Create project error:", err)
      setFormError(err.message || "Failed to create project.")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    setDeleteLoading(true)
    try {
      await deleteProject(projectToDelete.id)
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      setProjectToDelete(null)
    } catch (err) {
      console.error("Delete project error:", err)
      alert("Failed to delete project: " + err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (val) => {
    if (!val) return "-"
    const d = val.toDate ? val.toDate() : new Date(val.seconds * 1000 || val)
    return isNaN(d) ? "-" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage software projects, members, and task workflows.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-card p-6 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-12 text-center bg-card/40">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-5">
              Get started by creating your first project to organize tasks and collaborate with your team.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const isOwner = project.ownerId === currentUser.uid
              const memberCount = project.memberIds?.length || 1

              return (
                <Card key={project.id} className="flex flex-col justify-between hover:shadow-md transition">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl font-bold truncate">
                        <Link to={`/projects/${project.id}`} className="hover:underline">
                          {project.name}
                        </Link>
                      </CardTitle>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${
                          isOwner
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {isOwner ? "Owner" : "Member"}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2 text-sm min-h-[40px]">
                      {project.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="border-t border-border pt-4 flex items-center justify-between">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View Board
                      </Button>
                    </Link>

                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setProjectToDelete(project)}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Project Modal */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new project space for tasks and collaboration.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  {formError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g. Website Redesign"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  maxLength={80}
                  required
                />
                <span className="text-xs text-muted-foreground">3 to 80 characters</span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="projectDesc">Description (Optional)</Label>
                <textarea
                  id="projectDesc"
                  placeholder="Briefly describe the project goals..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Confirm Project Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete project{" "}
                <strong className="text-foreground">{projectToDelete?.name}</strong>?
                This will permanently delete the project and all of its tasks. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setProjectToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteProject}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
