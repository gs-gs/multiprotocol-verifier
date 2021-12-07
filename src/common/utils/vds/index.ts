import { Certificate } from '@fidm/x509';
import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';
import jwa from 'jwa';

import { logger } from 'common/utils/logger';
import { getQR } from 'common/utils/qr';

import cscaCertificates from './csca-certificates.json';

const toBase64 = (base64url: string) => {
  base64url = base64url.toString();

  const padding = 4 - (base64url.length % 4);
  if (padding !== 4) {
    for (let i = 0; i < padding; ++i) {
      base64url += '=';
    }
  }

  return base64url.replace(/-/g, '+').replace(/_/g, '/');
};

const verifyCertificateAuthority = async (cert: string): Promise<boolean> => {
  const parsedCert = Certificate.fromPEM(Buffer.from(cert));
  if (!parsedCert?.authorityKeyIdentifier) {
    throw Error('Invalid Certificate, Missing authorityKeyIdentifier');
  }
  const parseCertJson = parsedCert.toJSON();

  // Look for authorityKeyIdentifier matches that of csca;
  let matchingCertificate = cscaCertificates?.find((cert) => {
    return (
      cert.authorityKeyIdentifier === parsedCert?.authorityKeyIdentifier && cert.country === parseCertJson.issuer.C
    );
  });
  if (matchingCertificate) {
    const cscaCertificate = Certificate.fromPEM(Buffer.from(matchingCertificate?.pem));
    if (cscaCertificate?.authorityKeyIdentifier === parsedCert?.authorityKeyIdentifier) {
      logger.debug('BSC authorityKeyIdentifier matches that of csca certificate: %o', {
        country: matchingCertificate?.country,
        authorityKeyIdentifier: matchingCertificate?.authorityKeyIdentifier,
        serialNumber: matchingCertificate?.serialNumber,
      });
      return true;
    }
  }

  logger.debug('No matching csca certificate(using authorityKeyIdentifier) found for BSC authorityKeyIdentifier: %o', {
    country: parseCertJson.issuer.C,
    authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
  });

  // Look for authorityKeyIdentifier matches that of csca;
  matchingCertificate = cscaCertificates?.find((cert) => {
    return cert.subjectKeyIdentifier === parsedCert?.authorityKeyIdentifier && cert.country === parseCertJson.issuer.C;
  });

  if (matchingCertificate) {
    const cscaCertificate = Certificate.fromPEM(Buffer.from(matchingCertificate?.pem));
    if (cscaCertificate?.subjectKeyIdentifier === parsedCert?.authorityKeyIdentifier) {
      logger.debug('BSC authorityKeyIdentifier matches subjectKeyIdentifier of csca certificate: %o', {
        country: matchingCertificate?.country,
        authorityKeyIdentifier: matchingCertificate?.authorityKeyIdentifier,
        serialNumber: matchingCertificate?.serialNumber,
      });
      return true;
    }
  }

  logger.debug("BSC authorityKeyIdentifier doesn't match any of csca certificates: %o", {
    country: parseCertJson.issuer.C,
    authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
    certificate: parseCertJson,
  });

  return false;
};

const mapVaccinationResults = async (data: VdsDataInput): Promise<VaccinationCert> => {
  return new Promise((resolve) => {
    const pid = data?.msg?.pid;
    const ve = data?.msg?.ve;

    const vaccinationEvents: VaccinationCert['vaccinationEvents'] = ve?.map((vaccinationEvent) => {
      return {
        disease: vaccinationEvent?.dis,
        vaccine: vaccinationEvent?.des,
        vaccineBrand: vaccinationEvent?.nam,
        vaccinationDetails: vaccinationEvent?.vd?.map((details) => ({
          administeringCentre: details?.adm,
          dateOfVaccination: details?.dvc,
          doseNumber: details?.seq,
          countryOfVaccination: details?.ctr,
          vaccineBatchNumber: details?.lot,
          dueDateOfNextDose: details?.dvn,
        })),
      };
    });

    resolve({
      id: data?.msg?.uvci,
      issuingCountry: data?.hdr?.is,
      type: data?.hdr?.t,
      version: data?.hdr?.v ? `${data?.hdr?.v}` : null,
      personIdentification: {
        additionalIdentifier: pid?.ai,
        dob: pid?.dob,
        name: pid?.n,
        sex: pid?.sex,
        travelDocumentNumber: pid?.i,
      },
      vaccinationEvents,
    });
  });
};

export const verifyVDS = async (data?: VdsDataInput, sig?: VdsSignatureInput): Promise<VaccinationCert | null> => {
  if (data?.hdr?.t !== 'icao.vacc') {
    throw Error('Not a valid proof of vaccination');
  }

  if (!data?.msg?.pid?.i && !data?.msg?.pid?.dob) {
    throw Error('Either travel document number or date of birth is required');
  }

  if (!sig?.alg || !sig?.cer || !sig?.sigvl) {
    throw Error('Missing signature attributes');
  }

  const cert = `-----BEGIN CERTIFICATE-----\n${toBase64(sig.cer)}\n-----END CERTIFICATE-----`;

  const canonicalJSONPayload = canonicalize({ ...data });

  const signature = toBase64(sig.sigvl);

  try {
    const pubicKey = crypto.createPublicKey(cert).export({ type: 'spki', format: 'pem' });

    // Elliptic Curve Digital Signature Algorithm
    // eslint-disable-next-line
    const ecdsa = jwa(sig.alg as any);

    // STEP 1: Verify the signature in the VDS
    const isValid = ecdsa.verify(canonicalJSONPayload, signature, pubicKey as string);

    // STEP 2: Verify if the VDS was signed by country signing certificate
    const authorityVerified = await verifyCertificateAuthority(cert);

    if (isValid && authorityVerified) {
      return mapVaccinationResults(data);
    }
  } catch (error) {
    logger.error('Error validating certificate signature %s', error);
  }

  return null;
};

export const verifyVDSImageOrPDF = async (base64: string): Promise<VaccinationCert | null> => {
  const QRData = await getQR(base64);

  return verifyVDS(QRData?.data, QRData?.sig);
};
