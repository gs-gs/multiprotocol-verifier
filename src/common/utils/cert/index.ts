import { verifyEUDCC } from './eudcc';
import { verifyVDS } from './vds';

export enum CertType {
  EUDCC = 'EUDCC',
  VDS = 'VDS',
  UNKNOWN = 'Unknown',
}

const parseCertData = (qrCode: string): CertData => {
  if (qrCode.slice(0, 4) === 'HC1:') {
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

  if (data.data && data.data.hdr && data.data.hdr.is === 'AUS' && data.data.hdr.t === 'icao.vacc') {
    // VDS Cert Type
    return {
      type: CertType.VDS,
      data: qrCode,
    };
  }

  return {
    type: CertType.UNKNOWN,
    data: qrCode,
  };
};

export const verifyQRCode = async (qrCode: string): Promise<VaccinationCert | null> => {
  const certData = parseCertData(qrCode);

  let verifyResult = null;

  switch (certData.type) {
    case CertType.VDS:
      {
        const vdsData = JSON.parse(certData.data);
        verifyResult = await verifyVDS(vdsData.data, vdsData.sig);
      }
      break;
    case CertType.EUDCC:
      verifyResult = await verifyEUDCC(certData.data);
      break;
    default:
      break;
  }

  return verifyResult;
};

export * from './eudcc';
export * from './vds';
