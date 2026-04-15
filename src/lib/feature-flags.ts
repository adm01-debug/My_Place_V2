import { createLogger } from '@/lib/logger';

const log = createLogger('FeatureFlags');

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  rolloutPercentage?: number;
}

const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  'push-notifications': { key: 'push-notifications', enabled: true, description: 'Web Push notifications' },
  'biometric-auth': { key: 'biometric-auth', enabled: true, description: 'WebAuthn biometric login' },
  '2fa-totp': { key: '2fa-totp', enabled: true, description: 'TOTP two-factor authentication' },
  'ai-assistant': { key: 'ai-assistant', enabled: true, description: 'AI virtual assistant' },
  'dark-mode': { key: 'dark-mode', enabled: true, description: 'Dark mode theme' },
  'offline-mode': { key: 'offline-mode', enabled: true, description: 'Offline data sync' },
  'salary-chart': { key: 'salary-chart', enabled: true, description: 'Salary evolution chart' },
  'kudos': { key: 'kudos', enabled: true, description: 'Social recognition system' },
  'learning-paths': { key: 'learning-paths', enabled: true, description: 'Learning paths / trilhas' },
  'climate-surveys': { key: 'climate-surveys', enabled: true, description: 'Organizational climate surveys' },
};

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Record<string, FeatureFlag>;
  private userId: string | null = null;

  private constructor() {
    // Load from localStorage overrides
    const stored = localStorage.getItem('feature_flags');
    if (stored) {
      try {
        const overrides = JSON.parse(stored) as Record<string, boolean>;
        this.flags = { ...DEFAULT_FLAGS };
        Object.entries(overrides).forEach(([key, enabled]) => {
          if (this.flags[key]) {
            this.flags[key].enabled = enabled;
          }
        });
      } catch {
        this.flags = { ...DEFAULT_FLAGS };
      }
    } else {
      this.flags = { ...DEFAULT_FLAGS };
    }
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  isEnabled(flagKey: string): boolean {
    const flag = this.flags[flagKey];
    if (!flag) {
      log.warn(`Unknown feature flag: ${flagKey}`);
      return false;
    }

    if (!flag.enabled) return false;

    // Percentage-based rollout
    if (flag.rolloutPercentage !== undefined && this.userId) {
      const hash = this.hashUserId(this.userId);
      return hash % 100 < flag.rolloutPercentage;
    }

    return flag.enabled;
  }

  setFlag(key: string, enabled: boolean): void {
    if (this.flags[key]) {
      this.flags[key].enabled = enabled;
      this.persist();
      log.info(`Flag "${key}" set to ${enabled}`);
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Object.values(this.flags);
  }

  private persist(): void {
    const overrides: Record<string, boolean> = {};
    Object.entries(this.flags).forEach(([key, flag]) => {
      overrides[key] = flag.enabled;
    });
    localStorage.setItem('feature_flags', JSON.stringify(overrides));
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = FeatureFlagManager.getInstance();

/**
 * React hook to check if a feature flag is enabled.
 */
export function useFeatureFlag(flagKey: string): boolean {
  return featureFlags.isEnabled(flagKey);
}
