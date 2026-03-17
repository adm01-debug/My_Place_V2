import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Building2, Lock, Mail, User, Fingerprint, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { lovable } from '@/integrations/lovable/index';

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

  // Check lockout status when email changes
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

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutState?.isLocked && lockoutState.lockedUntil) {
      const interval = setInterval(() => {
        const now = new Date();
        if (lockoutState.lockedUntil && lockoutState.lockedUntil <= now) {
          setLockoutState(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha email e senha para continuar',
        variant: 'destructive',
      });
      return;
    }

    // Check if locked before attempting
    if (lockoutState?.isLocked) {
      toast({
        title: 'Conta bloqueada',
        description: 'Aguarde o tempo de bloqueio ou recupere sua senha',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso',
      });
      
      // Clear lockout state on success
      setLockoutState(null);
      
      // Offer to register biometric if available and not registered
      if (isAvailable && !isRegistered) {
        setTimeout(async () => {
          const { data } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
          if (data.user) {
            const biometricResult = await registerBiometric(email, data.user.id);
            if (biometricResult.success) {
              toast({
                title: 'Biometria ativada!',
                description: 'Na próxima vez, use Face ID/Touch ID para entrar mais rápido',
              });
            }
          }
        }, 500);
      }
      
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      navigate(onboardingCompleted ? '/' : '/onboarding');
    } else {
      // Update lockout state from result
      if (result.lockoutInfo) {
        setLockoutState({
          isLocked: result.lockoutInfo.isLocked,
          remainingAttempts: result.lockoutInfo.remainingAttempts,
          lockedUntil: result.lockoutInfo.lockedUntil,
        });
      }
      
      toast({
        title: 'Erro no login',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !nome) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para continuar',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password, nome);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso',
      });
      const onboardingCompleted = localStorage.getItem('onboarding_completed');
      navigate(onboardingCompleted ? '/' : '/onboarding');
    } else {
      toast({
        title: 'Erro no cadastro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNome('');
    setResetEmailSent(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email obrigatório',
        description: 'Digite seu email para recuperar a senha',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });
    
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setResetEmailSent(true);
    toast({
      title: 'Email enviado!',
      description: 'Verifique sua caixa de entrada para redefinir sua senha',
    });
  };

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);
    const result = await authenticateWithBiometric();
    
    if (result.success && result.email) {
      // For biometric login, we need the stored password or use a token-based approach
      // Since WebAuthn doesn't store passwords, we'll prompt for it once
      const storedPassword = localStorage.getItem(`biometric_pwd_${result.email}`);
      
      if (storedPassword) {
        const signInResult = await signIn(result.email, atob(storedPassword));
        setIsSubmitting(false);
        
        if (signInResult.success) {
          toast({
            title: 'Bem-vindo!',
            description: 'Login biométrico realizado com sucesso',
          });
          const onboardingCompleted = localStorage.getItem('onboarding_completed');
          navigate(onboardingCompleted ? '/' : '/onboarding');
        } else {
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login com email e senha',
            variant: 'destructive',
          });
          localStorage.removeItem(`biometric_pwd_${result.email}`);
        }
      } else {
        // First biometric use - ask for password to link
        setEmail(result.email);
        setIsSubmitting(false);
        toast({
          title: 'Confirme sua identidade',
          description: 'Digite sua senha para ativar o login biométrico',
        });
      }
    } else {
      setIsSubmitting(false);
      toast({
        title: 'Falha na autenticação',
        description: result.error || 'Tente novamente',
        variant: 'destructive',
      });
    }
  };

  // Store password securely for biometric login (encoded, not truly secure - just for demo)
  const handleLoginWithBiometricSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(e);
    
    // If login successful and biometric is available, store encoded password
    if (isAvailable && email && password) {
      localStorage.setItem(`biometric_pwd_${email}`, btoa(password));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up">
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
            // Forgot Password View
            <>
              <CardHeader className="space-y-1 pb-4">
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </button>
                <CardTitle className="text-xl">Recuperar senha</CardTitle>
                <CardDescription>
                  {resetEmailSent 
                    ? 'Verifique seu email para redefinir sua senha'
                    : 'Digite seu email para receber o link de recuperação'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resetEmailSent ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enviamos um link para <strong>{email}</strong>. 
                      Clique no link do email para criar uma nova senha.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}
                    >
                      Voltar ao login
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email corporativo</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu.email@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 font-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        'Enviar link de recuperação'
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </>
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
                <form onSubmit={handleLoginWithBiometricSetup} className="space-y-4">
                  {/* Biometric Login Button */}
                  {isAvailable && isRegistered && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full h-14 font-semibold border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
                      onClick={handleBiometricLogin}
                      disabled={isSubmitting}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fingerprint className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">Entrar com Face ID / Touch ID</div>
                          <div className="text-xs text-muted-foreground">{registeredEmail}</div>
                        </div>
                      </div>
                    </Button>
                  )}

                  {isAvailable && isRegistered && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou continue com email</span>
                      </div>
                    </div>
                  )}

                  {/* Lockout Warning */}
                  {lockoutState && (
                    <Alert variant={lockoutState.isLocked ? "destructive" : "default"} className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-sm">
                        {lockoutState.isLocked ? (
                          <>
                            <strong>Conta bloqueada temporariamente.</strong>
                            <br />
                            {lockoutState.lockedUntil && (
                              <span>
                                Tente novamente em {Math.max(1, Math.ceil((lockoutState.lockedUntil.getTime() - Date.now()) / 60000))} minuto(s) ou recupere sua senha.
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <strong>Atenção:</strong> {lockoutState.remainingAttempts} tentativa{lockoutState.remainingAttempts !== 1 ? 's' : ''} restante{lockoutState.remainingAttempts !== 1 ? 's' : ''} antes do bloqueio.
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu.email@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting || lockoutState?.isLocked}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isSubmitting || lockoutState?.isLocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 font-semibold"
                    disabled={isSubmitting || lockoutState?.isLocked}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Entrando...
                      </div>
                    ) : (
                      'Entrar'
                    )}
                   </Button>

                   {/* Divider */}
                   <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                       <span className="w-full border-t border-border" />
                     </div>
                     <div className="relative flex justify-center text-xs uppercase">
                       <span className="bg-card px-2 text-muted-foreground">ou</span>
                     </div>
                   </div>

                   {/* Google Login */}
                   <Button
                     type="button"
                     variant="outline"
                     className="w-full h-11 font-semibold"
                     disabled={isSubmitting}
                     onClick={async () => {
                       setIsSubmitting(true);
                       const { error } = await lovable.auth.signInWithOAuth('google', {
                         redirect_uri: window.location.origin,
                       });
                       if (error) {
                         toast({
                           title: 'Erro ao entrar com Google',
                           description: error instanceof Error ? error.message : 'Tente novamente',
                           variant: 'destructive',
                         });
                         setIsSubmitting(false);
                       }
                     }}
                   >
                     <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                       <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                       <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                       <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                       <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                     </svg>
                     Entrar com Google
                   </Button>

                   <button
                     type="button"
                     onClick={() => setShowForgotPassword(true)}
                     className="w-full text-sm text-primary hover:underline"
                   >
                     Esqueceu sua senha?
                   </button>

                  {isAvailable && !isRegistered && (
                    <p className="text-xs text-center text-muted-foreground">
                      <Fingerprint className="inline w-3 h-3 mr-1" />
                      Após o login, você poderá ativar Face ID / Touch ID
                    </p>
                  )}
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-nome"
                        type="text"
                        placeholder="Seu nome completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email corporativo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu.email@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Crie uma senha forte"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {password.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {/* Strength bar */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => {
                            const strength = (() => {
                              let score = 0;
                              if (password.length >= 6) score++;
                              if (password.length >= 8) score++;
                              if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
                              if (/[0-9]/.test(password)) score++;
                              if (/[^A-Za-z0-9]/.test(password)) score++;
                              return Math.min(score, 4);
                            })();
                            
                            const colors = [
                              'bg-destructive',
                              'bg-orange-500',
                              'bg-yellow-500',
                              'bg-green-500'
                            ];
                            
                            return (
                              <div
                                key={level}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  level <= strength ? colors[strength - 1] : 'bg-muted'
                                }`}
                              />
                            );
                          })}
                        </div>
                        
                        {/* Strength label */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Força: {(() => {
                              let score = 0;
                              if (password.length >= 6) score++;
                              if (password.length >= 8) score++;
                              if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
                              if (/[0-9]/.test(password)) score++;
                              if (/[^A-Za-z0-9]/.test(password)) score++;
                              const strength = Math.min(score, 4);
                              const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'];
                              return labels[strength - 1] || 'Muito fraca';
                            })()}
                          </span>
                        </div>
                        
                        {/* Requirements checklist */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {[
                            { text: '6+ caracteres', valid: password.length >= 6 },
                            { text: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
                            { text: 'Letra minúscula', valid: /[a-z]/.test(password) },
                            { text: 'Número', valid: /[0-9]/.test(password) },
                          ].map((req, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 
                                className={`w-3 h-3 ${req.valid ? 'text-green-500' : 'text-muted-foreground/40'}`} 
                              />
                              <span className={`text-xs ${req.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Criando conta...
                      </div>
                    ) : (
                      'Criar conta'
                    )}
                  </Button>
                </form>
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
