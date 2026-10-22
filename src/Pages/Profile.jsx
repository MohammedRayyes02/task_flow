import { useState } from "react"
import { useNavigate } from "react-router"
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
  User,
  Mail,
  Shield,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react"

export default function Profile() {
  const { currentUser, userProfile, updateUserProfileData, deleteUserAccount } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState("")

  // Delete Account Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const displayInputValue = fullName !== "" ? fullName : (userProfile?.fullName || currentUser?.displayName || "")

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdateError("")
    setUpdateSuccess("")

    const nameToSubmit = displayInputValue.trim()
    if (!nameToSubmit || nameToSubmit.length < 2) {
      setUpdateError("Full name must be at least 2 characters.")
      return
    }

    setUpdateLoading(true)
    try {
      await updateUserProfileData({ fullName: nameToSubmit })
      setFullName(nameToSubmit)
      setUpdateSuccess("Your profile details have been updated successfully.")
    } catch (err) {
      console.error("Profile update error:", err)
      setUpdateError(err.message || "Failed to update profile.")
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError("")

    if (!confirmPassword) {
      setDeleteError("Please enter your current password to confirm deletion.")
      return
    }

    setDeleteLoading(true)
    try {
      await deleteUserAccount(confirmPassword)
      navigate("/register")
    } catch (err) {
      console.error("Delete account error:", err)
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setDeleteError("Incorrect password. Please verify and try again.")
      } else if (err.code === "auth/requires-recent-login") {
        setDeleteError("Security timeout: Please log out and log in again before deleting your account.")
      } else {
        setDeleteError(err.message || "Failed to delete account.")
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (val) => {
    if (!val) return "-"
    const d = val.toDate ? val.toDate() : new Date(val.seconds * 1000 || val)
    return isNaN(d) ? "-" : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View your personal information, update your display details, or manage your account.
          </p>
        </div>

        {/* Profile Overview Banner */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
            {getInitials(userProfile?.fullName || currentUser?.displayName || currentUser?.email)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold">{userProfile?.fullName || "User"}</h2>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                {userProfile?.role || "User"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Member since {formatDate(userProfile?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your name as it appears to other team members on projects and tasks.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleUpdateProfile}>
            <CardContent className="space-y-4">
              {updateSuccess && (
                <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-600 border border-emerald-500/20 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              {updateError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  {updateError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="fullName" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={displayInputValue}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={currentUser?.email || ""}
                  disabled
                  className="bg-muted/50 cursor-not-allowed opacity-80"
                />
                <span className="text-[11px] text-muted-foreground">
                  Email is used for authentication and cannot be changed here.
                </span>
              </div>

              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Account Role
                </Label>
                <Input
                  value={userProfile?.role || "User"}
                  disabled
                  className="bg-muted/50 cursor-not-allowed opacity-80"
                />
              </div>
            </CardContent>

            <CardFooter className="border-t border-border pt-4 flex justify-end">
              <Button type="submit" disabled={updateLoading}>
                {updateLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Danger Zone: Delete Account */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              Irreversible actions that permanently affect your account access and data.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Deleting your account will remove your user profile from TaskFlow and revoke all access to projects. This action cannot be reversed.
            </p>
          </CardContent>

          <CardFooter className="border-t border-destructive/20 pt-4 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Permanently delete this account</span>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmPassword("")
                setDeleteError("")
                setIsDeleteOpen(true)
              }}
            >
              Delete Account
            </Button>
          </CardFooter>
        </Card>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirm Account Deletion
              </DialogTitle>
              <DialogDescription>
                Are you absolutely sure? This will permanently delete your TaskFlow account and profile.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {deleteError && (
                <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  {deleteError}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Enter your password to confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Current password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Permanently Delete Account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
