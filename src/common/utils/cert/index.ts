import { getLogTimestamp, logger } from '../logger';

import { verifyEUDCC } from './eudcc';
import { verifyVDS } from './vds';

export enum CertType {
  EUDCC = 'EUDCC',
  VDS = 'VDS',
  UNKNOWN = 'Unknown',
}

const parseCertData = (qrCode: string, logs: string[]): CertData => {
  logger.debug('CERT: Parsing Cert Data...');
  logs.push(`${getLogTimestamp()}: CERT: Parsing Cert Data...`);

  if (qrCode.slice(0, 4) === 'HC1:') {
    logger.debug('CERT: Found HC1 in the QR Code. Recognized as EUDCC...');
    logs.push(`${getLogTimestamp()}: CERT: Found HC1 in the QR Code. Recognized as EUDCC...`);

    // EUDCC Cert Type
    return {
      type: CertType.EUDCC,
      data: qrCode.slice(4),
    };
  }

  let data;
  try {
    data = JSON.parse(qrCode);
  } catch (e) {
    data = null;
  }

  if (data && data.data && data.data.hdr && data.data.hdr.is === 'AUS' && data.data.hdr.t === 'icao.vacc') {
    // VDS Cert Type

    logger.debug('CERT: Found icao.vacc in the hdr. Recognized as VDS...');
    logs.push(`${getLogTimestamp()}: CERT: Found icao.vacc in the hdr. Recognized as VDS...`);
    return {
      type: CertType.VDS,
      data: qrCode,
    };
  }

  logger.debug('CERT: Error: Unknown cert format...');
  logs.push(`${getLogTimestamp()}: CERT: Error: Unknown cert format...`);
  return {
    type: CertType.UNKNOWN,
    data: qrCode,
  };
};

export const verifyQRCode = async (
  qrCode: string,
): Promise<{ success: boolean; data: VaccinationCert | null; logs: string[] }> => {
  const logs: string[] = [];
  let data = null;

  try {
    const certData = parseCertData(qrCode, logs);

    switch (certData.type) {
      case CertType.VDS:
        {
          const vdsData = JSON.parse(certData.data);
          data = await verifyVDS(vdsData.data, vdsData.sig, logs);
        }
        break;
      case CertType.EUDCC:
        data = await verifyEUDCC(certData.data, logs);
        break;
      default:
        break;
    }
  } catch (err) {
    logger.error(err);
    data = null;
  }

  return {
    success: data !== null,
    data,
    logs,
  };
};

export * from './eudcc';
export * from './vds';
