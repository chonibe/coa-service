// Web NFC Type Definitions
interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  data?: ArrayBuffer;
}

interface NDEFReader {
  scan(): Promise<void>;
  write(message: NDEFMessage): Promise<void>;
  addEventListener(type: 'reading', listener: (event: {
    message: NDEFMessage;
    serialNumber: string;
  }) => void): void;
}

interface Window {
  NDEFReader?: {
    new(): NDEFReader;
  };
} 