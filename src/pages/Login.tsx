import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

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
  const { isAvailable, isRegistered, registeredEmail, registerBiometric, authenticateWithBiometric } = useBiometricAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      navigate(onboardingCompleted ? '/' : '/onboarding');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (email && email.includes('@')) {
      const timer = setTimeout(async () => {
        const lockInfo = await checkAccountLocked(email);
        if (lockInfo.isLocked || lockInfo.remainingAttempts < 5) {
          setLockoutState({
            isLocked: lockInfo.isLocked,
            remainingAttempts: lockInfo.remainingAttempts,
            lockedUntil: lockInfo.lockedUntil,
          });
        } else {
          setLockoutState(null);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setLockoutState(null);
    }
  }, [email, checkAccountLocked]);

  useEffect(() => {
    if (lockoutState?.isLocked && lockoutState.lockedUntil) {
      const interval = setInterval(() => {
        if (lockoutState.lockedUntil && lockoutState.lockedUntil <= new Date()) {
          setLockoutState(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutState]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNome('');
    setResetEmailSent(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha email e senha para continuar', variant: 'destructive' });
      return;
    }
    if (lockoutState?.isLocked) {
      toast({ title: 'Conta bloqueada', description: 'Aguarde o tempo de bloqueio ou recupere sua senha', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
      setLockoutState(null);
      
      if (isAvailable && !isRegistered) {
        setTimeout(async () => {
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const biometricResult = await registerBiometric(email, data.user.id);
            if (biometricResult.success) {
              toast({ title: 'Biometria ativada!', description: 'Na próxima vez, use Face ID/Touch ID para entrar mais rápido' });
            }
          }
        }, 500);
      }
      
      if (isAvailable && email && password) {
        localStorage.setItem(`biometric_pwd_${email}`, btoa(password));
      }
      
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      navigate(onboardingCompleted ? '/' : '/onboarding');
    } else {
      if (result.lockoutInfo) {
        setLockoutState({
          isLocked: result.lockoutInfo.isLocked,
          remainingAttempts: result.lockoutInfo.remainingAttempts,
          lockedUntil: result.lockoutInfo.lockedUntil,
        });
      }
      toast({ title: 'Erro no login', description: result.error, variant: 'destructive' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos para continuar', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password, nome);
    setIsSubmitting(false);

    if (result.success) {
      toast({ title: 'Conta criada!', description: 'Sua conta foi criada com sucesso' });
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      navigate(onboardingCompleted ? '/' : '/onboarding');
    } else {
      toast({ title: 'Erro no cadastro', description: result.error, variant: 'destructive' });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Email obrigatório', description: 'Digite seu email para recuperar a senha', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Erro ao enviar email', description: error.message, variant: 'destructive' });
      return;
    }
    setResetEmailSent(true);
    toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir sua senha' });
  };

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);
    const result = await authenticateWithBiometric();
    if (result.success && result.email) {
      const storedPassword = localStorage.getItem(`biometric_pwd_${result.email}`);
      if (storedPassword) {
        const signInResult = await signIn(result.email, atob(storedPassword));
        setIsSubmitting(false);
        if (signInResult.success) {
          toast({ title: 'Bem-vindo!', description: 'Login biométrico realizado com sucesso' });
          const onboardingCompleted = localStorage.getItem('onboarding_completed');
          navigate(onboardingCompleted ? '/' : '/onboarding');
        } else {
          toast({ title: 'Sessão expirada', description: 'Por favor, faça login com email e senha', variant: 'destructive' });
          localStorage.removeItem(`biometric_pwd_${result.email}`);
        }
      } else {
        setEmail(result.email);
        setIsSubmitting(false);
        toast({ title: 'Confirme sua identidade', description: 'Digite sua senha para ativar o login biométrico' });
      }
    } else {
      setIsSubmitting(false);
      toast({ title: 'Falha na autenticação', description: result.error || 'Tente novamente', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse motion-reduce:animate-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up motion-reduce:animate-none">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <Building2 className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Portal do Colaborador</h1>
            <p className="text-muted-foreground mt-2">Acesse sua conta para continuar</p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="glass-subtle border-border/50 shadow-xl">
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
                    <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
                    <CardDescription>Digite suas credenciais de acesso</CardDescription>
                  </TabsContent>
                  <TabsContent value="signup" className="mt-4">
                    <CardTitle className="text-xl">Criar nova conta</CardTitle>
                    <CardDescription>Preencha os dados para se cadastrar</CardDescription>
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab}>
                  <TabsContent value="login">
                    <LoginForm
                      email={email}
                      password={password}
                      showPassword={showPassword}
                      isSubmitting={isSubmitting}
                      lockoutState={lockoutState}
                      isAvailable={isAvailable}
                      isRegistered={isRegistered}
                      registeredEmail={registeredEmail}
                      onEmailChange={setEmail}
                      onPasswordChange={setPassword}
                      onTogglePassword={() => setShowPassword(!showPassword)}
                      onSubmit={handleLogin}
                      onBiometricLogin={handleBiometricLogin}
                      onForgotPassword={() => setShowForgotPassword(true)}
                      onGoogleError={(msg) => toast({ title: 'Erro ao entrar com Google', description: msg, variant: 'destructive' })}
                    />
                  </TabsContent>
                  <TabsContent value="signup">
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
              </CardContent>
            </>
          )}
        </Card>

        {/* Info */}
        <Card className="glass-subtle border-border/30">
          <CardContent className="py-4">
            <p className="text-xs text-center text-muted-foreground">
              Sistema seguro com autenticação criptografada
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
