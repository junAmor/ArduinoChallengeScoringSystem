import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  redirect = false,
}: {
  path: string;
  component: () => React.JSX.Element;
  adminOnly?: boolean;
  redirect?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if admin role is required but user is not admin
  if (adminOnly && user.role !== "admin") {
    return (
      <Route path={path}>
        <Redirect to={user.role === "judge" ? "/judge/evaluate" : "/auth"} />
      </Route>
    );
  }

  // For root path, redirect based on role
  if (redirect && path === "/") {
    return (
      <Route path={path}>
        <Redirect to={user.role === "admin" ? "/admin/dashboard" : "/judge/evaluate"} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />
}
