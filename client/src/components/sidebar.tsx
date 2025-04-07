import { useLocation, Link } from "wouter";
import { Cpu, ChartLine, Users, Gavel, Settings, Database, UserCog, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarProps {
  userRole: "admin" | "judge";
}

export function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const adminLinks = [
    { href: "/admin/dashboard", label: "Leaderboard", icon: ChartLine },
    { href: "/admin/participants", label: "Participants", icon: Users },
    { href: "/admin/judges", label: "Judges", icon: Gavel },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/backup", label: "Backup & Reset", icon: Database },
  ];
  
  const judgeLinks = [
    { href: "/judge/evaluate", label: "Evaluate", icon: ChartLine },
  ];
  
  const links = userRole === "admin" ? adminLinks : judgeLinks;
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-20">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="bg-white"
        >
          {isMobileMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </Button>
      </div>
      
      {/* Sidebar - desktop and mobile */}
      <div 
        className={cn(
          "bg-white w-64 border-r border-slate-200 flex flex-col h-screen fixed z-10 transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo and App Title */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-lg p-2">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800">Arduino Challenge</h1>
              <p className="text-xs text-slate-500">Scoring System</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 pl-3">
            {userRole === "admin" ? "Admin Dashboard" : "Judge Dashboard"}
          </div>
          
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <a className={cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-600 hover:bg-slate-50"
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{link.label}</span>
                </a>
              </Link>
            );
          })}
          
          <div className="border-t border-slate-200 my-4"></div>
          
          {userRole === "admin" && (
            <Link 
              href="/admin/account"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <a className={cn(
                "flex items-center px-3 py-2 rounded-md transition-colors",
                location === "/admin/account"
                  ? "bg-slate-100 text-slate-800"
                  : "text-slate-600 hover:bg-slate-50"
              )}>
                <UserCog className="w-5 h-5" />
                <span className="ml-3">Account</span>
              </a>
            </Link>
          )}
        </nav>
        
        {/* User Info */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-800 truncate" title={user?.name || ""}>
                {user?.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role}
              </p>
            </div>
            <button 
              className="ml-auto text-slate-500 hover:text-slate-700"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[5] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
