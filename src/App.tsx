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
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Holerites from "./pages/Holerites";
import Ponto from "./pages/Ponto";
import Ferias from "./pages/Ferias";
import RemuneracaoVariavel from "./pages/RemuneracaoVariavel";
import Emprestimos from "./pages/Emprestimos";
import Beneficios from "./pages/Beneficios";
import Treinamentos from "./pages/Treinamentos";
import Documentos from "./pages/Documentos";
import Solicitacoes from "./pages/Solicitacoes";
import Comunicados from "./pages/Comunicados";
import Menu from "./pages/Menu";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/onboarding" element={<ProtectedRoute><AnimatedPage><Onboarding /></AnimatedPage></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><AnimatedPage><Dashboard /></AnimatedPage></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AnimatedPage><Perfil /></AnimatedPage></ProtectedRoute>} />
        <Route path="/holerites" element={<ProtectedRoute><AnimatedPage><Holerites /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ponto" element={<ProtectedRoute><AnimatedPage><Ponto /></AnimatedPage></ProtectedRoute>} />
        <Route path="/ferias" element={<ProtectedRoute><AnimatedPage><Ferias /></AnimatedPage></ProtectedRoute>} />
        <Route path="/variavel" element={<ProtectedRoute><AnimatedPage><RemuneracaoVariavel /></AnimatedPage></ProtectedRoute>} />
        <Route path="/emprestimos" element={<ProtectedRoute><AnimatedPage><Emprestimos /></AnimatedPage></ProtectedRoute>} />
        <Route path="/beneficios" element={<ProtectedRoute><AnimatedPage><Beneficios /></AnimatedPage></ProtectedRoute>} />
        <Route path="/treinamentos" element={<ProtectedRoute><AnimatedPage><Treinamentos /></AnimatedPage></ProtectedRoute>} />
        <Route path="/documentos" element={<ProtectedRoute><AnimatedPage><Documentos /></AnimatedPage></ProtectedRoute>} />
        <Route path="/solicitacoes" element={<ProtectedRoute><AnimatedPage><Solicitacoes /></AnimatedPage></ProtectedRoute>} />
        <Route path="/comunicados" element={<ProtectedRoute><AnimatedPage><Comunicados /></AnimatedPage></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute><AnimatedPage><Menu /></AnimatedPage></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedAdminRoute><AnimatedPage><Admin /></AnimatedPage></ProtectedAdminRoute>} />
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
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
