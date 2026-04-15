// =====================================================
// MONITORING & ANALYTICS UTILITIES
// =====================================================

// =====================================================
// ERROR TRACKING (Sentry-like)
// =====================================================

interface ErrorContext {
  user?: { id: string; email?: string };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private dsn: string | null = null;
  private enabled = false;
  private context: ErrorContext = {};

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  init(dsn: string): void {
    this.dsn = dsn;
    this.enabled = true;
    this.setupGlobalHandlers();
    console.log('[ErrorTracker] Initialized');
  }

  setUser(user: { id: string; email?: string }): void {
    this.context.user = user;
  }

  setTags(tags: Record<string, string>): void {
    this.context.tags = { ...this.context.tags, ...tags };
  }

  captureException(error: Error, context?: Partial<ErrorContext>): void {
    if (!this.enabled) {
      console.error('[ErrorTracker] Not enabled:', error);
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: { ...this.context, ...context },
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // In production, send to error tracking service
    console.error('[ErrorTracker] Captured:', payload);
    
    // Example: Send to endpoint
    // fetch('/api/errors', { method: 'POST', body: JSON.stringify(payload) });
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.enabled) return;

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      url: window.location.href,
    };

    console.log(`[ErrorTracker] ${level}:`, payload);
  }

  private setupGlobalHandlers(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureException(error || new Error(String(message)), {
        extra: { source, lineno, colno },
      });
    };

    window.onunhandledrejection = (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
    };
  }
}

export const errorTracker = ErrorTracker.getInstance();

// =====================================================
// ANALYTICS
// =====================================================

type EventName = 
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'feature_used'
  | 'error'
  | 'performance'
  | 'pwa_install'
  | 'pwa_update';

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, any>;
  timestamp?: Date;
}

class Analytics {
  private static instance: Analytics;
  private enabled = false;
  private queue: AnalyticsEvent[] = [];
  private userId: string | null = null;

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  init(): void {
    this.enabled = true;
    this.flushQueue();
    console.log('[Analytics] Initialized');
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId;
    this.track('page_view', { identified: true, ...traits });
  }

  track(name: EventName, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        userId: this.userId,
        url: window.location.pathname,
        referrer: document.referrer,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      },
      timestamp: new Date(),
    };

    if (!this.enabled) {
      this.queue.push(event);
      return;
    }

    this.send(event);
  }

  pageView(pageName?: string): void {
    this.track('page_view', { page: pageName || window.location.pathname });
  }

  private send(event: AnalyticsEvent): void {
    // In production, send to analytics service
    console.log('[Analytics]', event.name, event.properties);
    
    // Example: Send to Plausible
    // if (window.plausible) {
    //   window.plausible(event.name, { props: event.properties });
    // }
  }

  private flushQueue(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.send(event);
    }
  }
}

export const analytics = Analytics.getInstance();

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

interface PerformanceMetrics {
  fcp: number | null;  // First Contentful Paint
  lcp: number | null;  // Largest Contentful Paint
  fid: number | null;  // First Input Delay
  cls: number | null;  // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    fcp: null, lcp: null, fid: null, cls: null, ttfb: null,
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  init(): void {
    if (typeof window === 'undefined') return;

    this.observePaint();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.measureTTFB();

    console.log('[PerformanceMonitor] Initialized');
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  private observePaint(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          analytics.track('performance', { metric: 'FCP', value: entry.startTime });
        }
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  }

  private observeLCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      analytics.track('performance', { metric: 'LCP', value: lastEntry.startTime });
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  private observeFID(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming;
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        analytics.track('performance', { metric: 'FID', value: this.metrics.fid });
      }
    });
    observer.observe({ type: 'first-input', buffered: true });
  }

  private observeCLS(): void {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value?: number }).value || 0;
        }
      }
      this.metrics.cls = clsValue;
    });
    observer.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        analytics.track('performance', { metric: 'CLS', value: this.metrics.cls });
      }
    });
  }

  private measureTTFB(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      analytics.track('performance', { metric: 'TTFB', value: this.metrics.ttfb });
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// =====================================================
// INITIALIZATION
// =====================================================

export function initMonitoring(options?: {
  errorTracking?: boolean;
  analytics?: boolean;
  performance?: boolean;
}): void {
  const { errorTracking = true, analytics: enableAnalytics = true, performance = true } = options || {};

  if (errorTracking) {
    // errorTracker.init('your-sentry-dsn');
  }

  if (enableAnalytics) {
    analytics.init();
  }

  if (performance) {
    performanceMonitor.init();
  }
}

export default {
  errorTracker,
  analytics,
  performanceMonitor,
  initMonitoring,
};
