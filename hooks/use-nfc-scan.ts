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
  const [error, setError] = useState<Error | null>(null);

  const startScanning = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      const errorMsg = 'Web NFC is not supported in this browser';
      setError(new Error(errorMsg));
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
        
        onSuccess?.(tagData);
        setIsScanning(false);
      });

      ndef.addEventListener('error', (event: any) => {
        const errorMsg = event.message || 'NFC scanning error';
        const scanError = new Error(errorMsg);
        setError(scanError);
        onError?.(scanError);
        setIsScanning(false);
      });
    } catch (err) {
      const scanError = err instanceof Error ? err : new Error('NFC scanning failed');
      setError(scanError);
      onError?.(scanError);
      setIsScanning(false);
    }
  }, [onSuccess, onError]);

  const stopScanning = useCallback(() => {
    // Implement stop scanning logic if needed
    setIsScanning(false);
    setError(null);
  }, []);

  return {
    startScanning,
    stopScanning,
    isScanning,
    error
  };
}; 