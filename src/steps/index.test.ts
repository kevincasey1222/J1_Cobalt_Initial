import { createMockStepExecutionContext } from '@jupiterone/integration-sdk-testing';

import { IntegrationConfig } from '../types';
import { fetchAccountDetails } from './account';
import { fetchFindings } from './findings';
import { fetchPentests } from './pentests';
import { fetchAssets } from './assets';
import { getVulnerabilityLink, getVulnerabilityNumber } from '../util';

//const DEFAULT_API_KEY = 'dummy-api-key';

const integrationConfig: IntegrationConfig = {
  apiKeyAuth:
    process.env.API_KEY_AUTH || 'L17FtgVqScP4tRsHcHGumU8eD7KZLHuqiMGtebir', //DEFAULT_API_KEY,
};

test('should collect data', async () => {
  const context = createMockStepExecutionContext<IntegrationConfig>({
    instanceConfig: integrationConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchAssets(context);
  await fetchPentests(context);
  await fetchFindings(context);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBeGreaterThan(0);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      properties: {
        _type: { const: 'cobalt_account' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const vendors = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Vendor'),
  );
  expect(vendors.length).toBeGreaterThan(0);
  expect(vendors).toMatchGraphObjectSchema({
    _class: ['Vendor'],
    schema: {
      properties: {
        _type: { const: 'cobalt_vendor' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const services = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Service'),
  );
  expect(services.length).toBeGreaterThan(0);
  expect(services).toMatchGraphObjectSchema({
    _class: ['Service'],
    schema: {
      properties: {
        _type: { const: 'cobalt_service' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const pentests = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Assessment'),
  );
  expect(pentests).toMatchGraphObjectSchema({
    _class: ['Assessment'],
    schema: {
      properties: {
        _type: { const: 'cobalt_pentest' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: [],
    },
  });

  const findings = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Finding'),
  );
  expect(findings).toMatchGraphObjectSchema({
    _class: ['Finding'],
    schema: {
      properties: {
        _type: { const: 'cobalt_finding' },
        pentestId: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['pentestId'],
    },
  });
});

describe('testing regex extraction of URLs from pentest descriptions', () => {
  test('recognize link and number of CWE', () => {
    const input =
      'Your weakness is basically https://cwe.mitre.org/data/definitions/307.html okay?';
    expect(getVulnerabilityLink(input)).toBe(
      'https://cwe.mitre.org/data/definitions/307.html',
    );
    expect(getVulnerabilityNumber(getVulnerabilityLink(input))).toBe('CWE-307');
  });

  test('recognize link and number of CVE from mitre', () => {
    const input =
      'Your vulnerability is basically https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2021-2138 okay?';
    expect(getVulnerabilityLink(input)).toBe(
      'https://nvd.nist.gov/vuln/detail/CVE-2021-2138', //yes, it's expected to change mitre to nvd
    );
    expect(getVulnerabilityNumber(getVulnerabilityLink(input))).toBe(
      'CVE-2021-2138',
    );
  });

  test('recognize link and number of CVE from nvd', () => {
    const input =
      'Your vulnerability is basically https://nvd.nist.gov/vuln/detail/CVE-2021-2138 okay?';
    expect(getVulnerabilityLink(input)).toBe(
      'https://nvd.nist.gov/vuln/detail/CVE-2021-2138',
    );
    expect(getVulnerabilityNumber(getVulnerabilityLink(input))).toBe(
      'CVE-2021-2138',
    );
  });
});
//more tests todo:
//build in recording, with appropriate redaction, take out real API key

//validate regex url scraper
//end of of word marker to regex for urls so we don't get multiple in one match
//validate bad token handling and refresh process
//consider - should be just discard a finding without a pentest? Right now throws error
//update snapshots when ready
