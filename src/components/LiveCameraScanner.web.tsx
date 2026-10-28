import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createWorker, Worker } from 'tesseract.js';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { DEFAULT_TARGET_BOX } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner.types';

export function LiveCameraScanner({
  onOcrLinesDetected,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>(
    'Posicione a carta e clique em Fotografar e Ler Carta'
  );
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    onCameraCapabilitiesChange?.({
      hasCamera: webcamActive,
      hasTorch: false,
    });
  }, [webcamActive, onCameraCapabilitiesChange]);

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

  const setVideoElementRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current && node.srcObject !== streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (
      webcamActive &&
      videoRef.current &&
      streamRef.current &&
      videoRef.current.srcObject !== streamRef.current
    ) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [webcamActive]);

  const openPhotoCaptureFallback = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const captureFromWebcamAndRecognize = useCallback(async () => {
    if (isProcessingPhoto || !videoRef.current || typeof document === 'undefined') {
      return;
    }

    const video = videoRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh || video.readyState < 2) {
      return;
    }

    setIsProcessingPhoto(true);
    setOcrStatus('Analisando foto da carta...');

    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker('por+eng');
      }

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
        80,
        Math.floor(
          visibleWidth * (DEFAULT_TARGET_BOX.xMax - DEFAULT_TARGET_BOX.xMin)
        )
      );
      const sh = Math.max(
        60,
        Math.floor(
          visibleHeight * (DEFAULT_TARGET_BOX.yMax - DEFAULT_TARGET_BOX.yMin)
        )
      );

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = sw;
      offscreenCanvas.height = sh;
      const ctx = offscreenCanvas.getContext('2d');
      if (!ctx) return;

      ctx.filter = 'grayscale(100%) contrast(165%)';
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

      const { data } = await workerRef.current.recognize(offscreenCanvas);
      const rawLines = (data?.text || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 3);

      if (rawLines.length > 0) {
        setOcrStatus(`Lido: "${rawLines[0].slice(0, 26)}"`);
        onOcrLinesDetected(rawLines);
      } else {
        setOcrStatus('Nenhum título lido. Enquadre o topo da carta e tente novamente.');
      }
    } catch {
      setOcrStatus('Erro ao analisar a foto. Tente novamente.');
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [isProcessingPhoto, onOcrLinesDetected]);

  const handlePhotoFileSelected = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target?.files?.[0];
      if (!file || typeof document === 'undefined') {
        return;
      }

      setWebcamError(null);
      setIsProcessingPhoto(true);
      setOcrStatus('Lendo nome da ave na foto...');

      const objectUrl = URL.createObjectURL(file);
      setCapturedPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });

      try {
        if (!workerRef.current) {
          workerRef.current = await createWorker('por+eng');
        }

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Falha ao carregar imagem'));
          img.src = objectUrl;
        });

        const canvas = document.createElement('canvas');
        const cropWidth = Math.max(120, img.naturalWidth);
        const cropHeight = Math.max(80, Math.floor(img.naturalHeight * 0.45));
        canvas.width = cropWidth;
        canvas.height = cropHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'grayscale(100%) contrast(155%)';
          ctx.drawImage(img, 0, 0, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        }

        const topResult = await workerRef.current.recognize(canvas);
        const topLines = (topResult?.data?.text || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length >= 3);

        const fullResult = await workerRef.current.recognize(img);
        const fullLines = (fullResult?.data?.text || '')
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length >= 3);

        const combinedLines = [...new Set([...topLines, ...fullLines])];
        if (combinedLines.length > 0) {
          onOcrLinesDetected(combinedLines);
          setOcrStatus(`Texto lido: "${combinedLines[0]}"`);
        } else {
          setWebcamError(
            'Não foi possível identificar o título na foto. Tente aproximar o topo da carta com boa iluminação.'
          );
        }
      } catch {
        setWebcamError('Erro ao processar a foto da carta. Tente novamente.');
      } finally {
        setIsProcessingPhoto(false);
      }
    },
    [onOcrLinesDetected]
  );

  const startWebcam = async () => {
    setWebcamError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      openPhotoCaptureFallback();
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
      openPhotoCaptureFallback();
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
      if (workerRef.current) {
        workerRef.current.terminate().catch(() => { });
        workerRef.current = null;
      }
    };
  }, [stopWebcam]);

  return (
    <View style={styles.container}>
      {/* @ts-ignore - Standard DOM input rendered via react-native-web */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileSelected}
        style={{ display: 'none' }}
      />

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
          <View style={styles.topCaptureBar}>
            <TouchableOpacity
              onPress={captureFromWebcamAndRecognize}
              disabled={isProcessingPhoto}
              style={styles.captureNowBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Fotografar e ler carta"
            >
              <Feather name="camera" size={18} color={colors.onPrimary} />
              <Text style={styles.captureNowBtnText}>
                {isProcessingPhoto ? 'Analisando Foto...' : 'Fotografar e Ler Carta'}
              </Text>
            </TouchableOpacity>
          </View>

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
              Toque abaixo para abrir a câmera ou fotografar uma carta de ave e ouvir o seu canto.
            </Text>

            {isProcessingPhoto ? (
              <Text style={styles.processingText}>{ocrStatus}</Text>
            ) : null}

            {webcamError ? (
              <Text style={styles.errorText}>{webcamError}</Text>
            ) : null}

            <View style={styles.btnGroup}>
              <TouchableOpacity
                onPress={startWebcam}
                style={styles.webcamBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ativar câmera para fotografar cartas"
              >
                <Feather name="camera" size={18} color={colors.onPrimary} />
                <Text style={styles.webcamBtnText}>
                  {isProcessingPhoto ? 'Lendo Carta...' : 'Abrir Câmera / Fotografar Carta'}
                </Text>
              </TouchableOpacity>

              {capturedPreviewUrl && !isProcessingPhoto ? (
                <TouchableOpacity
                  onPress={openPhotoCaptureFallback}
                  style={styles.secondaryPhotoBtn}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Tirar outra foto de carta"
                >
                  <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
                  <Text style={styles.secondaryPhotoBtnText}>Fotografar Outra Carta</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
  processingText: {
    color: colors.textTaxonomic,
    fontSize: typeScale.label,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: colors.onDanger,
    fontSize: typeScale.label,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  btnGroup: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  webcamBtn: {
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
  secondaryPhotoBtn: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  secondaryPhotoBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: typeScale.label,
  },
  topCaptureBar: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
  },
  captureNowBtn: {
    minHeight: MIN_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: 999,
  },
  captureNowBtnText: {
    color: colors.onPrimary,
    fontSize: typeScale.body,
    fontWeight: '800',
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
