import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('BiometricAuth');

interface BiometricCredential {
  credentialId: string;
  email: string;
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // Check if WebAuthn is available
  useEffect(() => {
    const checkAvailability = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsAvailable(available);
          
          // Check if there's a registered credential
          const stored = localStorage.getItem('biometric_credential');
          if (stored) {
            const credential: BiometricCredential = JSON.parse(stored);
            setIsRegistered(true);
            setRegisteredEmail(credential.email);
          }
        } catch (e) {
          setIsAvailable(false);
        }
      }
    };
    
    checkAvailability();
  }, []);

  // Generate a random challenge
  const generateChallenge = (): ArrayBuffer => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer as ArrayBuffer;
  };

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Register biometric credential
  const registerBiometric = async (email: string, userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAvailable) {
      return { success: false, error: 'Biometria não disponível neste dispositivo' };
    }

    try {
      const challenge = generateChallenge();
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Portal do Colaborador',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email.split('@')[0],
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        const credentialData: BiometricCredential = {
          credentialId: arrayBufferToBase64(credential.rawId),
          email,
        };
        
        localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
        setIsRegistered(true);
        setRegisteredEmail(email);
        
        return { success: true };
      }

      return { success: false, error: 'Falha ao registrar biometria' };
    } catch (error: any) {
      log.error('Biometric registration error:', error);
      
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Permissão negada para usar biometria' };
      }
      if (error.name === 'InvalidStateError') {
        return { success: false, error: 'Biometria já registrada para este dispositivo' };
      }
      
      return { success: false, error: 'Erro ao registrar biometria' };
    }
  };

  // Authenticate with biometric
  const authenticateWithBiometric = async (): Promise<{ success: boolean; email?: string; error?: string }> => {
    if (!isAvailable || !isRegistered) {
      return { success: false, error: 'Biometria não configurada' };
    }

    try {
      const stored = localStorage.getItem('biometric_credential');
      if (!stored) {
        return { success: false, error: 'Nenhuma credencial biométrica encontrada' };
      }

      const credential: BiometricCredential = JSON.parse(stored);
      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [
          {
            type: 'public-key',
            id: base64ToArrayBuffer(credential.credentialId),
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        return { success: true, email: credential.email };
      }

      return { success: false, error: 'Falha na autenticação biométrica' };
    } catch (error: any) {
      log.error('Biometric authentication error:', error);
      
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Autenticação cancelada ou negada' };
      }
      
      return { success: false, error: 'Erro na autenticação biométrica' };
    }
  };

  // Remove biometric credential
  const removeBiometric = () => {
    localStorage.removeItem('biometric_credential');
    setIsRegistered(false);
    setRegisteredEmail(null);
  };

  return {
    isAvailable,
    isRegistered,
    registeredEmail,
    registerBiometric,
    authenticateWithBiometric,
    removeBiometric,
  };
};
