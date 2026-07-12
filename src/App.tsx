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
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { BackButton } from "@/components/layout/BackButton";
import { AnimatedPage } from "@/components/AnimatedPage";
import { SystemStatus } from "@/components/portal/SystemStatus";
import { PageLoader } from "@/components/ui/PageLoader";

const Login = lazy(() => import("./pages/Login"));
const Perfil = lazy(() => import("./pages/Perfil"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const Ponto = lazy(() => import("./pages/Ponto"));
const Ferias = lazy(() => import("./pages/Ferias"));
const Holerites = lazy(() => import("./pages/Holerites"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));
const Vales = lazy(() => import("./pages/Vales"));
const AdminLocais = lazy(() => import("./pages/AdminLocais"));
const AdminAprovacoes = lazy(() => import("./pages/AdminAprovacoes"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios"));
const AdminHolerites = lazy(() => import("./pages/AdminHolerites"));
const AdminRelatorios = lazy(() => import("./pages/AdminRelatorios"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminConfiguracoes = lazy(() => import("./pages/AdminConfiguracoes"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Documentos = lazy(() => import("./pages/Documentos"));
const FAQ = lazy(() => import("./pages/FAQ"));
const AdminAuditoria = lazy(() => import("./pages/AdminAuditoria"));
const Calculadoras = lazy(() => import("./pages/Calculadoras"));
const Kudos = lazy(() => import("./pages/Kudos"));
const Trilhas = lazy(() => import("./pages/Trilhas"));
const Emprestimos = lazy(() => import("./pages/Emprestimos"));
const Justificativas = lazy(() => import("./pages/Justificativas"));
const Feedback360 = lazy(() => import("./pages/Feedback360"));
const Metas = lazy(() => import("./pages/Metas"));
const Clima = lazy(() => import("./pages/Clima"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Ideias = lazy(() => import("./pages/Ideias"));
const Reembolsos = lazy(() => import("./pages/Reembolsos"));
const Atestados = lazy(() => import("./pages/Atestados"));
const ExitInterview = lazy(() => import("./pages/ExitInterview"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Reservas = lazy(() => import("./pages/Reservas"));
const Chamados = lazy(() => import("./pages/Chamados"));
const Politicas = lazy(() => import("./pages/Politicas"));
const Treinamentos = lazy(() => import("./pages/Treinamentos"));
const Epis = lazy(() => import("./pages/Epis"));
const Patrimonio = lazy(() => import("./pages/Patrimonio"));
const Viagens = lazy(() => import("./pages/Viagens"));
const Assinaturas = lazy(() => import("./pages/Assinaturas"));
const BusinessIntelligence = lazy(() => import("./pages/BusinessIntelligence"));
const AdminIntegracoes = lazy(() => import("./pages/AdminIntegracoes"));
const NotificacaoPreferencias = lazy(() => import("./pages/NotificacaoPreferencias"));

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

function Page({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PageErrorBoundary pageName={name}>
      <Suspense fallback={<PageLoader />}>
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
      <main id="main-content" className="pb-24 md:pb-8 px-4 max-w-7xl mx-auto w-full pt-4">
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
                <Route path="/vales" element={<Page name="Vales"><Vales /></Page>} />
                <Route path="/admin" element={<Page name="Dashboard Admin"><AdminDashboard /></Page>} />
                <Route path="/admin/locais" element={<Page name="Locais Permitidos"><AdminLocais /></Page>} />
                <Route path="/admin/aprovacoes" element={<Page name="Aprovações"><AdminAprovacoes /></Page>} />
                <Route path="/admin/usuarios" element={<Page name="Gestão de Usuários"><AdminUsuarios /></Page>} />
                <Route path="/admin/holerites" element={<Page name="Importação de Holerites"><AdminHolerites /></Page>} />
                <Route path="/admin/relatorios" element={<Page name="Relatórios Gerenciais"><AdminRelatorios /></Page>} />
                <Route path="/admin/configuracoes" element={<Page name="Configurações"><AdminConfiguracoes /></Page>} />
                <Route path="/notificacoes" element={<Page name="Notificacoes"><Notificacoes /></Page>} />
                <Route path="/documentos" element={<Page name="Documentos"><Documentos /></Page>} />
                <Route path="/faq" element={<Page name="FAQ"><FAQ /></Page>} />
                <Route path="/admin/auditoria" element={<Page name="Auditoria"><AdminAuditoria /></Page>} />
                <Route path="/calculadoras" element={<Page name="Calculadoras"><Calculadoras /></Page>} />
                <Route path="/kudos" element={<Page name="Kudos"><Kudos /></Page>} />
                <Route path="/trilhas" element={<Page name="Trilhas"><Trilhas /></Page>} />
                <Route path="/emprestimos" element={<Page name="Empréstimos"><Emprestimos /></Page>} />
                <Route path="/justificativas" element={<Page name="Justificativas"><Justificativas /></Page>} />
                <Route path="/feedback-360" element={<Page name="Feedback 360º"><Feedback360 /></Page>} />
                <Route path="/metas" element={<Page name="Metas & OKRs"><Metas /></Page>} />
                <Route path="/clima" element={<Page name="Clima Organizacional"><Clima /></Page>} />
                <Route path="/calendario" element={<Page name="Calendário Corporativo"><Calendario /></Page>} />
                <Route path="/ideias" element={<Page name="Central de Ideias"><Ideias /></Page>} />
                <Route path="/reembolsos" element={<Page name="Reembolsos"><Reembolsos /></Page>} />
                <Route path="/atestados" element={<Page name="Atestados & Afastamentos"><Atestados /></Page>} />
                <Route path="/exit-interview" element={<Page name="Pesquisa de Desligamento"><ExitInterview /></Page>} />
                <Route path="/onboarding" element={<Page name="Onboarding"><Onboarding /></Page>} />
                <Route path="/reservas" element={<Page name="Reservas de Salas & Recursos"><Reservas /></Page>} />
                <Route path="/chamados" element={<Page name="Central de Chamados"><Chamados /></Page>} />
                <Route path="/politicas" element={<Page name="Políticas Corporativas"><Politicas /></Page>} />
                <Route path="/treinamentos" element={<Page name="Treinamentos & Certificações"><Treinamentos /></Page>} />
                <Route path="/epis" element={<Page name="EPIs"><Epis /></Page>} />
                <Route path="/patrimonio" element={<Page name="Patrimônio"><Patrimonio /></Page>} />
                <Route path="/viagens" element={<Page name="Viagens Corporativas"><Viagens /></Page>} />
                <Route path="/assinaturas" element={<Page name="Assinatura de Documentos"><Assinaturas /></Page>} />
                <Route path="/bi" element={<Page name="Business Intelligence"><BusinessIntelligence /></Page>} />
                <Route path="/admin/integracoes" element={<Page name="Integrações Externas"><AdminIntegracoes /></Page>} />
                <Route path="/notificacoes/preferencias" element={<Page name="Preferências de Notificação"><NotificacaoPreferencias /></Page>} />
              </Route>
              <Route path="*" element={<Page name="Não encontrado"><NotFound /></Page>} />
            </Routes>
            <SystemStatus />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
