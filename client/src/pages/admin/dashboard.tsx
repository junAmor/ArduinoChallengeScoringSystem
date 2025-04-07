import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Leaderboard } from "@/components/leaderboard";
import { PerformanceStats } from "@/components/performance-stats";
import { TopPerformers } from "@/components/top-performers";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;
  if (user.role !== "admin") {
    return <Redirect to="/judge/evaluate" />;
  }
  
  const handleExport = () => {
    // In a real application, this would generate a PDF or Excel file
    toast({
      title: "Export feature",
      description: "This would generate an exportable leaderboard file in a real application",
    });
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
        <Header onSearch={(query) => console.log("Search:", query)} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <Leaderboard onExport={handleExport} />
          <PerformanceStats />
          <TopPerformers />
        </main>
      </div>
    </div>
  );
}
