import { Suspense, lazy } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageErrorBoundary from "@/components/portal/PageErrorBoundary";
import Navbar from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BackButton } from "@/components/layout/BackButton";
import { AnimatePresence } from 'framer-motion';
import { AnimatedPage } from "@/components/AnimatedPage";


const Login = lazy(() => import("./pages/Login"));
const Perfil = lazy(() => import("./pages/Perfil"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Ponto = lazy(() => import("./pages/Ponto"));
const Ferias = lazy(() => import("./pages/Ferias"));
const Holerites = lazy(() => import("./pages/Holerites"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));
const AdminLocais = lazy(() => import("./pages/AdminLocais"));
const AdminAprovacoes = lazy(() => import("./pages/AdminAprovacoes"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios"));

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
        <AnimatedPage>
          {children}
        </AnimatedPage>
      </Suspense>
    </PageErrorBoundary>
  );
}

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="main-content" className="pb-16 md:pb-0 px-4 max-w-7xl mx-auto w-full pt-4">
        <div className="md:hidden mb-2">
          <BackButton />
        </div>
        <Breadcrumbs />
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
                <Route path="/admin/locais" element={<Page name="Locais Permitidos"><AdminLocais /></Page>} />
                <Route path="/admin/aprovacoes" element={<Page name="Aprovações"><AdminAprovacoes /></Page>} />
                <Route path="/admin/usuarios" element={<Page name="Gestão de Usuários"><AdminUsuarios /></Page>} />
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
