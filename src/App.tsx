import { Suspense, lazy } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageErrorBoundary from "@/components/portal/PageErrorBoundary";
import Navbar from "@/components/layout/Navbar";

const Login = lazy(() => import("./pages/Login"));
const Perfil = lazy(() => import("./pages/Perfil"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Ponto = lazy(() => import("./pages/Ponto"));
const Ferias = lazy(() => import("./pages/Ferias"));
const Holerites = lazy(() => import("./pages/Holerites"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Page({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PageErrorBoundary pageName={name}>
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
    </ProtectedRoute>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Page name="Login"><Login /></Page>} />
              <Route path="/reset-password" element={<Page name="Redefinir Senha"><ResetPassword /></Page>} />
              <Route element={<AuthenticatedLayout />}>
                <Route path="/" element={<Page name="Home"><Home /></Page>} />
                <Route path="/perfil" element={<Page name="Perfil"><Perfil /></Page>} />
                <Route path="/ponto" element={<Page name="Ponto"><Ponto /></Page>} />
                <Route path="/ferias" element={<Page name="Férias"><Ferias /></Page>} />
                <Route path="/holerites" element={<Page name="Holerites"><Holerites /></Page>} />
                <Route path="/solicitacoes" element={<Page name="Solicitações"><Solicitacoes /></Page>} />
              </Route>
              <Route path="*" element={<Page name="Não encontrado"><NotFound /></Page>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
