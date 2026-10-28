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
          >
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
            Use o Simulador de OCR abaixo ou a aba Catálogo para testar as aves.
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
    backgroundColor: '#0b1320',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  fallbackContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  title: {
    color: '#e5e7eb',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  permissionBtn: {
    marginTop: 14,
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

