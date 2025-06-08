import React from 'react';

declare module '@/components/NfcTagScanner' {
  interface NfcScannerProps {
    onTagScanned?: (tagId: string) => void;
  }

  export function NfcTagScanner(props: NfcScannerProps): React.ReactElement;
} 