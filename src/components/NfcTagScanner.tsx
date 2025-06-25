import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  NfcIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

// Declare Web NFC types if not already available
declare global {
  interface Window {
    NDEFReader?: any;
  }
}

interface NfcScannerProps {
  onTagScanned?: (tagId: string) => void;
}

export function NfcTagScanner({ onTagScanned }: NfcScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [scannedTagId, setScannedTagId] = useState<string | null>(null);

  const handleScanNfcTag = async () => {
    // Check if Web NFC is supported
    if (window.NDEFReader) {
      try {
        setIsScanning(true);
        setScanStatus('scanning');

        const ndef = new window.NDEFReader();
        await ndef.scan();

        ndef.addEventListener("reading", (event: any) => {
          // Extract tag information
          const tagId = event.serialNumber || 'unknown';
          
          setScannedTagId(tagId);
          setScanStatus('success');
          
          // Optional callback for parent component
          onTagScanned?.(tagId);

          toast({
            title: "NFC Tag Scanned",
            description: `Tag ID: ${tagId}`,
          });
        });

        ndef.addEventListener("error", (error: Error) => {
          console.error("NFC Scanning Error:", error);
          setScanStatus('error');
          
          toast({
            title: "NFC Scan Failed",
            description: "Unable to read NFC tag",
            variant: "destructive",
          });
        });

      } catch (error) {
        console.error("NFC Scanning Error:", error);
        setScanStatus('error');
        
        toast({
          title: "NFC Scan Failed",
          description: "Browser or device does not support Web NFC",
          variant: "destructive",
        });
      } finally {
        setIsScanning(false);
      }
    } else {
      toast({
        title: "NFC Not Supported",
        description: "Your browser or device does not support Web NFC",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <NfcIcon className="w-8 h-8 text-primary" />
          NFC Tag Scanner
        </CardTitle>
        <CardDescription>
          Scan your digital art NFC tag to verify and claim
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Button 
            onClick={handleScanNfcTag}
            disabled={isScanning}
            className="w-full"
            variant={scanStatus === 'success' ? 'outline' : 'default'}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <NfcIcon className="mr-2 h-4 w-4" />
                Scan NFC Tag
              </>
            )}
          </Button>

          {scannedTagId && (
            <div className="w-full">
              <Badge 
                variant={scanStatus === 'success' ? 'default' : 'destructive'}
                className="w-full justify-center"
              >
                {scanStatus === 'success' ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <AlertCircle className="mr-2 h-4 w-4" />
                )}
                Tag ID: {scannedTagId}
              </Badge>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          {scanStatus === 'idle' && "Ready to scan your digital art NFC tag"}
          {scanStatus === 'scanning' && "Hold your NFC tag near the device"}
          {scanStatus === 'success' && "Tag successfully scanned and verified"}
          {scanStatus === 'error' && "Error scanning NFC tag"}
        </div>
      </CardContent>
    </Card>
  );
} 