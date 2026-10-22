import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate, Link } from "react-router"

export function Header() {
  const { currentUser, userProfile, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split("@")[0] || "User"
  const email = userProfile?.email || currentUser?.email || ""

  const getInitials = (name) => {
    if (!name) return "TF"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (err) {
      console.error("Logout error:", err)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-3 sm:gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">TaskFlow</span>
          <span>/</span>
          <span>Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <Link
            to="/profile"
            className="flex items-center gap-2 hover:opacity-85 transition group"
            title="View Profile"
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs sm:text-sm group-hover:ring-2 group-hover:ring-primary/30 transition">
              {getInitials(displayName)}
            </div>
            <div className="hidden text-left text-xs sm:block max-w-[140px] truncate">
              <p className="font-medium text-foreground truncate group-hover:text-primary transition">{displayName}</p>
              <p className="text-muted-foreground truncate">{email}</p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header
