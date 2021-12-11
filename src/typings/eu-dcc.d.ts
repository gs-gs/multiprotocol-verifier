/**
 * EUDCC Schema Definition
 * https://ec.europa.eu/health/sites/default/files/ehealth/docs/covid-certificate_json_specification_en.pdf
 */

type EUDCCPersonName = {
  /** Surname(s) */
  fn: string;
  /** Standardised surname(s) */
  fnt: string;
  /**  Forename(s) */
  gn: string;
  /** Standardised forename(s) */
  gnt: string;
};

type EUDCCVaccineDose = {
  /** Disease or agent targeted: COVID-19 (SARS-CoV or one of its variants) */
  tg: string;
  /** COVID-19 vaccine or prophylaxis */
  vp: string;
  /** COVID-19 vaccine product */
  mp: string;
  /** COVID-19 vaccine marketing authorisation holder or manufacturer */
  ma: string;
  /** Number in a series of doses */
  dn: string;
  /** The overall number of doses in the series */
  sd: string;
  /** Date of vaccination */
  dt: string;
  /** Member State or third country in which the vaccine was administered */
  co: string;
  /** Certificate issuer */
  is: string;
  /** Unique certificate identifier */
  ci: string;
};

type EUDCCTest = {
  /** Disease or agent targeted: COVID-19 (SARS-CoV or one of its variants) */
  tg: string;
  /** The type of test */
  tt: string;
  /** Test name (nucleic acid amplification tests only) */
  nm?: string;
  /** Test device identifier (rapid antigen tests only) */
  ma?: string;
  /** Date and time of the test sample collection */
  sc: string;
  /** Result of the test */
  tr: string;
  /** Testing centre or facility */
  tc: string;
  /** Member State or third country in which the test was carried out */
  co: string;
  /** Certificate issuer */
  is: string;
  /** Unique certificate identifier */
  ci: string;
};

type EUDCCRecovery = {
  /** Disease or agent from which the holder has recovered: COVID-19 (SARS-CoV2 or one of its variants) */
  tg: string;
  /** Date of the holder’s first positive NAAT test result */
  fr: string;
  /** Member State or third country in which test was carried out */
  co: string;
  /** Certificate issuer */
  is: string;
  /** Certificate valid from */
  df: string;
  /** Certificate valid until */
  du: string;
  /** Unique certificate identifier */
  ci: string;
};

type EUDCCData = {
  ver: string; // <version information>
  nam: EUDCCPersonName; // <person name information>
  dob: string; //<date of birth>
  v?: Array<EUDCCVaccineDose>; // <vaccination dose>
  t?: Array<EUDCCTest>; // <test information>
  r?: Array<EUDCCRecovery>; // <recovery information>
};
