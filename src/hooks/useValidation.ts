import { useState, useCallback, useMemo } from 'react';

// ============================================================================
// TIPOS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export interface FieldValidation {
  value: string;
  isValid: boolean;
  error: string | null;
  touched: boolean;
  validate: () => ValidationResult;
  reset: () => void;
  setValue: (value: string) => void;
  setTouched: (touched: boolean) => void;
}

export type ValidatorFn = (value: string) => ValidationResult;

// ============================================================================
// VALIDADORES DE CPF
// ============================================================================

export const validateCPF = (cpf: string): ValidationResult => {
  // Remover caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');

  if (!cleanCPF) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }

  if (cleanCPF.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos' };
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { isValid: false, error: 'CPF inválido' };
  }

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return { isValid: false, error: 'CPF inválido' };
  }

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return { isValid: false, error: 'CPF inválido' };
  }

  return { isValid: true, error: null };
};

export const formatCPF = (cpf: string): string => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
};

// ============================================================================
// VALIDADORES DE CNPJ
// ============================================================================

export const validateCNPJ = (cnpj: string): ValidationResult => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (!cleanCNPJ) {
    return { isValid: false, error: 'CNPJ é obrigatório' };
  }

  if (cleanCNPJ.length !== 14) {
    return { isValid: false, error: 'CNPJ deve ter 14 dígitos' };
  }

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
    return { isValid: false, error: 'CNPJ inválido' };
  }

  return { isValid: true, error: null };
};

export const formatCNPJ = (cnpj: string): string => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
};

// ============================================================================
// VALIDADORES DE EMAIL
// ============================================================================

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email é obrigatório' };
  }

  // Regex para validação de email (RFC 5322)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email inválido' };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// VALIDADORES DE TELEFONE
// ============================================================================

export const validatePhone = (phone: string): ValidationResult => {
  const cleanPhone = phone.replace(/\D/g, '');

  if (!cleanPhone) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }

  // Telefone brasileiro: 10 ou 11 dígitos
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, error: 'Telefone deve ter 10 ou 11 dígitos' };
  }

  // Verificar DDD válido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { isValid: false, error: 'DDD inválido' };
  }

  // Se tiver 11 dígitos, o primeiro após o DDD deve ser 9 (celular)
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
    return { isValid: false, error: 'Celular deve começar com 9' };
  }

  return { isValid: true, error: null };
};

export const formatPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

// ============================================================================
// VALIDADORES DE CEP
// ============================================================================

export const validateCEP = (cep: string): ValidationResult => {
  const cleanCEP = cep.replace(/\D/g, '');

  if (!cleanCEP) {
    return { isValid: false, error: 'CEP é obrigatório' };
  }

  if (cleanCEP.length !== 8) {
    return { isValid: false, error: 'CEP deve ter 8 dígitos' };
  }

  // Verificar se não são todos zeros ou todos iguais
  if (/^0+$/.test(cleanCEP) || /^(\d)\1{7}$/.test(cleanCEP)) {
    return { isValid: false, error: 'CEP inválido' };
  }

  return { isValid: true, error: null };
};

export const formatCEP = (cep: string): string => {
  const clean = cep.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
};

// ============================================================================
// VALIDADORES DE PIS/PASEP
// ============================================================================

export const validatePIS = (pis: string): ValidationResult => {
  const cleanPIS = pis.replace(/\D/g, '');

  if (!cleanPIS) {
    return { isValid: false, error: 'PIS/PASEP é obrigatório' };
  }

  if (cleanPIS.length !== 11) {
    return { isValid: false, error: 'PIS/PASEP deve ter 11 dígitos' };
  }

  // Pesos para o cálculo
  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanPIS.charAt(i)) * weights[i];
  }

  const remainder = sum % 11;
  const digit = remainder < 2 ? 0 : 11 - remainder;

  if (digit !== parseInt(cleanPIS.charAt(10))) {
    return { isValid: false, error: 'PIS/PASEP inválido' };
  }

  return { isValid: true, error: null };
};

export const formatPIS = (pis: string): string => {
  const clean = pis.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 10) return `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8, 10)}-${clean.slice(10, 11)}`;
};

// ============================================================================
// VALIDADORES DE DATA
// ============================================================================

export const validateDate = (date: string, format: 'dd/mm/yyyy' | 'yyyy-mm-dd' = 'dd/mm/yyyy'): ValidationResult => {
  if (!date) {
    return { isValid: false, error: 'Data é obrigatória' };
  }

  let day: number, month: number, year: number;

  if (format === 'dd/mm/yyyy') {
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return { isValid: false, error: 'Data deve estar no formato DD/MM/AAAA' };
    }
    [, day, month, year] = match.map(Number) as [unknown, number, number, number];
  } else {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return { isValid: false, error: 'Data deve estar no formato AAAA-MM-DD' };
    }
    [, year, month, day] = match.map(Number) as [unknown, number, number, number];
  }

  // Verificar se a data é válida
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return { isValid: false, error: 'Data inválida' };
  }

  return { isValid: true, error: null };
};

