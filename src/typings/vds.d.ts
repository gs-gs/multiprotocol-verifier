type VdsHeaderZoneInput = {
  /**
   * A three letter code identifying the issuing state or organization.
   * The three letter code is according to Doc 9303-3.
   */
  is: Scalars['String'];
  /**
   * Type is set to “icao.test” for PoT (data defined by CAPSCA), “icao.vacc” for PoV (data defined by WHO).
   * Other Types may be added in the future
   */
  t: Scalars['String'];
  /**
   * Each of the use cases will define a version number for the structure.
   * In case of changes in structure, the version number will be incremented.
   */
  v: Scalars['Int'];
};

type VdsPersonIdentificationInput = {
  ai?: Maybe<Scalars['String']>;
  /** Date of birth of test subject. ISO8601 YYYY-MM-DD */
  dob?: Maybe<Scalars['String']>;
  /** Travel Document Number */
  i?: Maybe<Scalars['String']>;
  /** Name of the holder */
  n: Scalars['String'];
  /** Sex of the test subject (as specified in Doc 9303-4 Section 4.1.1.1 – Visual Inspection Zone) */
  sex?: Maybe<Scalars['String']>;
};

type VdsVaccinationEventDetailsInput = {
  /** name or identifier of the vaccination facility */
  adm: Scalars['String'];
  /**
   * The country in which the individual has been vaccinated. A three letter code identifying the issuing state or organization.
   * The three letter code is according to Doc 9303-3.
   */
  ctr: Scalars['String'];
  /** Date on which the vaccine was administered. The ISO8601 full date format YYYY-MM-DD MUST be used. */
  dvc: Scalars['String'];
  /** Date on which the next vaccination should be administered. The ISO8601 full date format YYYY-MM-DD MUST be used. */
  dvn?: Maybe<Scalars['String']>;
  /** Batch number or lot number of vaccination" */
  lot: Scalars['String'];
  /** Vaccine dose number */
  seq: Scalars['Int'];
};

type VdsVaccinationEventInput = {
  /** Vaccine or vaccine sub-type (ICD-11 Extension codes (http://id.who.int/icd/entity/164949870) */
  des: Scalars['String'];
  /** Disease or agent that the vaccination provides protection against (ICD-11) */
  dis?: Maybe<Scalars['String']>;
  /** Medicinal product name */
  nam: Scalars['String'];
  /** Vaccination Details */
  vd: Array<VdsVaccinationEventDetailsInput>;
};

type VdsMessageZoneInput = {
  /** Person Identification */
  pid: VdsPersonIdentificationInput;
  /** Unique Vaccination Certificate Identifier */
  uvci: Scalars['String'];
  /** Vaccination Event */
  ve: Array<VdsVaccinationEventInput>;
};

type VdsDataInput = {
  hdr?: Maybe<VdsHeaderZoneInput>;
  msg?: Maybe<VdsMessageZoneInput>;
};

type VdsSignatureInput = {
  /**
   * The signature algorithm used to produce the signature. Signatures MUST be ECDSA. A key length of 256 bit in
   * combination with SHA-256(at the time this document is created) is RECOMMENDED.
   */
  alg: Scalars['String'];
  /** X.509 signer certificate in base64url [RFC 4648] */
  cer: Scalars['String'];
  /** Signature value signed over the Data in base64url [RFC4648] */
  sigvl: Scalars['String'];
};
