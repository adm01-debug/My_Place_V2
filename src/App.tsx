import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AnimatedPage } from "@/components/AnimatedPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import PageErrorBoundary from "@/components/portal/PageErrorBoundary";

// Route-level code splitting
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Holerites = lazy(() => import("./pages/Holerites"));
const Ponto = lazy(() => import("./pages/Ponto"));
const Ferias = lazy(() => import("./pages/Ferias"));
const RemuneracaoVariavel = lazy(() => import("./pages/RemuneracaoVariavel"));
const Emprestimos = lazy(() => import("./pages/Emprestimos"));
const Beneficios = lazy(() => import("./pages/Beneficios"));
const Treinamentos = lazy(() => import("./pages/Treinamentos"));
const Documentos = lazy(() => import("./pages/Documentos"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));
const Comunicados = lazy(() => import("./pages/Comunicados"));
const Menu = lazy(() => import("./pages/Menu"));
const Admin = lazy(() => import("./pages/Admin"));
const DashboardGestor = lazy(() => import("./pages/DashboardGestor"));
const Calculadora = lazy(() => import("./pages/Calculadora"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Organograma = lazy(() => import("./pages/Organograma"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Metas = lazy(() => import("./pages/Metas"));
const Feedback360 = lazy(() => import("./pages/Feedback360"));
const PesquisasClima = lazy(() => import("./pages/PesquisasClima"));
const Kudos = lazy(() => import("./pages/Kudos"));
const Trilhas = lazy(() => import("./pages/Trilhas"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 min
      gcTime: 5 * 60 * 1000, // 5 min
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (auth, validation)
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
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

/** Wraps a page component with Suspense + ErrorBoundary */
function Page({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PageErrorBoundary pageName={name}>
      <Suspense fallback={<RouteLoader />}>
        {children}
      </Suspense>
    </PageErrorBoundary>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedPage><Page name="Login"><Login /></Page></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><Page name="Redefinir Senha"><ResetPassword /></Page></AnimatedPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><AnimatedPage><Page name="Onboarding"><Onboarding /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><AnimatedPage><Page name="Dashboard"><Dashboard /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AnimatedPage><Page name="Perfil"><Perfil /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/holerites" element={<ProtectedRoute><AnimatedPage><Page name="Holerites"><Holerites /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/ponto" element={<ProtectedRoute><AnimatedPage><Page name="Ponto"><Ponto /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/ferias" element={<ProtectedRoute><AnimatedPage><Page name="Férias"><Ferias /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/variavel" element={<ProtectedRoute><AnimatedPage><Page name="Remuneração Variável"><RemuneracaoVariavel /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/emprestimos" element={<ProtectedRoute><AnimatedPage><Page name="Empréstimos"><Emprestimos /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/beneficios" element={<ProtectedRoute><AnimatedPage><Page name="Benefícios"><Beneficios /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/treinamentos" element={<ProtectedRoute><AnimatedPage><Page name="Treinamentos"><Treinamentos /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/documentos" element={<ProtectedRoute><AnimatedPage><Page name="Documentos"><Documentos /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/solicitacoes" element={<ProtectedRoute><AnimatedPage><Page name="Solicitações"><Solicitacoes /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/comunicados" element={<ProtectedRoute><AnimatedPage><Page name="Comunicados"><Comunicados /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute><AnimatedPage><Page name="Menu"><Menu /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedAdminRoute><AnimatedPage><Page name="Admin"><Admin /></Page></AnimatedPage></ProtectedAdminRoute>} />
        <Route path="/gestao" element={<ProtectedRoute><AnimatedPage><Page name="Gestão"><DashboardGestor /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/calculadora" element={<ProtectedRoute><AnimatedPage><Page name="Calculadora"><Calculadora /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><AnimatedPage><Page name="FAQ"><FAQ /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/organograma" element={<ProtectedRoute><AnimatedPage><Page name="Organograma"><Organograma /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><AnimatedPage><Page name="Calendário"><Calendario /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/metas" element={<ProtectedRoute><AnimatedPage><Page name="Metas"><Metas /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><AnimatedPage><Page name="Feedback 360"><Feedback360 /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/clima" element={<ProtectedRoute><AnimatedPage><Page name="Pesquisas de Clima"><PesquisasClima /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/kudos" element={<ProtectedRoute><AnimatedPage><Page name="Kudos"><Kudos /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="/trilhas" element={<ProtectedRoute><AnimatedPage><Page name="Trilhas"><Trilhas /></Page></AnimatedPage></ProtectedRoute>} />
        <Route path="*" element={<AnimatedPage><Page name="Página não encontrada"><NotFound /></Page></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <AnimatedRoutes />
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
