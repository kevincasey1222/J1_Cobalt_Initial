import axios, { AxiosInstance } from 'axios';

import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from './types';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

type CobaltFinding = {
  resource: {
    id: string;
    tag: string;
    title: string;
    description: string;
    type_category: string;
    labels: object[];
    impact: number;
    likelihood: number;
    state: string;
    affected_targets: string[];
    proof_of_concept: string;
    suggested_fix: string;
    prerequisites: string;
    pentest_id: string;
    asset_id?: string;
    log?: object[];
  };
};

type CobaltAsset = {
  resource: {
    id: string;
    title: string;
    description: string;
    asset_type: string;
    attachments: object[];
  };
};

type CobaltPentest = {
  resource: {
    id: string;
    title: string;
    objectives: string;
    state: string;
    tag: string;
    asset_id: string;
    platform_tags: string[];
    methodology: string;
    targets: string[];
    start_date: string;
    end_date: string;
  };
};

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: IntegrationConfig) {}

  orgToken: '';

  getClient(): AxiosInstance {
    const client = axios.create({
      headers: {
        get: {
          client: 'JupiterOne-Cobalt Integration client',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKeyAuth}`,
          'X-Org-Token': this.orgToken || '',
        },
      },
    });
    return client;
  }

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails
    return await this.contactAPI('https://api.cobalt.io/orgs');
  }

  /**
   * Iterates each finding resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateFindings(
    iteratee: ResourceIteratee<CobaltFinding>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    const findings: CobaltFinding[] = await this.contactAPI(
      'https://api.cobalt.io/findings',
    );

    for (const finding of findings) {
      await iteratee(finding);
    }
  }

  /**
   * Iterates each pentest (penetration test) resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePentests(
    iteratee: ResourceIteratee<CobaltPentest>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    const pentests: CobaltPentest[] = await this.contactAPI(
      'https://api.cobalt.io/pentests',
    );

    for (const pentest of pentests) {
      await iteratee(pentest);
    }
  }

  /**
   * Iterates each pentest (penetration test) resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateAssets(
    iteratee: ResourceIteratee<CobaltAsset>,
  ): Promise<void> {
    // TODO paginate an endpoint, invoke the iteratee with each record in the
    // page
    //
    // The provider API will hopefully support pagination. Functions like this
    // should maintain pagination state, and for each page, for each record in
    // the page, invoke the `ResourceIteratee`. This will encourage a pattern
    // where each resource is processed and dropped from memory.

    const assets: CobaltAsset[] = await this.contactAPI(
      'https://api.cobalt.io/assets',
    );

    for (const asset of assets) {
      await iteratee(asset);
    }
  }

  public async contactAPI(url, params?) {
    let reply;
    if (this.orgToken == '') {
      this.updateOrgToken();
    }
    try {
      reply = await this.getClient().get(url, params);
      if (reply.status != 200) {
        //maybe token expired
        this.updateOrgToken();
        //try once more
        reply = await this.getClient().get(url, params);
        if (reply.status != 200) {
          //we're getting a reply, but it's not a useful one
          throw new IntegrationProviderAuthenticationError({
            endpoint: url,
            status: reply.status,
            statusText: `Received HTTP status ${reply.status} while fetching ${url}`,
          });
        }
      }
      return reply.data.data;
    } catch (err) {
      //maybe token expired
      this.updateOrgToken();
      //try once more
      reply = await this.getClient().get(url, params);
      if (reply.status != 200) {
        //we're getting a reply, but it's not a useful one
        throw new IntegrationProviderAuthenticationError({
          endpoint: url,
          status: reply.status,
          statusText: `Received HTTP status ${reply.status} while fetching ${url}`,
        });
      }
      //no, something really blew up. Just throw a general error.
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: url,
        status: err.response.status,
        statusText: err.response,
      });
    }
  }

  //there are two reasons we might need an orgToken - either we never got it, or it expired
  public async updateOrgToken() {
    try {
      const tokenSearch = await this.getClient().get(
        'https://api.cobalt.io/orgs',
      );
      if (tokenSearch.status != 200) {
        throw new IntegrationProviderAuthenticationError({
          endpoint: 'https://api.cobalt.io/orgs',
          status: tokenSearch.status,
          statusText: `Received HTTP status ${tokenSearch.status} while trying to update token. Please check API_KEY_AUTH.`,
        });
      }
      this.orgToken = tokenSearch.data.data[0].resource.token;
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: `Failed to update token from https://api.cobalt.io/orgs. Please check API_KEY_AUTH.`,
        status: err.response.status,
        statusText: err.response,
      });
    }
  }
}

export function createAPIClient(config: IntegrationConfig): APIClient {
  return new APIClient(config);
}
