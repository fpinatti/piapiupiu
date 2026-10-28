import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeModules,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import {
  DEFAULT_TARGET_BOX,
  extractLinesFromOcrPayload,
} from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner';

/**
 * Detect whether the native VisionCamera JSI module is compiled into the binary.
 * In a custom Development Build it is present; inside standard Expo Go we automatically
 * use Expo Go's built-in `expo-camera` (<CameraView>) + WebView OCR worker so the live
 * native camera works out-of-the-box in Expo Go with zero HTTPS/localhost errors.
 */
function loadVisionCameraModules() {
  try {
    const hasNativeCameraView = Boolean(
      NativeModules?.CameraView || NativeModules?.VisionCameraModule
    );
    if (!hasNativeCameraView) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const visionCamera = require('react-native-vision-camera');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const textRecognition = require('react-native-vision-camera-text-recognition');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const worklets = require('react-native-worklets-core');

    return {
      Camera: visionCamera.Camera,
      useCameraDevice: visionCamera.useCameraDevice,
      useCameraPermission: visionCamera.useCameraPermission,
      useFrameProcessor: visionCamera.useFrameProcessor,
      useTextRecognition: textRecognition.useTextRecognition,
      useRunOnJS: worklets.useRunOnJS,
    };
  } catch {
    return null;
  }
}

const VISION_MODULES = loadVisionCameraModules();

/**
 * Self-contained HTML page hosted inside a 1x1 hidden WebView for Expo Go OCR.
 * Uses pinned tesseract.js@7.0.0 with Subresource Integrity (SRI) hash.
 * Note: Update tesseract.js version and SRI hash together if upgrading.
 */
const EXPO_GO_OCR_WEBVIEW_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script
    src="https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js"
    integrity="sha384-2BQ3U3OdKOb0Uczxqr41I9UvZkzr4V9Hv8uSzMMZAlmhsFClvdZX5wi5fDCzG+tM"
    crossorigin="anonymous"
  ></script>
</head>
<body>
  <script>
    let worker = null;
    let busy = false;

    function send(payload) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    async function ensureWorker() {
      if (!worker && window.Tesseract) {
        worker = await window.Tesseract.createWorker('por+eng');
        send({ type: 'ready' });
      }
      return worker;
    }

    window.processBase64Frame = async function(base64Data) {
      if (busy || !base64Data) return;
      busy = true;
      try {
        const w = await ensureWorker();
        if (!w) {
          busy = false;
          return;
        }

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = 'data:image/jpeg;base64,' + base64Data;
        });

        const canvas = document.createElement('canvas');
        const sx = Math.floor(img.naturalWidth * ${DEFAULT_TARGET_BOX.xMin});
        const sy = Math.floor(img.naturalHeight * ${DEFAULT_TARGET_BOX.yMin});
        const sw = Math.max(80, Math.floor(img.naturalWidth * (${DEFAULT_TARGET_BOX.xMax - DEFAULT_TARGET_BOX.xMin})));
        const sh = Math.max(60, Math.floor(img.naturalHeight * (${DEFAULT_TARGET_BOX.yMax - DEFAULT_TARGET_BOX.yMin})));

        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        ctx.filter = 'grayscale(100%) contrast(145%)';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

        const res = await w.recognize(canvas);
        const text = (res && res.data && res.data.text) ? res.data.text : '';
        const lines = text
          .split(/\\r?\\n/)
          .map(function(l) { return l.trim(); })
          .filter(function(l) { return l.length >= 3; });

        send({ type: 'ocr', lines: lines });
      } catch (e) {
        send({ type: 'error' });
      } finally {
        busy = false;
      }
    };

    ensureWorker();
  </script>
