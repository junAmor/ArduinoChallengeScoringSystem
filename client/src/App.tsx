import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

// Admin Routes
import AdminDashboard from "@/pages/admin/dashboard";
import AdminParticipants from "@/pages/admin/participants";
import AdminJudges from "@/pages/admin/judges";
import AdminSettings from "@/pages/admin/settings";
import AdminBackup from "@/pages/admin/backup";
import AdminAccount from "@/pages/admin/account";

// Judge Routes
import JudgeEvaluate from "@/pages/judge/evaluate";

// Public Routes
import LeaderboardFullscreen from "@/pages/leaderboard-fullscreen";

function Router() {
  return (
    <Switch>
      {/* Auth Route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/participants" component={AdminParticipants} adminOnly />
      <ProtectedRoute path="/admin/judges" component={AdminJudges} adminOnly />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} adminOnly />
      <ProtectedRoute path="/admin/backup" component={AdminBackup} adminOnly />
      <ProtectedRoute path="/admin/account" component={AdminAccount} adminOnly />
      
      {/* Judge Routes */}
      <ProtectedRoute path="/judge/evaluate" component={JudgeEvaluate} />
      
      {/* Public Routes */}
      <Route path="/leaderboard/fullscreen" component={LeaderboardFullscreen} />
      
      {/* Root redirects based on user role */}
      <ProtectedRoute path="/" component={() => null} redirect />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
