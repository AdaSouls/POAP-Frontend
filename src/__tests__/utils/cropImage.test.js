import { getCroppedImageBlob } from '../../utils/cropImage';

// jsdom has no real canvas rendering (no `canvas`/`jest-canvas-mock` package in this project, and
// adding one just for this test would be a heavy dependency for a single utility) — mock the 2D
// context to verify the contract (correct source-rect draw args, correct output size, blob
// round-trip) instead of actual pixel output.
describe('cropImage', () => {
  const originalImage = global.Image;
  let drawImageCalls;
  let getContextMock;

  let toBlobCalls;

  beforeEach(() => {
    drawImageCalls = [];
    toBlobCalls = [];
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-source');
    global.URL.revokeObjectURL = jest.fn();

    getContextMock = jest.fn(() => ({
      drawImage: (...args) => drawImageCalls.push(args),
    }));
    HTMLCanvasElement.prototype.getContext = getContextMock;
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback, type, quality) {
      toBlobCalls.push({ type, quality, canvasWidth: this.width, canvasHeight: this.height });
      callback(new Blob(['cropped-bytes'], { type }));
    };

    global.Image = class {
      constructor() {
        setTimeout(() => this.onload?.(), 0);
      }
      set src(value) {
        this._src = value;
      }
      get src() {
        return this._src;
      }
    };
  });

  afterEach(() => {
    global.Image = originalImage;
  });

  it('draws the requested source rect onto a canvas sized to the crop area', async () => {
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    const croppedAreaPixels = { x: 10, y: 20, width: 100, height: 100 };

    const blob = await getCroppedImageBlob(file, croppedAreaPixels);

    expect(drawImageCalls).toHaveLength(1);
    const [, sx, sy, sw, sh, dx, dy, dw, dh] = drawImageCalls[0];
    expect([sx, sy, sw, sh]).toEqual([10, 20, 100, 100]);
    expect([dx, dy, dw, dh]).toEqual([0, 0, 100, 100]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('revokes the source object URL after cropping', async () => {
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    await getCroppedImageBlob(file, { x: 0, y: 0, width: 50, height: 50 });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-source');
  });

  it('downscales crops larger than 512px to keep IPFS payloads small, never upscales smaller ones', async () => {
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' });

    await getCroppedImageBlob(file, { x: 0, y: 0, width: 2000, height: 2000 });
    expect(toBlobCalls[0].canvasWidth).toBe(512);
    expect(toBlobCalls[0].canvasHeight).toBe(512);

    await getCroppedImageBlob(file, { x: 0, y: 0, width: 200, height: 200 });
    expect(toBlobCalls[1].canvasWidth).toBe(200);
    expect(toBlobCalls[1].canvasHeight).toBe(200);
  });

  it('compresses non-PNG sources as JPEG, keeps PNG sources as PNG (for transparency)', async () => {
    const jpegFile = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' });
    await getCroppedImageBlob(jpegFile, { x: 0, y: 0, width: 100, height: 100 });
    expect(toBlobCalls[0].type).toBe('image/jpeg');
    expect(toBlobCalls[0].quality).toBe(0.85);

    const pngFile = new File(['bytes'], 'logo.png', { type: 'image/png' });
    await getCroppedImageBlob(pngFile, { x: 0, y: 0, width: 100, height: 100 });
    expect(toBlobCalls[1].type).toBe('image/png');
    expect(toBlobCalls[1].quality).toBeUndefined();
  });

  it('rejects if the canvas fails to produce a blob', async () => {
    HTMLCanvasElement.prototype.toBlob = function toBlob(callback) {
      callback(null);
    };
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });

    await expect(
      getCroppedImageBlob(file, { x: 0, y: 0, width: 10, height: 10 }),
    ).rejects.toThrow('Failed to crop image');
  });
});
