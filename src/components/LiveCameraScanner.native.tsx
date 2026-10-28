import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, MIN_TOUCH_TARGET, spacing, typeScale } from '../theme/tokens';
import { extractLinesFromOcrPayload } from '../utils/boundingBoxFilter';
import { LiveCameraScannerProps } from './LiveCameraScanner';

/**
 * Detect whether the native VisionCamera module is linked in the binary.
 * Inside standard Expo Go, custom JSI/C++ modules (react-native-vision-camera)
 * are not compiled in, whereas in an Expo Development Build / standalone APK they are.
 */
function loadVisionCameraModules() {
  try {
    // Check if native module exists before initializing VisionCamera JSI bindings
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
  const { onCameraCapabilitiesChange } = props;

  useEffect(() => {
    if (!VISION_MODULES) {
      onCameraCapabilitiesChange?.({
        hasCamera: false,
        hasTorch: false,
      });
    }
  }, [onCameraCapabilitiesChange]);

  if (!VISION_MODULES) {
    return (
      <View style={styles.fallbackBg}>
        <View style={styles.fallbackContent}>
          <Feather
            name="smartphone"
            size={28}
            color={colors.textTaxonomic}
            style={{ marginBottom: spacing.sm }}
          />
          <Text style={styles.title}>Modo Expo Go Ativo</Text>
          <Text style={styles.subtitle}>
            O Catálogo completo (597 aves + áudio offline) e o botão &ldquo;Testar Cartas&rdquo;
            abaixo funcionam normalmente no Expo Go. Para OCR nativo via câmera, use um
            Development Build (npx expo run:android / ios) ou abra a versão Web.
          </Text>
        </View>
      </View>
    );
  }

  return <NativeVisionCameraScanner {...props} />;
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
});
