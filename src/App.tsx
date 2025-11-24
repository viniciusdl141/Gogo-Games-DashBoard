import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StudioManager from "./pages/StudioManager"; 
import PendingApproval from "./pages/PendingApproval"; 
import { SessionContextProvider, useSession } from "./components/SessionContextProvider";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider"; 
import { Loader2 } from "lucide-react"; // Importando Loader2

const queryClient = new QueryClient();

// Componente de rota protegida
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, profile, isLoading } = useSession();

  if (isLoading) {
    // Mostra um loader enquanto a sessão e o perfil estão sendo carregados
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gogo-cyan" />
        </div>
    ); 
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  // Verifica o status de aprovação
  if (profile && !profile.is_approved) {
      return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme"> 
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/studios" 
                element={
                  <ProtectedRoute>
                    <StudioManager />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider> 
  </QueryClientProvider>
);

export default App;