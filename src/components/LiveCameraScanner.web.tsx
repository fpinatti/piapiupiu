import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createWorker, Worker } from 'tesseract.js';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { DEFAULT_TARGET_BOX } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner';

export function LiveCameraScanner({
  scannerPaused,
  onOcrLinesDetected,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isRecognizingRef = useRef<boolean>(false);

  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('Leitor de cartas pronto');

  useEffect(() => {
    onCameraCapabilitiesChange?.({
      hasCamera: webcamActive,
      hasTorch: false,
    });
  }, [webcamActive, onCameraCapabilitiesChange]);

  const setVideoElementRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      node.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [webcamActive]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  }, []);

  const startWebcam = async () => {
    setWebcamError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setWebcamError(
        'O navegador não disponibilizou acesso à câmera (use localhost ou HTTPS).'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setWebcamActive(true);
    } catch {
      setWebcamError(
        'Não foi possível acessar a webcam. Verifique a permissão de câmera no navegador.'
      );
      setWebcamActive(false);
    }
  };

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      if (scannerPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [scannerPaused]);

  useEffect(() => {
    if (!webcamActive) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const offscreenCanvas =
      typeof document !== 'undefined' ? document.createElement('canvas') : null;

    async function initWorkerAndLoop() {
      try {
        setOcrStatus('Preparando leitor óptico...');
        if (!workerRef.current) {
          workerRef.current = await createWorker('por+eng');
        }
        if (cancelled) return;
        setOcrStatus('Câmera ativa • Enquadre o topo da carta');

        intervalId = setInterval(async () => {
          if (
            cancelled ||
            scannerPaused ||
            isRecognizingRef.current ||
            !videoRef.current ||
            !offscreenCanvas ||
            !workerRef.current
          ) {
            return;
          }

          const video = videoRef.current;
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh || video.readyState < 2) {
            return;
          }

          isRecognizingRef.current = true;
          try {
            const rect = video.getBoundingClientRect();
            const containerRatio =
              rect.width > 0 && rect.height > 0 ? rect.width / rect.height : vw / vh;
            const videoRatio = vw / vh;

            let visibleWidth = vw;
            let visibleHeight = vh;
            let offsetX = 0;
            let offsetY = 0;

            if (videoRatio > containerRatio) {
              visibleWidth = vh * containerRatio;
              offsetX = (vw - visibleWidth) / 2;
            } else {
              visibleHeight = vw / containerRatio;
              offsetY = (vh - visibleHeight) / 2;
            }

            const sx = Math.max(
              0,
              Math.floor(offsetX + visibleWidth * DEFAULT_TARGET_BOX.xMin)
            );
            const sy = Math.max(
              0,
              Math.floor(offsetY + visibleHeight * DEFAULT_TARGET_BOX.yMin)
            );
            const sw = Math.max(
              64,
              Math.floor(
                visibleWidth * (DEFAULT_TARGET_BOX.xMax - DEFAULT_TARGET_BOX.xMin)
              )
            );
            const sh = Math.max(
              48,
              Math.floor(
                visibleHeight * (DEFAULT_TARGET_BOX.yMax - DEFAULT_TARGET_BOX.yMin)
              )
            );

            offscreenCanvas.width = sw;
            offscreenCanvas.height = sh;
            const ctx = offscreenCanvas.getContext('2d');
            if (!ctx) return;

            ctx.filter = 'grayscale(100%) contrast(145%)';
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

            const { data } = await workerRef.current.recognize(offscreenCanvas);
            if (cancelled) return;

            const rawLines = (data?.text || '')
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter((line) => line.length >= 3);

            if (rawLines.length > 0) {
              onOcrLinesDetected(rawLines);
            }
          } catch {
            // Ignore transient frame recognition errors
          } finally {
            isRecognizingRef.current = false;
          }
        }, 700);
      } catch {
        if (!cancelled) {
          setOcrStatus('Leitor óptico indisponível; use Testar Cartas');
        }
      }
    }

    initWorkerAndLoop();

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [webcamActive, scannerPaused, onOcrLinesDetected]);

  useEffect(() => {
    return () => {
      stopWebcam();
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => {});
        workerRef.current = null;
      }
    };
  }, [stopWebcam]);

  return (
    <View style={styles.container}>
      {webcamActive ? (
        <View style={StyleSheet.absoluteFill}>
          {/* @ts-ignore - Standard DOM video element rendered via react-native-web */}
          <video
            ref={setVideoElementRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: colors.canvas,
            }}
          />
          <View style={styles.statusBanner}>
            <Feather name="eye" size={15} color={colors.textTaxonomic} />
            <Text style={styles.statusBannerText}>{ocrStatus}</Text>
            <TouchableOpacity
              onPress={stopWebcam}
              style={styles.stopCamBtn}
              accessibilityRole="button"
              accessibilityLabel="Desligar câmera"
            >
              <Feather name="video-off" size={14} color={colors.onDanger} />
              <Text style={styles.stopCamBtnText}>Desligar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.fallbackBg}>
          <View style={styles.fallbackContent}>
            <Text style={styles.title}>Leitor de Cartas Wingspan</Text>
            <Text style={styles.subtitle}>
              Ligue a câmera para apontar o topo de uma carta física de ave e ouvir o seu canto, ou teste cartas abaixo sem câmera.
            </Text>
            {webcamError ? (
              <Text style={styles.errorText}>{webcamError}</Text>
            ) : null}
            <TouchableOpacity
              onPress={startWebcam}
              style={styles.webcamBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ativar câmera para ler cartas"
            >
              <Feather name="camera" size={18} color={colors.onPrimary} />
              <Text style={styles.webcamBtnText}>Ativar Câmera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
  },
  fallbackBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 400,
    marginBottom: 90,
    zIndex: 5,
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
  errorText: {
    color: colors.onDanger,
    fontSize: typeScale.label,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  webcamBtn: {
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
  webcamBtnText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: typeScale.body,
  },
  statusBanner: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceOverlay,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    gap: 10,
  },
  statusBannerText: {
    color: colors.textSecondary,
    fontSize: typeScale.caption,
    fontWeight: '600',
  },
  stopCamBtn: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  stopCamBtnText: {
    color: colors.onDanger,
    fontSize: typeScale.caption,
    fontWeight: '700',
  },
});
