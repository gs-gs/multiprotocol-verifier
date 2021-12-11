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
  /** Test Event */
  testEvents?: Maybe<Array<Maybe<TestEvent>>>;
  /** Recovery Event */
  recoveryEvents?: Maybe<Array<Maybe<RecoveryEvent>>>;
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

type VaccinationEvent = {
  /** Disease or agent that the vaccination provides protection against (max size 6) */
  disease?: Maybe<Scalars['String']>;
  /** Vaccination Details */
  vaccinationDetails?: Maybe<Array<Maybe<VaccinationDetails>>>;
  /** Vaccine or vaccine sub-type (ICD-11 Extension codes (http://id.who.int/icd/entity/164949870) */
  vaccine?: Maybe<Scalars['String']>;
  /** Medicinal product name */
  vaccineBrand?: Maybe<Scalars['String']>;
};

type VaccinationDetails = {
  /** The name or identifier of the vaccination facility */
  administeringCentre?: Maybe<Scalars['String']>;
  /**
   * The country in which the individual has been vaccinated. A three letter code identifying the issuing state or organization.
   * The three letter code is according to Doc 9303-3.
   */
  countryOfVaccination?: Maybe<Scalars['String']>;
  /** Date on which the vaccine was administered. The ISO8601 full date format YYYY-MM-DD MUST be used. */
  dateOfVaccination?: Maybe<Scalars['Date']>;
  /** Vaccine dose number. */
  doseNumber?: Maybe<Scalars['Int']>;
  /** Date on which the next vaccination should be administered. The ISO8601 full date format YYYY-MM-DD MUST be used. */
  dueDateOfNextDose?: Maybe<Scalars['Date']>;
  /** Batch number or lot number of vaccination */
  vaccineBatchNumber?: Maybe<Scalars['String']>;
};

type TestEvent = {
  /** Disease or agent that the vaccination provides protection against (max size 6) */
  disease?: Maybe<Scalars['String']>;
  /** The type of test */
  type?: Maybe<Scalars['String']>;
  /** Test name (nucleic acid amplification tests only) */
  name?: Maybe<Scalars['String']>;
  /** Result of the test */
  result?: Maybe<Scalars['String']>;
  /** Test device identifier (rapid antigen tests only) */
  deviceId?: Maybe<Scalars['String']>;
  /** Date and time of the test sample collection */
  sampleCollectionDate?: Maybe<Scalars['String']>;
  /** Testing centre or facility */
  administeringCentre?: Maybe<Scalars['String']>;
  /** Member State or third country in which the test was carried out */
  countryCode?: Maybe<Scalars['String']>;
};

type RecoveryEvent = {
  /** Disease or agent that the vaccination provides protection against (max size 6) */
  disease?: Maybe<Scalars['String']>;
  /** Date of the holder’s first positive NAAT test result */
  firstPositiveDate?: Maybe<Scalars['String']>;
  /** Member State or third country in which the test was carried out */
  countryCode?: Maybe<Scalars['String']>;
  /** Certificate valid from */
  validFrom?: Maybe<Scalars['String']>;
  /** Certificate valid until */
  validUntil?: Maybe<Scalars['String']>;
};
