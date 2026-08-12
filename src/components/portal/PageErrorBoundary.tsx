import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  showDetails?: boolean;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export default class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      import('@/lib/logger').then(({ createLogger }) => createLogger('PageErrorBoundary').error('Caught error:', error));
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleCopyError = async () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      import('@/lib/logger').then(({ createLogger }) => createLogger('PageErrorBoundary').error('Failed to copy:', err));
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied } = this.state;
      const { showDetails = import.meta.env.DEV, pageName } = this.props;

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                {pageName ? `Erro na página "${pageName}"` : 'Algo deu errado'}
              </CardTitle>
              <CardDescription>
                Desculpe, ocorreu um erro inesperado. Tente recarregar a página ou voltar ao início.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Mensagem de erro resumida */}
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-destructive">
                  {error?.message || 'Erro desconhecido'}
                </p>
              </div>

              {/* Detalhes técnicos (colapsável) */}
              {showDetails && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <Bug className="h-4 w-4" />
                      Detalhes técnicos
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3">
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                        {error?.stack}
                      </pre>
                      {errorInfo?.componentStack && (
                        <>
                          <hr className="my-2 border-border" />
                          <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                            Component Stack:{errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full gap-2"
                      onClick={this.handleCopyError}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar erro
                        </>
                      )}
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4" />
                Início
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Versão funcional com hooks para casos mais simples
export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Tente novamente.',
}: {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {error && (
          <p className="mt-2 text-xs text-destructive">{error.message}</p>
        )}
        {resetErrorBoundary && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={resetErrorBoundary}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}

// HOC para envolver páginas com error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    pageName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    fallback?: ReactNode;
  }
) {
  return function WithErrorBoundary(props: P) {
    return (
      <PageErrorBoundary
        pageName={options?.pageName}
        onError={options?.onError}
        fallback={options?.fallback}
      >
        <WrappedComponent {...props} />
      </PageErrorBoundary>
    );
  };
}

// Hook para reportar erros manualmente
export function useErrorReporter() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    import('@/lib/logger').then(({ createLogger }) => createLogger('ErrorReporter').error(`${context || 'Unknown'}:`, error));
    
    // Aqui você pode adicionar integração com Sentry, LogRocket, etc.
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: { context } });
    // }
  }, []);

  return { reportError };
}
