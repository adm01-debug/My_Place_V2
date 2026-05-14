import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { motion } from 'framer-motion';

interface LockoutState {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [lockoutState, setLockoutState] = useState<LockoutState | null>(null);
  const { signIn, signUp, isAuthenticated, checkAccountLocked } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (email && email.includes('@')) {
      const timer = setTimeout(async () => {
        const lockInfo = await checkAccountLocked(email);
        if (lockInfo.isLocked || lockInfo.remainingAttempts < 5) {
          setLockoutState({ isLocked: lockInfo.isLocked, remainingAttempts: lockInfo.remainingAttempts, lockedUntil: lockInfo.lockedUntil });
        } else {
          setLockoutState(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLockoutState(null);
    }
  }, [email, checkAccountLocked]);

  const resetForm = () => { setEmail(''); setPassword(''); setNome(''); setResetEmailSent(false); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast({ title: 'Campos obrigatórios', variant: 'destructive' }); return; }
    if (lockoutState?.isLocked) { toast({ title: 'Conta bloqueada', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: 'Bem-vindo!' });
      navigate('/');
    } else {
      if (result.lockoutInfo) {
        setLockoutState({ isLocked: result.lockoutInfo.isLocked, remainingAttempts: result.lockoutInfo.remainingAttempts, lockedUntil: result.lockoutInfo.lockedUntil });
      }
      toast({ title: 'Erro no login', description: result.error, variant: 'destructive' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) { toast({ title: 'Campos obrigatórios', variant: 'destructive' }); return; }
    if (password.length < 6) { toast({ title: 'Senha muito curta', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    const result = await signUp(email, password, nome);
    setIsSubmitting(false);
    if (result.success) {
      toast({ title: 'Conta criada!' });
      navigate('/');
    } else {
      toast({ title: 'Erro no cadastro', description: result.error, variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Email obrigatório', variant: 'destructive' }); return; }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });
    setIsSubmitting(false);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    setResetEmailSent(true);
    toast({ title: 'Email enviado!' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-120px] left-[-80px] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25"
          >
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Portal do Colaborador</h1>
            <p className="text-muted-foreground/80 mt-2">Acesse sua conta para continuar</p>
          </div>
        </div>

        <Card className="border-border/30 shadow-xl backdrop-blur-xl bg-card/80 supports-[backdrop-filter]:bg-card/60">
          {showForgotPassword ? (
            <CardContent className="pt-6">
              <ForgotPasswordForm
                email={email}
                isSubmitting={isSubmitting}
                resetEmailSent={resetEmailSent}
                onEmailChange={setEmail}
                onSubmit={handleForgotPassword}
                onBack={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
              />
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetForm(); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                    <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="mt-4">
                    <LoginForm
                      email={email}
                      password={password}
                      showPassword={showPassword}
                      isSubmitting={isSubmitting}
                      lockoutState={lockoutState}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      onSubmit={handleLogin}
                      onForgotPassword={() => setShowForgotPassword(true)}
                    />
                  </TabsContent>
                  <TabsContent value="signup" className="mt-4">
                    <SignupForm
                      email={email}
                      password={password}
                      nome={nome}
                      showPassword={showPassword}
                      isSubmitting={isSubmitting}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onNomeChange={setNome}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      onSubmit={handleSignUp}
                    />
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Portal do Colaborador — Todos os direitos reservados
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
