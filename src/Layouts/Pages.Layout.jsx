import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Sidebar } from "../components/Sidebar";

export default function PagesLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar />

        <SidebarInset className="flex flex-1 flex-col overflow-hidden">
          <Header />

          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>

          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
