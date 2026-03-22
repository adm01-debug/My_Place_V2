import { describe, it, expect } from 'vitest';
import { 
  validateCPF, 
  validateCNPJ, 
  validateEmail, 
  validatePhone, 
  validatePIS, 
  formatCPF, 
  formatCNPJ, 
  formatPhone 
} from '@/hooks/useValidation';
import { formatCurrency } from '@/lib/utils';

describe('validators', () => {
  describe('validateCPF', () => {
    it('should validate valid CPF', () => {
      expect(validateCPF('529.982.247-25').isValid).toBe(true);
      expect(validateCPF('52998224725').isValid).toBe(true);
    });

    it('should reject invalid CPF', () => {
      expect(validateCPF('111.111.111-11').isValid).toBe(false);
      expect(validateCPF('123.456.789-00').isValid).toBe(false);
      expect(validateCPF('123').isValid).toBe(false);
    });
  });

  describe('validateCNPJ', () => {
    it('should validate valid CNPJ', () => {
      expect(validateCNPJ('11.222.333/0001-81').isValid).toBe(true);
    });

    it('should reject invalid CNPJ', () => {
      expect(validateCNPJ('11.111.111/1111-11').isValid).toBe(false);
      expect(validateCNPJ('123').isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
      expect(validateEmail('user.name@domain.co.br').isValid).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validateEmail('invalid').isValid).toBe(false);
      expect(validateEmail('@domain.com').isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate valid phone', () => {
      expect(validatePhone('(11) 98765-4321').isValid).toBe(true);
      expect(validatePhone('11987654321').isValid).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(validatePhone('123').isValid).toBe(false);
    });
  });

  describe('validatePIS', () => {
    it('should validate valid PIS', () => {
      expect(validatePIS('123.45678.90-0').isValid).toBe(true);
    });

    it('should reject invalid PIS', () => {
      expect(validatePIS('123').isValid).toBe(false);
    });
  });

  describe('formatters', () => {
    it('should format CPF', () => {
      expect(formatCPF('52998224725')).toBe('529.982.247-25');
    });

    it('should format CNPJ', () => {
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('should format phone', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should format currency', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1.234,56');
    });
  });
});
