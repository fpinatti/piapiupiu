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
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { DEFAULT_TARGET_BOX } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner.types';

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

        // Pass 3: Wider upper-middle card area in case card was held slightly higher/lower
        const wideCanvas = cropRegion(img, 0.04, 0.96, 0.06, 0.68, false);
        const res3 = await w.recognize(wideCanvas);
        const text3 = (res3 && res3.data && res3.data.text) ? res3.data.text : '';

        const combined = (text1 + '\\n' + text2 + '\\n' + text3)
          .split(/\\r?\\n/)
          .map(function(l) { return l.trim(); })
          .filter(function(l) { return l.length >= 3; });

        const uniqueLines = Array.from(new Set(combined));
        send({ type: 'ocr', lines: uniqueLines });
      } catch (e) {
        send({ type: 'error', message: String(e && e.message || e) });
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
    const [zoomPresetId, setZoomPresetId] = useState<string>('1.5x');
    const [availableLenses, setAvailableLenses] = useState<LensInfo[]>([]);
    const [selectedLens, setSelectedLens] = useState<string | undefined>(undefined);
    const [optimalPictureSize, setOptimalPictureSize] = useState<string | undefined>(undefined);
    const [statusFeedback, setStatusFeedback] = useState<string>('');

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
        setStatusFeedback('');
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
      setStatusFeedback('Capturando foto nítida...');

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
              setStatusFeedback('Analisando nome da ave na foto...');
              const safeBase64 = photo.base64.replace(/[^A-Za-z0-9+/=]/g, '');
              webViewRef.current.injectJavaScript(
                `window.processBase64Frame && window.processBase64Frame("${safeBase64}"); true;`
              );
            } else {
              busyRef.current = false;
              setIsAnalyzing(false);
              setCapturedPhotoUri(null);
              setStatusFeedback('Não foi possível capturar a foto. Tente novamente.');
            }
          } catch {
            busyRef.current = false;
            setIsAnalyzing(false);
            setCapturedPhotoUri(null);
            setStatusFeedback('Erro ao capturar foto. Tente novamente.');
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
                  setStatusFeedback(`Texto lido: "${String(lines[0]).slice(0, 26)}"`);
                  onOcrLinesDetected(lines);
                  // Automatically unfreeze viewfinder after 1.6s so user is ready for next card
                  setTimeout(() => {
                    setCapturedPhotoUri(null);
                  }, 1600);
                } else {
                  setStatusFeedback('Nenhum texto nítido encontrado. Tente a ~20cm com boa luz.');
                  setTimeout(() => {
                    setCapturedPhotoUri(null);
                  }, 1600);
                }
              } else if (payload?.type === 'error') {
                busyRef.current = false;
                setIsAnalyzing(false);
                setCapturedPhotoUri(null);
                setStatusFeedback('Falha ao analisar a foto. Tente novamente.');
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
              <Text style={styles.title}>Permissão de Câmera Necessária</Text>
              <Text style={styles.subtitle}>
                Conceda acesso à câmera para fotografar o topo das cartas de Wingspan e ouvir o canto da ave.
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

                {/* Top Zoom / Macro controls + Primary Photo Capture Action */}
                <View style={styles.expoGoFloatingBar} pointerEvents="box-none">
                  {/* Zoom / Macro selector pills so user can hold phone at 20-25cm without focus blur */}
                  <View style={styles.zoomBar}>
                    {ZOOM_PRESETS.map((preset) => {
                      const isSelected = !selectedLens && zoomPresetId === preset.id;
                      return (
                        <TouchableOpacity
                          key={preset.id}
                          onPress={() => {
                            setSelectedLens(undefined);
                            setZoomPresetId(preset.id);
                          }}
                          style={[styles.zoomChip, isSelected && styles.zoomChipActive]}
                          accessibilityRole="button"
                          accessibilityLabel={`Zoom ${preset.label}`}
                        >
                          <Text
                            style={[
                              styles.zoomChipText,
                              isSelected && styles.zoomChipTextActive,
                            ]}
                          >
                            {preset.label}
                          </Text>
                </TouchableOpacity>
                );
          })}

                  {macroOrUltraWideLens && (
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedLens((prev) =>
                          prev === macroOrUltraWideLens.deviceType
                            ? undefined
                            : macroOrUltraWideLens.deviceType
                        )
                      }
                      style={[
                        styles.zoomChip,
                        selectedLens === macroOrUltraWideLens.deviceType &&
                        styles.zoomChipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Alternar lente Macro / Ultra-Wide"
                    >
                      <Text
                        style={[
                          styles.zoomChipText,
                          selectedLens === macroOrUltraWideLens.deviceType &&
                          styles.zoomChipTextActive,
                        ]}
                      >
                        Macro
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Deliberate Photo Shutter Button */}
                <TouchableOpacity
                  onPress={handleTakePhotoAndAnalyze}
                  disabled={!ocrWorkerReady || isAnalyzing}
                  style={[
                    styles.capturePhotoBtn,
                    isAnalyzing && styles.capturePhotoBtnAnalyzing,
                  ]}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Fotografar e analisar carta"
                >
                  {isAnalyzing ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Feather
                      name={capturedPhotoUri ? 'refresh-cw' : 'camera'}
                      size={18}
                      color={colors.onPrimary}
                    />
                  )}
                  <Text style={styles.capturePhotoBtnText}>
                    {!ocrWorkerReady
                      ? 'Iniciando Leitor Óptico...'
                      : isAnalyzing
                        ? 'Analisando Foto da Carta...'
                        : capturedPhotoUri
                          ? 'Nova Foto'
                          : 'Fotografar e Ler Carta'}
                  </Text>
                </TouchableOpacity>

            {statusFeedback ? (
              <View style={styles.feedbackPill}>
                <Text style={styles.feedbackPillText} numberOfLines={1}>
                  {statusFeedback}
                </Text>
              </View>
            ) : null}
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
                          top: 68,
                          left: spacing.md,
                          right: spacing.md,
                          alignItems: 'center',
                          gap: 8,
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
                                    capturePhotoBtn: {
                                      minHeight: MIN_TOUCH_TARGET,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 10,
                                      backgroundColor: colors.primary,
                                      borderWidth: 1.5,
                                      borderColor: colors.primaryBorder,
                                      paddingHorizontal: spacing.xl,
                                      paddingVertical: 10,
                                      borderRadius: 999,
                                    },
                                      capturePhotoBtnAnalyzing: {
                                        backgroundColor: colors.surfaceElevated,
                                        borderColor: colors.textTaxonomic,
                                      },
                                      capturePhotoBtnText: {
                                        color: colors.onPrimary,
                                        fontSize: typeScale.body,
                                        fontWeight: '800',
                                      },
                                      feedbackPill: {
                                        backgroundColor: colors.surfaceOverlay,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: 4,
                                        borderRadius: 999,
                                      },
                                      feedbackPillText: {
                                        color: colors.textSecondary,
                                        fontSize: typeScale.caption,
                                        fontWeight: '600',
                                      },
                                    });
