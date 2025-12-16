import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/holerites" element={<ProtectedRoute><Holerites /></ProtectedRoute>} />
                <Route path="/ponto" element={<ProtectedRoute><Ponto /></ProtectedRoute>} />
                <Route path="/ferias" element={<ProtectedRoute><Ferias /></ProtectedRoute>} />
                <Route path="/variavel" element={<ProtectedRoute><RemuneracaoVariavel /></ProtectedRoute>} />
                <Route path="/emprestimos" element={<ProtectedRoute><Emprestimos /></ProtectedRoute>} />
                <Route path="/beneficios" element={<ProtectedRoute><Beneficios /></ProtectedRoute>} />
                <Route path="/treinamentos" element={<ProtectedRoute><Treinamentos /></ProtectedRoute>} />
                <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
                <Route path="/solicitacoes" element={<ProtectedRoute><Solicitacoes /></ProtectedRoute>} />
                <Route path="/comunicados" element={<ProtectedRoute><Comunicados /></ProtectedRoute>} />
                <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
