// Web NFC Type Definitions
interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  data?: ArrayBuffer;
}

interface NDEFReadingEvent {
  message: NDEFMessage;
  serialNumber: string;
}

declare class NDEFReader {
  constructor();
  scan(): Promise<void>;
  write(message: NDEFMessage): Promise<void>;
  addEventListener(type: 'reading', listener: (event: NDEFReadingEvent) => void): void;
}

interface Window {
  NDEFReader: typeof NDEFReader;
} 