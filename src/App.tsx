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

const queryClient = new QueryClient();

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedPage><Suspense fallback={<RouteLoader />}><Login /></Suspense></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><Suspense fallback={<RouteLoader />}><ResetPassword /></Suspense></AnimatedPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Onboarding /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Dashboard /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Perfil /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/holerites" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Holerites /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/ponto" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Ponto /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/ferias" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Ferias /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/variavel" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><RemuneracaoVariavel /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/emprestimos" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Emprestimos /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/beneficios" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Beneficios /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/treinamentos" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Treinamentos /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/documentos" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Documentos /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/solicitacoes" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Solicitacoes /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/comunicados" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Comunicados /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Menu /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedAdminRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Admin /></Suspense></AnimatedPage></ProtectedAdminRoute>} />
        <Route path="/gestao" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><DashboardGestor /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/calculadora" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Calculadora /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><FAQ /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/organograma" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Organograma /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/calendario" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Calendario /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/metas" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Metas /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/feedback" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Feedback360 /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/clima" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><PesquisasClima /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/kudos" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Kudos /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="/trilhas" element={<ProtectedRoute><AnimatedPage><Suspense fallback={<RouteLoader />}><Trilhas /></Suspense></AnimatedPage></ProtectedRoute>} />
        <Route path="*" element={<AnimatedPage><Suspense fallback={<RouteLoader />}><NotFound /></Suspense></AnimatedPage>} />
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
