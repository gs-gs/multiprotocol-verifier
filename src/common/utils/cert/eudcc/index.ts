import { Certificate } from '@fidm/x509';
import base45 from 'base45';
import cbor from 'cbor';
import cose from 'cose-js';
import { ec as EC } from 'elliptic';
import { readFile } from 'fs';
import jws from 'jws';
import path from 'path';
import zlib from 'zlib';

import testTrustList from './test-trust-list.json';

const verifyEUDCCWithCert = async (coseBuf: Buffer, cert: string): Promise<EUDCCData | null> => {
  // Get X.509 Cert
  const x509Cert = Certificate.fromPEM(
    Buffer.from(`-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`, 'utf8'),
  );

  // Get verifier
  let verifier = { key: { x: Buffer.from(''), y: Buffer.from('') } };
  if (x509Cert.publicKey.algo === 'ecEncryption') {
    const ec = new EC('secp256k1');
    const ecKey = ec.keyFromPublic(x509Cert.publicKey.keyRaw);

    verifier = {
      key: {
        x: ecKey.getPublic().getX().toBuffer(),
        y: ecKey.getPublic().getY().toBuffer(),
      },
    };
  }

  let verified;
  try {
    verified = await cose.sign.verify(coseBuf, verifier);
  } catch (err) {
    verified = null;
  }

  if (verified) {
    verified = cbor.decodeAllSync(verified);
    verified = verified[0].get(-260).get(1);
  }

  return verified;
};

const mapVaccinationResults = (data: EUDCCData): VaccinationCert => {
  const vaccineDose = data.v?.[0] || null;
  const testResult = data.t?.[0] || null;
  const recoveryResult = data?.r?.[0] || null;

  return {
    id: vaccineDose?.ci || testResult?.ci || recoveryResult?.ci,
    issuingCountry: vaccineDose?.co || testResult?.co || recoveryResult?.co,
    type: vaccineDose ? 'vaccine-dose' : testResult ? 'test-result' : 'recover-result',
    version: data.ver,
    personIdentification: {
      name: `${data.nam.fn} ${data.nam.gn}`,
      dob: data.dob,
    },
    vaccinationEvents: vaccineDose
      ? [
          {
            disease: vaccineDose.tg,
            vaccine: vaccineDose.vp,
            vaccineBrand: vaccineDose.mp,
            vaccinationDetails: [
              {
                administeringCentre: vaccineDose.ma,
                dateOfVaccination: vaccineDose.dt,
                doseNumber: +vaccineDose.dn,
                countryOfVaccination: vaccineDose.co,
                vaccineBatchNumber: vaccineDose.sd,
              },
            ],
          },
        ]
      : [],
    testEvents: testResult
      ? [
          {
            disease: testResult.tg,
            type: testResult.tt,
            name: testResult.nm,
            result: testResult.tr,
            deviceId: testResult.ma,
            sampleCollectionDate: testResult.sc,
            administeringCentre: testResult.tc,
            countryCode: testResult.co,
          },
        ]
      : [],
    recoveryEvents: recoveryResult
      ? [
          {
            disease: recoveryResult.tg,
            firstPositiveDate: recoveryResult.fr,
            countryCode: recoveryResult.co,
            validFrom: recoveryResult.df,
            validUntil: recoveryResult.du,
          },
        ]
      : [],
  };
};

export const verifyEUDCC = async (certData: string): Promise<VaccinationCert | null> => {
  // Base45 Decode
  let base45Decoded;
  try {
    base45Decoded = Buffer.from(base45.decode(certData));
  } catch {
    throw new Error('Base45 decode failed.');
  }

  // ZLib Decompression
  let decompressed;
  try {
    decompressed = zlib.inflateSync(base45Decoded);
  } catch {
    throw new Error('ZLib decompression failed.');
  }

  // CBOR Data
  let cborData;
  try {
    cborData = cbor.decodeAllSync(decompressed);
  } catch {
    throw new Error('CBOR decode failed.');
  }

  // COSE claim
  let coseClaim;
  try {
    coseClaim = cbor.decodeAllSync(cborData[0].value[cborData[0].value.length - 2]);
  } catch {
    throw new Error('COSE Claim decode failed.');
  }
  if (!coseClaim) {
    throw new Error('Claim not found!');
  }

  // Issuer Country
  let issuerCountry: string;
  try {
    issuerCountry = coseClaim[0].get(1);
  } catch {
    throw new Error('COSE Claim Issuer Country decode failed.');
  }
  if (!issuerCountry) {
    throw new Error('Issuer country not found!');
  }

  // Get Trust List
  const trustListBuf = await new Promise<Buffer>((resolve, reject) => {
    readFile(path.join(__dirname, 'trust-list'), (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });

  const trustListDecoded = jws.decode(trustListBuf.toString());
  const trustListPayload = JSON.parse(trustListDecoded.payload);

  const trustKeys = [
    ...trustListPayload.dsc_trust_list[issuerCountry].keys, // Trust List from https://dgcg.covidbevis.se/tp/
    ...(testTrustList?.find((trustList) => trustList.issuerCountry === issuerCountry)?.keys || []), // Test keys from https://github.com/eu-digital-green-certificates/dgc-testdata/
  ];
  let cert = null;

  // Validate with trust list
  for (const trustKey of trustKeys) {
    cert = await verifyEUDCCWithCert(decompressed, trustKey.x5c[0]);
    if (cert) {
      break;
    }
  }

  if (!cert) {
    throw new Error('Invalid certificate');
  }

  return mapVaccinationResults(cert);
};
