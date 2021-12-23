import jpeg from 'jpeg-js';
import { fromBase64 } from 'pdf2pic';
import { PNG } from 'pngjs';
import jsQR, { QRCode } from 'jsqr';

import { getLogTimestamp, logger } from '../logger';

const getPreProcessor = (base64Input: string, logs: string[]) => {
  // TODO: this ok for now, but probably better to decode and look for file type...
  logger.debug('QR: Selecting pre processor based on file type...');
  logs.push(`${getLogTimestamp()}: QR: Selecting pre processor based on file type...`);

  if (base64Input.startsWith('JVBER')) {
    return PDF2QRImage;
  } else if (base64Input.startsWith('/9j/4AAQSkZJR')) {
    return JPEG2QRImage;
  } else if (base64Input.startsWith('iVBORw0KG')) {
    return PNG2QRImage;
  } else {
    logs.push(`${getLogTimestamp()}: QR: Error: Unsupported file type.`);
    throw new Error('QR: Error: Unsupported file type.');
  }
};

const PDF2QRImage = async (data: string, logs: string[]): Promise<QRImageData> => {
  const options = {
    density: 150,
    format: 'jpg',
    // A4
    width: 2100,
    height: 2970,
  };

  logger.debug('QR: Converting PDF to JPEG...');
  logs.push(`${getLogTimestamp()}: QR: Converting PDF to JPEG...`);

  const response: Base64Data = await fromBase64(data, options)(1, true);
  if (response?.base64) {
    return JPEG2QRImage(response.base64, logs);
  } else {
    logs.push(`${getLogTimestamp()}: QR: Error: Unable to convert PDF.`);
    throw new Error('QR: Error: Unable to convert PDF.');
  }
};

const JPEG2QRImage = async (data: string, logs: string[]): Promise<QRImageData> => {
  logger.debug('QR: Converting JPEG to QR Image Data...');
  logs.push(`${getLogTimestamp()}: QR: Converting JPEG to QR Image Data...`);

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
  logs.push(`${getLogTimestamp()}: QR: Converting PNG to QR Image Data...`);

  const bufferObj = Buffer.from(data, 'base64');
  const pngData = PNG.sync.read(bufferObj);
  const qrArray = new Uint8ClampedArray(pngData.data);
  return {
    data: qrArray,
    width: pngData.width,
    height: pngData.height,
  };
};

export const getQRCodeData = async (
  base64Data: string,
): Promise<{ data: string | string[] | null; logs: string[] }> => {
  const logs: string[] = [];

  try {
    const preProcess = getPreProcessor(base64Data, logs);

    const imageData = await preProcess(base64Data, logs);

    logger.debug('QR: Parsing QR Data...');
    logs.push(`${getLogTimestamp()}: QR: Parsing QR Data...`);

    const code: QRCode | null = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      return {
        data: code.data,
        logs,
      };
    }

    /**
     * Hacky solution here.
     * Try to split the document into two sections horizontally, and try again.
     * TODO: Call 3rd party lambda function to extract all QR codes from image.
     */

    const code1: QRCode | null = jsQR(
      imageData.data.slice(0, imageData.data.length / 2),
      imageData.width,
      imageData.height / 2,
    );

    const code2: QRCode | null = jsQR(
      imageData.data.slice(imageData.data.length / 2),
      imageData.width,
      imageData.height / 2,
    );

    if (code1 || code2) {
      return {
        data: [code1?.data || '', code2?.data || ''],
        logs,
      };
    }

    logs.push(`${getLogTimestamp()}: QR: Error: Unable to locate QR code.`);
    throw new Error('QR: Error: Unable to locate QR code.');
  } catch (err) {
    return {
      data: null,
      logs,
    };
  }
};
