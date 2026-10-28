export interface LiveCameraScannerProps {
  scannerPaused: boolean;
  torchOn: boolean;
  onOcrLinesDetected: (lines: string[]) => void;
  onCameraCapabilitiesChange?: (caps: {
    hasCamera: boolean;
    hasTorch: boolean;
  }) => void;
}

export { LiveCameraScanner } from './LiveCameraScanner.web';

