// Web NFC Type Definitions
interface NDEFMessage {
  records: NDEFRecord[];
}

interface NDEFRecord {
  recordType: string;
  mediaType?: string;
  id?: string;
  data?: any;
  encoding?: string;
  lang?: string;
}

interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: NDEFMessage;
}

interface NDEFReader extends EventTarget {
  scan(): Promise<void>;
  write(message: NDEFMessage): Promise<void>;
  addEventListener(type: "reading", callback: (event: NDEFReadingEvent) => void): void;
  addEventListener(type: "readingerror", callback: (event: Event) => void): void;
  removeEventListener(type: "reading", callback: (event: NDEFReadingEvent) => void): void;
  removeEventListener(type: "readingerror", callback: (event: Event) => void): void;
}

interface NDEFReaderConstructor {
  new(): NDEFReader;
}

interface Window {
  NDEFReader: NDEFReaderConstructor;
} 