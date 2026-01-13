import { useState, useCallback } from 'react';

interface NFCTagData {
  serialNumber: string;
  // Add other relevant NFC tag properties
}

interface UseNFCScanOptions {
  onSuccess?: (tagData: NFCTagData) => void;
  onError?: (error: Error) => void;
}

export const useNFCScan = ({ onSuccess, onError }: UseNFCScanOptions = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

  const triggerVibration = useCallback((pattern: number | number[] = 200) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Web NFC is not supported in this browser';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener('reading', (event: any) => {
        const serialNumber = event.serialNumber;
        const tagData: NFCTagData = { serialNumber };
        
        triggerVibration([100, 50, 100]); // Triple pulse for success
        onSuccess?.(tagData);
        setIsScanning(false);
      });

      ndef.addEventListener('readingerror', () => {
        const errorMsg = 'Could not read NFC tag. Try again.';
        setError(errorMsg);
        // We don't stop scanning on a single reading error to allow the user to adjust position
      });

      ndef.addEventListener('error', (event: any) => {
        const errorMsg = event.message || 'NFC scanning error';
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        setIsScanning(false);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'NFC scanning failed';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
      setIsScanning(false);
    }
  }, [onSuccess, onError, isSupported, triggerVibration]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setError(null);
  }, []);

  return {
    startScanning,
    stopScanning,
    isScanning,
    isSupported,
    triggerVibration,
    error
  };
}; 