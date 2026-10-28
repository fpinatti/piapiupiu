import {
  DEFAULT_TARGET_BOX,
  extractLinesFromOcrPayload,
  extractTargetBoxLines,
  isRectInsideTargetBox,
} from '../utils/boundingBoxFilter';

describe('isRectInsideTargetBox', () => {
  const frameWidth = 1000;
  const frameHeight = 2000;

  it('returns true when OCR rect center is inside the top target zone', () => {
    const rectInTarget = {
      x: 200,
      y: 500, // centerY = (500 + 40) / 2000 = 0.27 (within [0.15, 0.52])
      width: 600,
      height: 80,
    };
    expect(
      isRectInsideTargetBox(rectInTarget, frameWidth, frameHeight, DEFAULT_TARGET_BOX)
    ).toBe(true);
  });

  it('returns false when OCR rect is in the lower card ability area', () => {
    const rectInBottomHalf = {
      x: 200,
      y: 1400, // centerY = (1400 + 50) / 2000 = 0.725 (outside [0.15, 0.52])
      width: 600,
      height: 100,
    };
    expect(
      isRectInsideTargetBox(rectInBottomHalf, frameWidth, frameHeight, DEFAULT_TARGET_BOX)
    ).toBe(false);
  });
});

describe('extractTargetBoxLines & extractLinesFromOcrPayload', () => {
  it('filters out blocks outside the virtual target box and keeps top card lines', () => {
    const blocks = [
      {
        text: 'GAIO-AZUL',
        frame: { x: 200, y: 450, width: 500, height: 60 },
        lines: [
          {
            text: 'GAIO-AZUL',
            frame: { x: 200, y: 450, width: 500, height: 60 },
          },
        ],
      },
      {
        text: 'QUANDO ATIVAR: Estoque 1 semente',
        frame: { x: 200, y: 1500, width: 600, height: 120 },
        lines: [
          {
            text: 'QUANDO ATIVAR: Estoque 1 semente',
            frame: { x: 200, y: 1500, width: 600, height: 120 },
          },
        ],
      },
    ];

    const kept = extractTargetBoxLines(blocks, 1000, 2000);
    expect(kept).toEqual(['GAIO-AZUL']);
  });

  it('normalizes react-native-vision-camera-text-recognition payloads', () => {
    const payload = {
      resultText: 'EURASIAN JAY\nGarrulus glandarius',
      blocks: [
        {
          blockText: 'EURASIAN JAY',
          blockFrame: { x: 250, y: 400, width: 400, height: 50 },
          lines: [
            {
              lineText: 'EURASIAN JAY',
              lineFrame: { x: 250, y: 400, width: 400, height: 50 },
            },
          ],
        },
      ],
    };

    expect(extractLinesFromOcrPayload(payload, 1000, 2000)).toEqual([
      'EURASIAN JAY',
    ]);
  });
});

