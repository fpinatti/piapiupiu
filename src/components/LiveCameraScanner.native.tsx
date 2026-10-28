import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-text-recognition';
import { useRunOnJS } from 'react-native-worklets-core';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { extractLinesFromOcrPayload } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner';

export function LiveCameraScanner({
  scannerPaused,
  torchOn,
  onOcrLinesDetected,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
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
    (frame) => {
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

const styles = StyleSheet.create({
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
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
});
