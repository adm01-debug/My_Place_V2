import { describe, it, expect } from 'vitest';
import { validateCPF, validateCNPJ, validateEmail, validatePhone, validatePIS, formatCPF, formatCNPJ, formatPhone, formatCurrency } from '@/lib/validators';

describe('validators', () => {
  describe('validateCPF', () => {
    it('should validate valid CPF', () => {
      expect(validateCPF('529.982.247-25')).toBe(true);
      expect(validateCPF('52998224725')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(validateCPF('111.111.111-11')).toBe(false);
      expect(validateCPF('123.456.789-00')).toBe(false);
      expect(validateCPF('123')).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('should validate valid CNPJ', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false);
      expect(validateCNPJ('123')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.br')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate valid phone', () => {
      expect(validatePhone('(11) 98765-4321')).toBe(true);
      expect(validatePhone('11987654321')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(validatePhone('123')).toBe(false);
    });
  });

  describe('formatters', () => {
    it('should format CPF', () => {
      expect(formatCPF('52998224725')).toBe('529.982.247-25');
    });

    it('should format phone', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should format currency', () => {
      expect(formatCurrency(1234.56)).toContain('1.234,56');
    });
  });
});
