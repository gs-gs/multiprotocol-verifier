import jpeg from 'jpeg-js';
import { fromBase64 } from 'pdf2pic';
import { PNG } from 'pngjs';
import jsQR, { QRCode } from 'jsqr';

const getPreProcessor = (base64Input: string) => {
  // TODO: this ok for now, but probably better to decode and look for file type...
  if (base64Input.startsWith('JVBERi0yLjAKJeL')) {
    return PDF2QRImage;
  } else if (base64Input.startsWith('/9j/4AAQSkZJR')) {
    return JPEG2QRImage;
  } else if (base64Input.startsWith('iVBORw0KG')) {
    return PNG2QRImage;
  } else {
    throw new Error('Unsupported file type');
  }
};

const PDF2QRImage = async (data: string): Promise<QRImageData> => {
  const options = {
    density: 150,
    format: 'jpg',
    // A4
    width: 2100,
    height: 2970,
  };

  const response: Base64Data = await fromBase64(data, options)(1, true);
  if (response?.base64) {
    return JPEG2QRImage(response.base64);
  } else {
    throw new Error('Unable to convert PDF');
  }
};

const JPEG2QRImage = async (data: string): Promise<QRImageData> => {
  const bufferObj = Buffer.from(data, 'base64');

  const jpgData = jpeg.decode(bufferObj, {
    useTArray: true,
    maxMemoryUsageInMB: 2048,
  });

  const qrArray = new Uint8ClampedArray(jpgData.data.buffer);

  return {
    data: qrArray,
    width: jpgData.width,
    height: jpgData.height,
  };
};

const PNG2QRImage = async (data: string): Promise<QRImageData> => {
  const bufferObj = Buffer.from(data, 'base64');
  const pngData = PNG.sync.read(bufferObj);
  const qrArray = new Uint8ClampedArray(pngData.data);
  return {
    data: qrArray,
    width: pngData.width,
    height: pngData.height,
  };
};

export const getQR = async (base64Data: string): Promise<QRCodeData | null> => {
  //  get QR code data from the image:
  const preProcess = getPreProcessor(base64Data);
  const imageData = await preProcess(base64Data);

  const code: QRCode | null = jsQR(imageData.data, imageData.width, imageData.height);
  if (code) {
    return JSON.parse(code.data);
  } else {
    throw new Error('Unable to locate QR code');
  }
};
