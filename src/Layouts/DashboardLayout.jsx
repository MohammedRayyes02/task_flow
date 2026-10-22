import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background text-foreground">
                <Sidebar />

                <SidebarInset className="flex flex-1 flex-col overflow-hidden">
                    <Header />

                    <main className="flex-1 p-6 w-full overflow-y-auto">
                        {children}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
