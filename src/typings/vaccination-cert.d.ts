type VaccinationCert = {
  /** Unique Vaccination Certificate Identifier */
  id?: Maybe<Scalars['String']>;
  /**
   * A three letter code identifying the issuing state or organization.
   * The three letter code is according to Doc 9303-3.
   */
  issuingCountry?: Maybe<Scalars['String']>;
  /** Person Identification */
  personIdentification?: Maybe<VaccinationCertPersonIdentification>;
  /**
   * Type is set to “icao.test” for PoT (data defined by CAPSCA), “icao.vacc” for PoV (data defined by WHO).
   * Other Types may be added in the future
   */
  type?: Maybe<Scalars['String']>;
  /** Vaccination Event */
  vaccinationEvents?: Maybe<Array<Maybe<VaccinationEvent>>>;
  /**
   * Each of the use cases will define a version number for the structure.
   * In case of changes in structure, the version number will be incremented.
   */
  version?: Maybe<Scalars['String']>;
};

type VaccinationCertPersonIdentification = {
  /** Any other document number at discretion of issuer (Max size 24) */
  additionalIdentifier?: Maybe<Scalars['String']>;
  /** Date of birth of test subject, ISO8601 YYYY-MM-DD (Max size 10) */
  dob?: Maybe<Scalars['Date']>;
  /** Name of the holder */
  name?: Maybe<Scalars['String']>;
  /** Sex of the test subject (Max size 1) */
  sex?: Maybe<Scalars['String']>;
  /**
   * Travel Document Number
   * Single Unique Identifier only, Identifier should be valid Travel Document number
   */
  travelDocumentNumber?: Maybe<Scalars['String']>;
};

type VaccinationCertificate = {
  batchNumber?: Maybe<Scalars['String']>;
  brand?: Maybe<Scalars['String']>;
  certificateNumber?: Maybe<Scalars['String']>;
  certificateType?: Maybe<Scalars['String']>;
  countryCode?: Maybe<Scalars['String']>;
  dateOfVaccination?: Maybe<Scalars['String']>;
  doseNumber?: Maybe<Scalars['Int']>;
  facility?: Maybe<VaccinationCertificateFacility>;
  reference?: Maybe<Scalars['String']>;
  vaccineDescription?: Maybe<Scalars['String']>;
};

type VaccinationCertificateFacility = {
  name?: Maybe<Scalars['String']>;
};