</body>
</html>`;

function ExpoGoCameraScanner({
  scannerPaused,
  torchOn,
  onOcrLinesDetected,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [ocrWorkerReady, setOcrWorkerReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const cameraRef = useRef<CameraView | null>(null);
  const webViewRef = useRef<WebView<Record<string, unknown>> | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => {});
    }
  }, [permission, requestPermission]);

  const hasPermission = Boolean(permission?.granted);

  useEffect(() => {
    onCameraCapabilitiesChange?.({
      hasCamera: hasPermission,
      hasTorch: hasPermission,
    });
  }, [hasPermission, onCameraCapabilitiesChange]);

  const captureAndRecognizeFrame = useCallback(async () => {
    if (
      !cameraReady ||
      !ocrWorkerReady ||
      scannerPaused ||
      busyRef.current ||
      !cameraRef.current ||
      !webViewRef.current
    ) {
      return;
    }

    busyRef.current = true;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        base64: true,
        shutterSound: false,
        skipProcessing: true,
      });

      if (photo?.base64 && webViewRef.current) {
        const safeBase64 = photo.base64.replace(/[^A-Za-z0-9+/=]/g, '');
        webViewRef.current.injectJavaScript(
          `window.processBase64Frame && window.processBase64Frame("${safeBase64}"); true;`
        );
      } else {
        busyRef.current = false;
        setIsCapturing(false);
      }
    } catch {
      busyRef.current = false;
      setIsCapturing(false);
    }
  }, [cameraReady, ocrWorkerReady, scannerPaused]);

  useEffect(() => {
    if (!hasPermission || !cameraReady || !ocrWorkerReady || scannerPaused) {
      return;
    }

    const timer = setInterval(() => {
      captureAndRecognizeFrame();
    }, 1800);

    return () => clearInterval(timer);
  }, [hasPermission, cameraReady, ocrWorkerReady, scannerPaused, captureAndRecognizeFrame]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload?.type === 'ready') {
          setOcrWorkerReady(true);
        } else if (payload?.type === 'ocr') {
          busyRef.current = false;
          setIsCapturing(false);
          if (Array.isArray(payload.lines) && payload.lines.length > 0) {
            onOcrLinesDetected(payload.lines);
          }
        } else if (payload?.type === 'error') {
          busyRef.current = false;
          setIsCapturing(false);
        }
      } catch {
        busyRef.current = false;
        setIsCapturing(false);
      }
    },
    [onOcrLinesDetected]
  );

  if (!hasPermission) {
    return (
      <View style={styles.fallbackBg}>
        <View style={styles.fallbackContent}>
          <Text style={styles.title}>Permissão de Câmera Necessária</Text>
          <Text style={styles.subtitle}>
            Conceda acesso à câmera no Expo Go para ler o topo das cartas de Wingspan em tempo real.
          </Text>
          <TouchableOpacity
            onPress={() => requestPermission()}
            style={styles.permissionBtn}
            accessibilityRole="button"
            accessibilityLabel="Permitir acesso à câmera"
          >
            <Feather name="camera" size={18} color={colors.onPrimary} />
            <Text style={styles.permissionBtnText}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        animateShutter={false}
        active={!scannerPaused}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* Hidden 1x1 WebView running OCR worker inside Expo Go */}
      <View style={styles.hiddenWebView}>
        <WebView<Record<string, unknown>>
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: EXPO_GO_OCR_WEBVIEW_HTML }}
          javaScriptEnabled
          onMessage={handleWebViewMessage}
        />
      </View>

      {/* Manual instant scan button at the bottom of the camera preview */}
      <View style={styles.expoGoFloatingBar} pointerEvents="box-none">
        <TouchableOpacity
          onPress={captureAndRecognizeFrame}
          style={styles.instantScanPill}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ler carta agora"
        >
          <Feather
            name="aperture"
            size={15}
            color={isCapturing ? colors.textTaxonomic : colors.onPrimary}
          />
          <Text style={styles.instantScanText}>
            {!ocrWorkerReady
              ? 'Preparando leitor óptico...'
              : isCapturing
                ? 'Lendo topo da carta...'
                : 'Leitura automática ativa • Toque para ler agora'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function NativeVisionCameraScanner({
  scannerPaused,
  torchOn,
  onOcrLinesDetected,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
  const {
    Camera,
    useCameraDevice,
    useCameraPermission,
    useFrameProcessor,
    useTextRecognition,
    useRunOnJS,
  } = VISION_MODULES!;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    onCameraCapabilitiesChange?.({
      hasCamera: Boolean(hasPermission && device),
      hasTorch: Boolean(device?.hasTorch),
    });
  }, [hasPermission, device, onCameraCapabilitiesChange]);

  const { scanText } = useTextRecognition({ language: 'latin' });

  const handleFrameOcrOnJS = useRunOnJS(
    (ocrPayload: unknown, frameWidth: number, frameHeight: number) => {
      if (scannerPaused) {
        return;
      }
      const lines = extractLinesFromOcrPayload(ocrPayload, frameWidth, frameHeight);
      if (lines.length > 0) {
        onOcrLinesDetected(lines);
      }
    },
    [scannerPaused, onOcrLinesDetected]
  );

  const frameProcessor = useFrameProcessor(
    (frame: { width: number; height: number }) => {
      'worklet';
      try {
        const ocrData = scanText(frame);
        if (ocrData) {
          handleFrameOcrOnJS(ocrData, frame.width, frame.height);
        }
      } catch {
        // Ignore transient native frame processor errors
      }
    },
    [scanText, handleFrameOcrOnJS]
  );

  if (!hasPermission) {
    return (
      <View style={styles.fallbackBg}>
        <View style={styles.fallbackContent}>
          <Text style={styles.title}>Permissão de Câmera Necessária</Text>
          <Text style={styles.subtitle}>
            Conceda acesso à câmera para ler o topo das cartas de Wingspan em tempo real.
          </Text>
          <TouchableOpacity
            onPress={() => requestPermission()}
            style={styles.permissionBtn}
            accessibilityRole="button"
            accessibilityLabel="Permitir acesso à câmera"
          >
            <Feather name="camera" size={18} color={colors.onPrimary} />
            <Text style={styles.permissionBtnText}>Permitir Câmera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.fallbackBg}>
        <View style={styles.fallbackContent}>
          <Text style={styles.title}>Câmera Física Indisponível</Text>
          <Text style={styles.subtitle}>
            Use a opção Testar Cartas abaixo ou a aba Catálogo para ouvir os cantos das aves.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={!scannerPaused}
      pixelFormat="yuv"
      torch={torchOn && device.hasTorch ? 'on' : 'off'}
      frameProcessor={frameProcessor}
      fps={15}
    />
  );
}

export function LiveCameraScanner(props: LiveCameraScannerProps) {
  if (VISION_MODULES) {
    return <NativeVisionCameraScanner {...props} />;
  }

  return <ExpoGoCameraScanner {...props} />;
}

const styles = StyleSheet.create({
  fallbackBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 360,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typeScale.display,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typeScale.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: typeScale.body,
  },
  hiddenWebView: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  expoGoFloatingBar: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instantScanPill: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceOverlay,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  instantScanText: {
    color: colors.textPrimary,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
});
