import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LiveCameraScannerProps } from './LiveCameraScanner';

export function LiveCameraScanner({
  scannerPaused,
  onCameraCapabilitiesChange,
}: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  useEffect(() => {
    onCameraCapabilitiesChange?.({
      hasCamera: webcamActive,
      hasTorch: false,
    });
  }, [webcamActive, onCameraCapabilitiesChange]);

  const stopWebcam = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    setWebcamActive(false);
  };

  const startWebcam = async () => {
    setWebcamError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setWebcamError('Navegador sem suporte a WebRTC getUserMedia.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setWebcamActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch {
      setWebcamError('Permissão negada ou nenhuma webcam encontrada.');
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
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <View style={styles.fallbackBg}>
      {webcamActive ? (
        // @ts-ignore - HTML video element is valid in react-native-web
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <View style={styles.fallbackContent}>
          <Text style={styles.badge}>MODO WEB INTERATIVO</Text>
          <Text style={styles.title}>Scanner OCR & Simulador no Navegador</Text>
          <Text style={styles.subtitle}>
            Clique nas cartas de exemplo abaixo, digite leituras OCR com reflexo (ex: GA1O-AZUL) ou ative sua Webcam para visualizar o enquadramento!
          </Text>
          {webcamError ? (
            <Text style={styles.errorText}>{webcamError}</Text>
          ) : null}
          <TouchableOpacity onPress={startWebcam} style={styles.webcamBtn}>
            <Text style={styles.webcamBtnText}>Ativar Webcam no Navegador</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    maxWidth: 420,
    marginBottom: 80,
    zIndex: 5,
  },
  badge: {
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    overflow: 'hidden',
  },
  title: {
    color: '#e5e7eb',
    fontSize: 18,
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
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 8,
  },
  webcamBtn: {
    marginTop: 14,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  webcamBtnText: {
    color: '#6ee7b7',
    fontWeight: '700',
    fontSize: 13,
  },
});
