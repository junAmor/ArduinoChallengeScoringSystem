import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChartLine, Users, Gavel, Settings, Database, Search, Bell, Plus } from "lucide-react";
import { useLocation, useRoute } from "wouter";

interface HeaderProps {
  onAddNew?: () => void;
  addNewLabel?: string;
  onSearch?: (query: string) => void;
}

export function Header({ onAddNew, addNewLabel = "New Participant", onSearch }: HeaderProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isAdminDashboard] = useRoute("/admin/dashboard");
  const [isAdminParticipants] = useRoute("/admin/participants");
  const [isAdminJudges] = useRoute("/admin/judges");
  const [isAdminSettings] = useRoute("/admin/settings");
  const [isAdminBackup] = useRoute("/admin/backup");
  const [isAdminAccount] = useRoute("/admin/account");
  const [isJudgeEvaluate] = useRoute("/judge/evaluate");
  
  let icon = <ChartLine className="mr-2 text-primary" />;
  let title = "Dashboard";
  
  if (isAdminDashboard) {
    icon = <ChartLine className="mr-2 text-primary" />;
    title = "Leaderboard";
  } else if (isAdminParticipants) {
    icon = <Users className="mr-2 text-primary" />;
    title = "Participants";
  } else if (isAdminJudges) {
    icon = <Gavel className="mr-2 text-primary" />;
    title = "Judges";
  } else if (isAdminSettings) {
    icon = <Settings className="mr-2 text-primary" />;
    title = "Settings";
  } else if (isAdminBackup) {
    icon = <Database className="mr-2 text-primary" />;
    title = "Backup & Reset";
  } else if (isAdminAccount) {
    icon = <Users className="mr-2 text-primary" />;
    title = "Account";
  } else if (isJudgeEvaluate) {
    icon = <ChartLine className="mr-2 text-primary" />;
    title = "Evaluate Participants";
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center px-6 sticky top-0 z-[1] md:ml-64">
      <h2 className="text-xl font-semibold text-slate-800 flex items-center hidden sm:flex">
        {icon}
        {title}
      </h2>
      <div className="ml-auto flex items-center space-x-4">
        {/* {onSearch && (
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="py-2 pl-10 pr-4 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          </form>
        )}
        {/* <button className="p-2 rounded-md hover:bg-slate-100 text-slate-600">
          <Bell className="h-5 w-5" />
        </button> */}
        {onAddNew && (
          <Button onClick={onAddNew} className="hidden sm:flex">
            <Plus className="h-4 w-4 mr-1" />
            {addNewLabel}
          </Button>
        )}
        {onAddNew && (
          <Button onClick={onAddNew} className="sm:hidden p-2">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
