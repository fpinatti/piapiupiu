import { Feather } from '@expo/vector-icons';
import {
  AvailableLenses,
  CameraView,
  LensInfo,
  useCameraPermissions,
} from 'expo-camera';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors, fonts, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { DEFAULT_TARGET_BOX } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner.types';
import { WatercolorBlobButton } from './WatercolorBlobButton';
import { WatercolorIcon } from './WatercolorIcon';

const ZOOM_PRESETS = [
  { id: '1x', label: '1x', zoom: 0 },
  { id: '1.5x', label: '1.5x (Ideal)', zoom: 0.08 },
  { id: '2x', label: '2x (De longe)', zoom: 0.16 },
] as const;

/**
 * Self-contained HTML page hosted inside a 1x1 hidden WebView for still-photo OCR analysis.
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

    function cropRegion(img, xMin, xMax, yMin, yMax, binarize) {
      const canvas = document.createElement('canvas');
      const sx = Math.max(0, Math.floor(img.naturalWidth * xMin));
      const sy = Math.max(0, Math.floor(img.naturalHeight * yMin));
      const sw = Math.max(80, Math.floor(img.naturalWidth * (xMax - xMin)));
      const sh = Math.max(60, Math.floor(img.naturalHeight * (yMax - yMin)));

      const targetW = Math.min(1000, Math.max(560, sw));
      const scale = targetW / sw;
      const targetH = Math.max(100, Math.floor(sh * scale));

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      ctx.filter = binarize
        ? 'grayscale(100%) contrast(220%) brightness(108%)'
        : 'grayscale(100%) contrast(155%)';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      return canvas;
    }

    window.processBase64Frame = async function(base64Data) {
      if (busy || !base64Data) return;
      busy = true;
      try {
        const w = await ensureWorker();
        if (!w) {
          busy = false;
          send({ type: 'error', message: 'Leitor ainda inicializando' });
          return;
        }

        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = 'data:image/jpeg;base64,' + base64Data;
        });

        // Pass 1: Target box with standard high-contrast grayscale
        const targetCanvas = cropRegion(
          img,
          ${DEFAULT_TARGET_BOX.xMin},
          ${DEFAULT_TARGET_BOX.xMax},
          ${DEFAULT_TARGET_BOX.yMin},
          ${DEFAULT_TARGET_BOX.yMax},
          false
        );
        const res1 = await w.recognize(targetCanvas);
        const text1 = (res1 && res1.data && res1.data.text) ? res1.data.text : '';

        // Pass 2: Target box with strong binarized contrast (helps with sleeve glare/shadows)
        const binCanvas = cropRegion(
          img,
          ${DEFAULT_TARGET_BOX.xMin},
          ${DEFAULT_TARGET_BOX.xMax},
          ${DEFAULT_TARGET_BOX.yMin},
          ${DEFAULT_TARGET_BOX.yMax},
          true
        );
        const res2 = await w.recognize(binCanvas);
        const text2 = (res2 && res2.data && res2.data.text) ? res2.data.text : '';

        // Pass 3: Wider top-half crop for tolerance against slight misalignment
        const wideCanvas = cropRegion(
          img,
          Math.max(0, ${DEFAULT_TARGET_BOX.xMin} - 0.08),
          Math.min(1, ${DEFAULT_TARGET_BOX.xMax} + 0.08),
          Math.max(0, ${DEFAULT_TARGET_BOX.yMin} - 0.05),
          Math.min(0.55, ${DEFAULT_TARGET_BOX.yMax} + 0.14),
          false
        );
        const res3 = await w.recognize(wideCanvas);
        const text3 = (res3 && res3.data && res3.data.text) ? res3.data.text : '';

        const splitLines = function(raw) {
          return (raw || '')
            .split(/\\r?\\n/)
            .map(function(l) { return l.trim(); })
            .filter(function(l) { return l.length >= 3; });
        };

        const allLines = []
          .concat(splitLines(text1))
          .concat(splitLines(text2))
          .concat(splitLines(text3));

        const uniqueLines = Array.from(new Set(allLines));
        busy = false;
        send({ type: 'ocr', lines: uniqueLines });
      } catch (err) {
        busy = false;
        send({ type: 'error', message: err.message || 'Erro ao processar' });
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [zoomPresetId, setZoomPresetId] = useState<string>('1.5x');
  const [availableLenses, setAvailableLenses] = useState<LensInfo[]>([]);
  const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
  const [optimalPictureSize, setOptimalPictureSize] = useState<string | undefined>(undefined);

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

  const handleCameraReady = useCallback(async () => {
    setCameraReady(true);
    if (!cameraRef.current) return;

    try {
      const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
      if (Array.isArray(sizes) && sizes.length > 0) {
        const preferred =
          sizes.find((s) => s.includes('1920x1080') || s.includes('1600x1200')) ||
          sizes.find((s) => s.includes('1280x720') || s.includes('1280x960')) ||
          sizes[Math.floor(sizes.length / 2)];
        if (preferred) {
          setOptimalPictureSize(preferred);
        }
      }
    } catch {
      // Ignore if device doesn't report picture sizes
    }

    try {
      const lenses = await cameraRef.current.getAvailableLensesAsync();
      if (Array.isArray(lenses) && lenses.length > 0) {
        setAvailableLenses(lenses);
      }
    } catch {
      // Only supported on some platforms
    }
  }, []);

  const handleAvailableLensesChanged = useCallback((event: AvailableLenses) => {
    if (Array.isArray(event?.lenses) && event.lenses.length > 0) {
      setAvailableLenses(event.lenses);
    }
  }, []);

  const macroOrUltraWideLens = availableLenses.find(
    (l) =>
      l.deviceType.toLowerCase().includes('ultrawide') ||
      l.localizedName.toLowerCase().includes('ultra') ||
      l.localizedName.toLowerCase().includes('macro')
  );

  const activeZoom =
    ZOOM_PRESETS.find((p) => p.id === zoomPresetId)?.zoom ?? 0.08;

  const handleTakePhotoAndAnalyze = useCallback(async () => {
    if (capturedPhotoUri && !isAnalyzing) {
      // If a photo is currently frozen on screen, unfreeze back to live viewfinder
      setCapturedPhotoUri(null);
      return;
    }

    if (
      !cameraReady ||
      !ocrWorkerReady ||
      busyRef.current ||
      !cameraRef.current ||
      !webViewRef.current
    ) {
      return;
    }

    busyRef.current = true;
    setIsAnalyzing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        base64: true,
        shutterSound: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
      }

      if (photo?.base64 && webViewRef.current) {
        const safeBase64 = photo.base64.replace(/[^A-Za-z0-9+/=]/g, '');
        webViewRef.current.injectJavaScript(
          `window.processBase64Frame && window.processBase64Frame("${safeBase64}"); true;`
        );
      } else {
        busyRef.current = false;
        setIsAnalyzing(false);
        setCapturedPhotoUri(null);
      }
    } catch {
      busyRef.current = false;
      setIsAnalyzing(false);
      setCapturedPhotoUri(null);
    }
  }, [cameraReady, ocrWorkerReady, capturedPhotoUri, isAnalyzing]);

  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload?.type === 'ready') {
          setOcrWorkerReady(true);
        } else if (payload?.type === 'ocr') {
          busyRef.current = false;
          setIsAnalyzing(false);
          const lines: string[] = Array.isArray(payload.lines) ? payload.lines : [];
          if (lines.length > 0) {
            onOcrLinesDetected(lines);
            setTimeout(() => {
              setCapturedPhotoUri(null);
            }, 1600);
          } else {
            setTimeout(() => {
              setCapturedPhotoUri(null);
            }, 1600);
          }
        } else if (payload?.type === 'error') {
          busyRef.current = false;
          setIsAnalyzing(false);
          setCapturedPhotoUri(null);
        }
      } catch {
        busyRef.current = false;
        setIsAnalyzing(false);
        setCapturedPhotoUri(null);
      }
    },
    [onOcrLinesDetected]
  );

  if (!hasPermission) {
    return (
      <View style={styles.fallbackBg}>
        <View style={styles.fallbackContent}>
          <WatercolorIcon type="camera" size="lg" style={{ marginBottom: spacing.md }} />
          <Text style={styles.title}>Permissão de Câmera Necessária</Text>
          <Text style={styles.subtitle}>
            Conceda acesso à câmera para fotografar o topo das cartas de Wingspan e ouvir o canto da ave.
          </Text>
          <WatercolorBlobButton
            onPress={() => requestPermission()}
            title="Permitir Câmera"
            icon={<Feather name="camera" size={18} color={colors.onPrimary} />}
            variant="primary"
            shape="pill"
            shapeVariant={1}
            size="md"
            accessibilityLabel="Permitir acesso à câmera"
          />
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
        autofocus="on"
        zoom={selectedLens ? 0 : activeZoom}
        selectedLens={selectedLens}
        pictureSize={optimalPictureSize}
        enableTorch={torchOn}
        animateShutter={false}
        active={!scannerPaused && !capturedPhotoUri}
        onCameraReady={handleCameraReady}
        onAvailableLensesChanged={handleAvailableLensesChanged}
      />

      {/* Frozen still photo preview while OCR analyzes the captured card */}
      {capturedPhotoUri && (
        <Image
          source={{ uri: capturedPhotoUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* Hidden 1x1 WebView running OCR worker */}
      <View style={styles.hiddenWebView}>
        <WebView<Record<string, unknown>>
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: EXPO_GO_OCR_WEBVIEW_HTML }}
          javaScriptEnabled
          onMessage={handleWebViewMessage}
        />
      </View>

      {/* Top Zoom / Macro selector pills */}
      <View style={styles.topZoomFloatingBar} pointerEvents="box-none">
        <View style={styles.zoomBar}>
          {ZOOM_PRESETS.map((preset, pIdx) => {
            const isSelected = !selectedLens && zoomPresetId === preset.id;
            return (
              <WatercolorBlobButton
                key={preset.id}
                onPress={() => {
                  setSelectedLens(undefined);
                  setZoomPresetId(preset.id);
                }}
                title={preset.label}
                variant={isSelected ? 'primary' : 'secondary'}
                shape="pill"
                shapeVariant={(((pIdx % 3) + 1) as 1 | 2 | 3)}
                size="sm"
                accessibilityLabel={`Zoom ${preset.label}`}
                contentStyle={{ minHeight: 32, paddingHorizontal: 10, paddingVertical: 4 }}
              />
            );
          })}

          {macroOrUltraWideLens && (
            <WatercolorBlobButton
              onPress={() =>
                setSelectedLens((prev) =>
                  prev === macroOrUltraWideLens.deviceType
                    ? undefined
                    : macroOrUltraWideLens.deviceType
                )
              }
              title="Macro"
              variant={
                selectedLens === macroOrUltraWideLens.deviceType
                  ? 'primary'
                  : 'secondary'
              }
              shape="pill"
              shapeVariant={3}
              size="sm"
              accessibilityLabel="Alternar lente Macro / Ultra-Wide"
              contentStyle={{ minHeight: 32, paddingHorizontal: 10, paddingVertical: 4 }}
            />
          )}
        </View>
      </View>

      {/* Bottom Shutter Action Button in Thumb-Zone */}
      <View style={styles.bottomShutterContainer} pointerEvents="box-none">
        <WatercolorBlobButton
          onPress={handleTakePhotoAndAnalyze}
          disabled={!ocrWorkerReady || isAnalyzing}
          shape="pebble"
          shapeVariant={1}
          variant="primary"
          size="lg"
          accessibilityLabel={
            capturedPhotoUri ? 'Fotografar outra carta' : 'Fotografar carta'
          }
          contentStyle={{ minHeight: 72, width: 72, paddingHorizontal: 0, paddingVertical: 0 }}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Feather
              name={capturedPhotoUri ? 'refresh-cw' : 'camera'}
              size={28}
              color={colors.onPrimary}
            />
          )}
        </WatercolorBlobButton>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  fallbackBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 360,
    zIndex: 5,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typeScale.display,
    fontWeight: '800',
    fontFamily: fonts.serif,
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
    gap: 10,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#2B1E12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
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
  topZoomFloatingBar: {
    position: 'absolute',
    top: 56,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 10,
  },
  zoomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceOverlay,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoomChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  zoomChipActive: {
    backgroundColor: colors.primary,
  },
  zoomChipText: {
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
  zoomChipTextActive: {
    color: colors.onPrimary,
  },
  bottomShutterContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  shutterButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  shutterButtonAnalyzing: {
    borderColor: colors.primaryBorder,
  },
  shutterInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
