import jpeg from 'jpeg-js';
import { fromBase64 } from 'pdf2pic';
import { PNG } from 'pngjs';
import jsQR, { QRCode } from 'jsqr';

import { logger } from '../logger';

const getPreProcessor = (base64Input: string, logs: string[]) => {
  // TODO: this ok for now, but probably better to decode and look for file type...
  logger.debug('QR: Selecting pre processor based on file type...');
  logs.push('QR: Selecting pre processor based on file type...');

  if (base64Input.startsWith('JVBER')) {
    return PDF2QRImage;
  } else if (base64Input.startsWith('/9j/4AAQSkZJR')) {
    return JPEG2QRImage;
  } else if (base64Input.startsWith('iVBORw0KG')) {
    return PNG2QRImage;
  } else {
    logs.push('QR: Error: Unsupported file type.');
    throw new Error('QR: Error: Unsupported file type.');
  }
};

const PDF2QRImage = async (data: string, logs: string[]): Promise<QRImageData> => {
  const options = {
    density: 120,
    format: 'jpg',
    // A4
    width: 2100,
    height: 2970,
  };

  logger.debug('QR: Converting PDF to JPEG...');
  logs.push('QR: Converting PDF to JPEG...');

  const response: Base64Data = await fromBase64(data, options)(1, true);
  if (response?.base64) {
    return JPEG2QRImage(response.base64, logs);
  } else {
    logs.push('QR: Error: Unable to convert PDF.');
    throw new Error('QR: Error: Unable to convert PDF.');
  }
};

const JPEG2QRImage = async (data: string, logs: string[]): Promise<QRImageData> => {
  logger.debug('QR: Converting JPEG to QR Image Data...');
  logs.push('QR: Converting JPEG to QR Image Data...');

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

const PNG2QRImage = async (data: string, logs: string[]): Promise<QRImageData> => {
  logger.debug('QR: Converting PNG to QR Image Data...');
  logs.push('QR: Converting PNG to QR Image Data...');

  const bufferObj = Buffer.from(data, 'base64');
  const pngData = PNG.sync.read(bufferObj);
  const qrArray = new Uint8ClampedArray(pngData.data);
  return {
    data: qrArray,
    width: pngData.width,
    height: pngData.height,
  };
};

export const getQRCodeData = async (base64Data: string): Promise<{ data: string | null; logs: string[] }> => {
  const logs: string[] = [];

  try {
    const preProcess = getPreProcessor(base64Data, logs);

    const imageData = await preProcess(base64Data, logs);

    logger.debug('QR: Parsing QR Data...');
    logs.push('QR: Parsing QR Data...');

    const code: QRCode | null = jsQR(imageData.data, imageData.width, imageData.height);

    if (!code) {
      logs.push('QR: Error: Unable to locate QR code.');
      throw new Error('QR: Error: Unable to locate QR code.');
    }

    return {
      data: code.data,
      logs,
    };
  } catch (err) {
    return {
      data: null,
      logs,
    };
  }
};
