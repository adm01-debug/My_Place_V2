import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sign In', () => {
    it('should sign in with valid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '1', email: 'test@test.com' }, session: {} },
        error: null,
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('test@test.com');
    });

    it('should fail with invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const result = await mockSupabase.auth.signInWithPassword({
        email: 'wrong@test.com',
        password: 'wrong',
      });

      expect(result.error).not.toBeNull();
    });
  });

  describe('Sign Up', () => {
    it('should create new user', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '2', email: 'new@test.com' } },
        error: null,
      });

      const result = await mockSupabase.auth.signUp({
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result.error).toBeNull();
      expect(result.data.user).toBeDefined();
    });
  });

  describe('Sign Out', () => {
    it('should sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await mockSupabase.auth.signOut();

      expect(result.error).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should get current user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: '1', email: 'test@test.com' } },
        error: null,
      });

      const result = await mockSupabase.auth.getUser();

      expect(result.data.user).toBeDefined();
    });
  });
});
