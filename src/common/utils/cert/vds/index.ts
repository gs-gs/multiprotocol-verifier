import { Certificate } from '@fidm/x509';
import crypto from 'crypto';
import { canonicalize } from 'json-canonicalize';
import jwa from 'jwa';

import { logger } from '../../logger';

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

const verifyCertificateAuthority = async (cert: string, logs: string[]): Promise<boolean> => {
  logger.debug('VDS: Verifying if the VDS was signed by country signing certificate...');
  logs.push('VDS: Verifying if the VDS was signed by country signing certificate...');

  const parsedCert = Certificate.fromPEM(Buffer.from(cert));
  if (!parsedCert?.authorityKeyIdentifier) {
    logs.push('VDS: Error: Invalid Certificate, Missing authorityKeyIdentifier.');
    throw Error('VDS: Error: Invalid Certificate, Missing authorityKeyIdentifier.');
  }
  const parseCertJson = parsedCert.toJSON();

  // Look for authorityKeyIdentifier matches that of csca;
  let matchingCertificate = cscaCertificates?.find((cscaCertificate) => {
    return (
      cscaCertificate.authorityKeyIdentifier === parsedCert?.authorityKeyIdentifier &&
      cscaCertificate.country === parseCertJson.issuer.C
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
      logs.push(
        `VDS: BSC authorityKeyIdentifier matches that of csca certificate: ${JSON.stringify({
          country: matchingCertificate?.country,
          authorityKeyIdentifier: matchingCertificate?.authorityKeyIdentifier,
          serialNumber: matchingCertificate?.serialNumber,
        })}`,
      );
      return true;
    }
  }

  logger.debug('No matching csca certificate(using authorityKeyIdentifier) found for BSC authorityKeyIdentifier: %o', {
    country: parseCertJson.issuer.C,
    authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
  });
  logs.push(
    `VDS: No matching csca certificate(using authorityKeyIdentifier) found for BSC authorityKeyIdentifier: ${JSON.stringify(
      {
        country: parseCertJson.issuer.C,
        authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
      },
    )}`,
  );

  // Look for authorityKeyIdentifier matches that of csca;
  matchingCertificate = cscaCertificates?.find((cscaCertificate) => {
    return (
      cscaCertificate.subjectKeyIdentifier === parsedCert?.authorityKeyIdentifier &&
      cscaCertificate.country === parseCertJson.issuer.C
    );
  });

  if (matchingCertificate) {
    const cscaCertificate = Certificate.fromPEM(Buffer.from(matchingCertificate?.pem));
    if (cscaCertificate?.subjectKeyIdentifier === parsedCert?.authorityKeyIdentifier) {
      logger.debug('BSC authorityKeyIdentifier matches subjectKeyIdentifier of csca certificate: %o', {
        country: matchingCertificate?.country,
        authorityKeyIdentifier: matchingCertificate?.authorityKeyIdentifier,
        serialNumber: matchingCertificate?.serialNumber,
      });
      logs.push(
        `VDS: BSC authorityKeyIdentifier matches subjectKeyIdentifier of csca certificate: ${JSON.stringify({
          country: matchingCertificate?.country,
          authorityKeyIdentifier: matchingCertificate?.authorityKeyIdentifier,
          serialNumber: matchingCertificate?.serialNumber,
        })}`,
      );
      return true;
    }
  }

  logger.debug("BSC authorityKeyIdentifier doesn't match any of csca certificates: %o", {
    country: parseCertJson.issuer.C,
    authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
    certificate: parseCertJson,
  });
  logger.push(
    `VDS: Error: BSC authorityKeyIdentifier doesn't match any of csca certificates: ${JSON.stringify({
      country: parseCertJson.issuer.C,
      authorityKeyIdentifier: parsedCert?.authorityKeyIdentifier,
      certificate: parseCertJson,
    })}`,
  );

  return false;
};

const mapVaccinationResults = async (data: VDSDataInput): Promise<VaccinationCert> => {
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

export const verifyVDS = async (
  data: VDSDataInput,
  sig: VDSSignatureInput,
  logs: string[],
): Promise<VaccinationCert | null> => {
  logger.debug('VDS: Verifying...');
  logs.push('VDS: Verifying...');

  if (data?.hdr?.t !== 'icao.vacc') {
    logs.push('VDS: Error: Not a valid proof of vaccination.');
    throw Error('VDS: Error: Not a valid proof of vaccination.');
  }

  if (!data?.msg?.pid?.i && !data?.msg?.pid?.dob) {
    logs.push('VDS: Error: Either travel document number or date of birth is required.');
    throw Error('VDS: Error: Either travel document number or date of birth is required.');
  }

  if (!sig?.alg || !sig?.cer || !sig?.sigvl) {
    logs.push('VDS: Error: Missing signature attributes.');
    throw Error('VDS: Error: Missing signature attributes.');
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
    logger.debug('VDS: Verifying the signature in the VDS...');
    logs.push('VDS: Verifying the signature in the VDS...');

    const isValid = ecdsa.verify(canonicalJSONPayload, signature, pubicKey as string);

    // STEP 2: Verify if the VDS was signed by country signing certificate
    const authorityVerified = await verifyCertificateAuthority(cert, logs);

    if (isValid && authorityVerified) {
      return mapVaccinationResults(data);
    }
  } catch (error) {
    logger.error('Error validating certificate signature %s', error);
  }

  return null;
};