export const validateBirthDate = (date: string): ValidationResult => {
  const dateResult = validateDate(date);
  if (!dateResult.isValid) return dateResult;

  const parts = date.split('/');
  const birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  const today = new Date();
  
  if (birthDate > today) {
    return { isValid: false, error: 'Data de nascimento não pode ser no futuro' };
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  if (age > 120) {
    return { isValid: false, error: 'Data de nascimento inválida' };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// VALIDADORES DE SENHA
// ============================================================================

export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

export const validatePassword = (
  password: string,
  options: PasswordValidationOptions = {}
): ValidationResult => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
  } = options;

  if (!password) {
    return { isValid: false, error: 'Senha é obrigatória' };
  }

  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Mínimo ${minLength} caracteres`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Pelo menos uma letra maiúscula');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Pelo menos uma letra minúscula');
  }

  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Pelo menos um número');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Pelo menos um caractere especial');
  }

  if (errors.length > 0) {
    return { isValid: false, error: errors.join('. ') };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// VALIDADORES GENÉRICOS
// ============================================================================

export const validateRequired = (value: string, fieldName = 'Campo'): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  return { isValid: true, error: null };
};

export const validateMinLength = (value: string, min: number, fieldName = 'Campo'): ValidationResult => {
  if (value.length < min) {
    return { isValid: false, error: `${fieldName} deve ter no mínimo ${min} caracteres` };
  }
  return { isValid: true, error: null };
};

export const validateMaxLength = (value: string, max: number, fieldName = 'Campo'): ValidationResult => {
  if (value.length > max) {
    return { isValid: false, error: `${fieldName} deve ter no máximo ${max} caracteres` };
  }
  return { isValid: true, error: null };
};

export const validateFullName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: 'Nome é obrigatório' };
  }

  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length < 2) {
    return { isValid: false, error: 'Informe nome e sobrenome' };
  }

  if (parts.some(part => part.length < 2)) {
    return { isValid: false, error: 'Cada parte do nome deve ter pelo menos 2 caracteres' };
  }

  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'Nome deve conter apenas letras' };
  }

  return { isValid: true, error: null };
};

export const validateMatricula = (matricula: string): ValidationResult => {
  if (!matricula) {
    return { isValid: false, error: 'Matrícula é obrigatória' };
  }

  if (!/^[A-Za-z0-9-]+$/.test(matricula)) {
    return { isValid: false, error: 'Matrícula deve conter apenas letras, números e hífens' };
  }

  return { isValid: true, error: null };
};

// ============================================================================
// HOOKS
// ============================================================================

export const useValidation = (
  initialValue: string,
  validator: ValidatorFn
): FieldValidation => {
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    error: null,
  });

  const validate = useCallback((): ValidationResult => {
    const result = validator(value);
    setValidationResult(result);
    return result;
  }, [value, validator]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setValidationResult({ isValid: true, error: null });
  }, [initialValue]);

  return {
    value,
    isValid: validationResult.isValid,
    error: touched ? validationResult.error : null,
    touched,
    validate,
    reset,
    setValue,
    setTouched,
  };
};

interface FormValidation {
  [key: string]: FieldValidation;
}

interface UseFormValidationReturn {
  fields: FormValidation;
  isValid: boolean;
  validateAll: () => boolean;
  reset: () => void;
  getValues: () => Record<string, string>;
  getErrors: () => Record<string, string | null>;
}

export const useFormValidation = (
  fieldsConfig: Record<string, { initialValue: string; validator: ValidatorFn }>
): UseFormValidationReturn => {
  const fieldNames = useMemo(() => Object.keys(fieldsConfig), [fieldsConfig]);
  
  const fields = useMemo(() => {
    const result: FormValidation = {};
    for (const name of fieldNames) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      result[name] = useValidation(
        fieldsConfig[name].initialValue,
        fieldsConfig[name].validator
      );
    }
    return result;
  }, [fieldsConfig, fieldNames]);

  const isValid = useMemo(() => {
    return fieldNames.every(name => fields[name].isValid);
  }, [fields, fieldNames]);

  const validateAll = useCallback((): boolean => {
    let allValid = true;
    for (const name of fieldNames) {
      fields[name].setTouched(true);
      const result = fields[name].validate();
      if (!result.isValid) allValid = false;
    }
    return allValid;
  }, [fields, fieldNames]);

  const reset = useCallback(() => {
    for (const name of fieldNames) {
      fields[name].reset();
    }
  }, [fields, fieldNames]);

  const getValues = useCallback((): Record<string, string> => {
    const values: Record<string, string> = {};
    for (const name of fieldNames) {
      values[name] = fields[name].value;
    }
    return values;
  }, [fields, fieldNames]);

  const getErrors = useCallback((): Record<string, string | null> => {
    const errors: Record<string, string | null> = {};
    for (const name of fieldNames) {
      errors[name] = fields[name].error;
    }
    return errors;
  }, [fields, fieldNames]);

  return {
    fields,
    isValid,
    validateAll,
    reset,
    getValues,
    getErrors,
  };
};

export default useValidation;
