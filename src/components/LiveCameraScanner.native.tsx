import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { DEFAULT_TARGET_BOX } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner.types';

/**
 * Self-contained HTML page hosted inside a 1x1 hidden WebView for Expo Go / Native OCR.
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

  export function LiveCameraScanner({
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
        requestPermission().catch(() => { });
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

        {/* Manual instant scan button at the top of the camera preview */}
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
