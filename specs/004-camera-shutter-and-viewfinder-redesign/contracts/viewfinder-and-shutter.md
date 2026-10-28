# UI Contracts: Viewfinder & Shutter Redesign

**Feature Branch**: `004-camera-shutter-and-viewfinder-redesign`
**Date**: 2026-10-28

## 1. Shutter Button Contract (`LiveCameraScanner.native.tsx` / `LiveCameraScanner.web.tsx`)

```tsx
<View style={styles.bottomShutterContainer} pointerEvents="box-none">
  <TouchableOpacity
    onPress={handleTakePhotoAndAnalyze}
    disabled={!ocrWorkerReady || isAnalyzing}
    style={[
      styles.shutterButton,
      isAnalyzing && styles.shutterButtonAnalyzing,
    ]}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Fotografar carta de ave"
  >
    {isAnalyzing ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : (
      <Feather
        name={capturedPhotoUri ? 'refresh-cw' : 'camera'}
        size={28}
        color="#FFFFFF"
      />
    )}
  </TouchableOpacity>
</View>
```

### Visual Specifications
- Dimensions: `width: 72, height: 72, borderRadius: 36`
- Outer Ring: `borderWidth: 4, borderColor: 'rgba(255, 255, 255, 0.45)'`
- Background: `colors.primary` (`#2D6A4F`)
- Position: Centralized horizontally, `bottom: 24`

---

## 2. Viewfinder Target Box Contract (`ScannerScreen.tsx`)

```tsx
<View style={styles.centerOverlay} pointerEvents="none">
  {cameraCaps.hasCamera && (
    <View style={styles.targetWrapper}>
      {/* Label positioned OUTSIDE and ABOVE the dotted box */}
      <View style={styles.targetLabelBadge}>
        <Text style={styles.targetLabelText}>
          Posicione o topo da carta aqui
        </Text>
      </View>

      {/* Dotted Target Box with Translucent Watermark Guide */}
      <View
        style={[
          styles.cardTargetBox,
          activeMatch && isPlaying && styles.cardTargetBoxActive,
        ]}
      >
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />

        {/* Translucent alignment watermark */}
        <View style={styles.watermarkCardGuide}>
          <Feather name="feather" size={24} color="rgba(255, 255, 255, 0.22)" />
          <View style={styles.watermarkTitleLine} />
        </View>
      </View>
    </View>
  )}
</View>
```

