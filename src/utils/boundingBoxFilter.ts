import { NormalizedBoundingBox, OcrBlockItem, OcrFrameRect } from '../types/bird';

/**
 * Default normalized virtual targeting box on the camera screen.
 * The player aligns the top header of the Wingspan card inside this region:
 * - Horizontal: 8% to 92% of frame width
 * - Vertical: 15% to 52% of frame height (top-to-upper-middle area)
 */
export const DEFAULT_TARGET_BOX: NormalizedBoundingBox = {
  xMin: 0.08,
  xMax: 0.92,
  yMin: 0.15,
  yMax: 0.52,
};

/**
 * Checks whether an OCR bounding rectangle's center falls inside the
 * normalized virtual targeting box.
 *
 * If the OCR plugin does not supply pixel dimensions or a bounding rect for a line,
 * we allow the line through so devices/plugins without frame coordinates still work.
 */
export function isRectInsideTargetBox(
  rect: OcrFrameRect | undefined,
  frameWidth: number,
  frameHeight: number,
  targetBox: NormalizedBoundingBox = DEFAULT_TARGET_BOX
): boolean {
  if (!rect || frameWidth <= 0 || frameHeight <= 0) {
    return true;
  }

  const centerX = (rect.x + rect.width / 2) / frameWidth;
  const centerY = (rect.y + rect.height / 2) / frameHeight;

  return (
    centerX >= targetBox.xMin &&
    centerX <= targetBox.xMax &&
    centerY >= targetBox.yMin &&
    centerY <= targetBox.yMax
  );
}

/**
 * Extracts all candidate text lines from an array of OCR blocks that lie inside
 * the virtual targeting box.
 */
export function extractTargetBoxLines(
  blocks: OcrBlockItem[] | undefined | null,
  frameWidth: number,
  frameHeight: number,
  targetBox: NormalizedBoundingBox = DEFAULT_TARGET_BOX
): string[] {
  if (!blocks || !Array.isArray(blocks)) {
    return [];
  }

  const linesOut: string[] = [];

  for (const block of blocks) {
    if (!block) continue;

    if (block.lines && Array.isArray(block.lines) && block.lines.length > 0) {
      for (const line of block.lines) {
        if (!line) continue;
        const rectToCheck = line.frame || block.frame;
        if (
          line.text &&
          isRectInsideTargetBox(rectToCheck, frameWidth, frameHeight, targetBox)
        ) {
          linesOut.push(line.text);
        }
      }
    } else if (
      block.text &&
      isRectInsideTargetBox(block.frame, frameWidth, frameHeight, targetBox)
    ) {
      for (const rawLine of block.text.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (trimmed) {
          linesOut.push(trimmed);
        }
      }
    }
  }

  return linesOut;
}

/**
 * Normalizes varied ML Kit / VisionCamera OCR plugin payloads into a flat list
 * of candidate text lines filtered by the virtual targeting bounding box.
 */
export function extractLinesFromOcrPayload(
  payload: unknown,
  frameWidth: number = 0,
  frameHeight: number = 0,
  targetBox: NormalizedBoundingBox = DEFAULT_TARGET_BOX
): string[] {
  if (!payload) {
    return [];
  }

  if (typeof payload === 'string') {
    return payload
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (Array.isArray(payload)) {
    const out: string[] = [];
    for (const item of payload) {
      out.push(...extractLinesFromOcrPayload(item, frameWidth, frameHeight, targetBox));
    }
    return out;
  }

  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    // Standard { blocks: OcrBlockItem[] } format
    if (Array.isArray(obj.blocks)) {
      const normalizedBlocks: OcrBlockItem[] = obj.blocks.map((rawBlock: any) => ({
        text: rawBlock?.text ?? rawBlock?.blockText,
        frame: rawBlock?.frame ?? rawBlock?.blockFrame,
        lines: Array.isArray(rawBlock?.lines)
          ? rawBlock.lines.map((rawLine: any) => ({
              text: rawLine?.text ?? rawLine?.lineText ?? '',
              frame: rawLine?.frame ?? rawLine?.lineFrame,
            }))
          : undefined,
      }));
      const extracted = extractTargetBoxLines(
        normalizedBlocks,
        frameWidth,
        frameHeight,
        targetBox
      );
      if (extracted.length > 0) {
        return extracted;
      }
    }

    // Fallback to top-level resultText / text if blocks were not structured as an array
    const rawResultText =
      typeof obj.resultText === 'string'
        ? obj.resultText
        : typeof obj.text === 'string'
          ? obj.text
          : '';
    if (rawResultText) {
      return rawResultText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
}
