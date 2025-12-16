import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/holerites" element={<Holerites />} />
          <Route path="/ponto" element={<Ponto />} />
          <Route path="/ferias" element={<Ferias />} />
          <Route path="/variavel" element={<RemuneracaoVariavel />} />
          <Route path="/emprestimos" element={<Emprestimos />} />
          <Route path="/beneficios" element={<Beneficios />} />
          <Route path="/treinamentos" element={<Treinamentos />} />
          <Route path="/documentos" element={<Documentos />} />
          <Route path="/solicitacoes" element={<Solicitacoes />} />
          <Route path="/comunicados" element={<Comunicados />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
