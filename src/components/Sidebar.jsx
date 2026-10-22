import {
  Sidebar as SidebarContainer,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Layers,
  User,
} from "lucide-react"
import { Link, useLocation } from "react-router"

export function Sidebar(props) {
  const location = useLocation()

  const navItems = [
    { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
    { title: "Projects", icon: FolderKanban, url: "/projects" },
    { title: "Users", icon: Users, url: "/users" },
    { title: "Profile", icon: User, url: "/profile" },
  ]

  return (
    <SidebarContainer {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-sidebar-foreground">TaskFlow</span>
            <span className="text-xs text-muted-foreground">Workspace</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== "/dashboard" && location.pathname.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link to={item.url} />}
                      isActive={isActive}
                      className="w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/80">
          <p className="font-semibold text-sidebar-foreground">TaskFlow Pro</p>
          <p className="mt-1 text-muted-foreground">Manage projects and tasks</p>
        </div>
      </SidebarFooter>
    </SidebarContainer>
  )
}

export default Sidebar
