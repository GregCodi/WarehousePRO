import { Switch, Route, useLocation, useRoute } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Categories from "@/pages/categories";
import Suppliers from "@/pages/suppliers";
import Movements from "@/pages/movements";
import QRScanner from "@/pages/qr-scanner";
import Reports from "@/pages/reports";
import Users from "@/pages/users";
import Layout from "@/components/layout";
import AuthGuard from "@/components/auth-guard";
import { useEffect } from "react";
import { loadAuthFromStorage } from "./lib/auth";

function Router() {
  const [match] = useRoute("/login");
  const [, setLocation] = useLocation();

  // Check if user is authenticated when app loads
  useEffect(() => {
    const user = loadAuthFromStorage();
    if (!user && !match) {
      setLocation("/login");
    }
  }, [match, setLocation]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <AuthGuard>
          <Layout>
            <Dashboard />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/inventory">
        <AuthGuard>
          <Layout>
            <Inventory />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/categories">
        <AuthGuard>
          <Layout>
            <Categories />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/suppliers">
        <AuthGuard>
          <Layout>
            <Suppliers />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/movements">
        <AuthGuard>
          <Layout>
            <Movements />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/qr-scanner">
        <AuthGuard>
          <Layout>
            <QRScanner />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/reports">
        <AuthGuard>
          <Layout>
            <Reports />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route path="/users">
        <AuthGuard allowedRoles={["admin"]}>
          <Layout>
            <Users />
          </Layout>
        </AuthGuard>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
