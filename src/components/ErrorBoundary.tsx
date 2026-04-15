import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// TIPOS
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// COMPONENTE DE ERRO PADRÃO
// ============================================================================

interface DefaultErrorUIProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
  showDetails?: boolean;
}

const DefaultErrorUI: React.FC<DefaultErrorUIProps> = ({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = false,
}) => {
  const isDev = import.meta.env.DEV;
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Ops! Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {(showDetails || isDev) && error && (
            <div className="rounded-lg bg-muted p-4 text-sm">
              <div className="flex items-center gap-2 mb-2 font-medium text-destructive">
                <Bug className="h-4 w-4" />
                {error.name}: {error.message}
              </div>
              {isDev && errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver detalhes técnicos
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-background rounded">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onGoHome}>
            <Home className="h-4 w-4 mr-2" />
            Página Inicial
          </Button>
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

// ============================================================================
// ERROR BOUNDARY CLASS
// ============================================================================

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Callback opcional para logging (Sentry, etc)
    this.props.onError?.(error, errorInfo);
    
    // Log para console em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão
      return (
        <DefaultErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HOOKS PARA ERRO EM FUNCTIONAL COMPONENTS
// ============================================================================

interface UseErrorHandlerReturn {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  throwError: (error: Error) => never;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = React.useState<Error | null>(null);
  
  const clearError = React.useCallback(() => setError(null), []);
  
  const throwError = React.useCallback((error: Error): never => {
    setError(error);
    throw error;
  }, []);

  // Se houver erro, re-throw para o ErrorBoundary capturar
  if (error) {
    throw error;
  }

  return { error, setError, clearError, throwError };
};

// ============================================================================
// ERROR BOUNDARY PARA PÁGINAS
// ============================================================================

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({
  children,
  pageName,
}) => {
  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    // Em produção, enviar para serviço de monitoramento
    console.error(`Error in page ${pageName || 'unknown'}:`, error);
    
    // Aqui você pode integrar com Sentry, LogRocket, etc
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    // }
  }, [pageName]);

  return (
    <ErrorBoundary onError={handleError} showDetails={false}>
      {children}
    </ErrorBoundary>
  );
};

// ============================================================================
// ERROR BOUNDARY INLINE (para seções da página)
// ============================================================================

interface InlineErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export const InlineErrorBoundary: React.FC<InlineErrorBoundaryProps> = ({
  children,
  fallbackMessage = 'Erro ao carregar esta seção',
}) => {
  const fallback = (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
      <AlertTriangle className="h-5 w-5 text-destructive mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{fallbackMessage}</p>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
};

// ============================================================================
// COMPONENTE DE RETRY AUTOMÁTICO
// ============================================================================

interface RetryErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  onMaxRetriesReached?: (error: Error) => void;
}

interface RetryErrorBoundaryState extends ErrorBoundaryState {
  retryCount: number;
}

export class RetryErrorBoundary extends Component<RetryErrorBoundaryProps, RetryErrorBoundaryState> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: RetryErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<RetryErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { maxRetries = 3, retryDelay = 1000, onMaxRetriesReached } = this.props;
    
    this.setState({ errorInfo });
    
    if (this.state.retryCount < maxRetries) {
      this.retryTimeoutId = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null as Error | null,
          errorInfo: null as React.ErrorInfo | null,
          retryCount: prev.retryCount + 1,
        }));
      }, retryDelay * (this.state.retryCount + 1)); // Backoff exponencial
    } else {
      onMaxRetriesReached?.(error);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render(): ReactNode {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.hasError && this.state.retryCount >= maxRetries) {
      return (
        <DefaultErrorUI
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null, retryCount: 0 })}
          onGoHome={() => window.location.href = '/'}
        />
      );
    }

    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Tentando novamente... ({this.state.retryCount + 1}/{maxRetries})
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
