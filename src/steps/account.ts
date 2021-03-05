import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { IntegrationConfig } from '../types';

export const DATA_ACCOUNT_ENTITY = 'DATA_ACCOUNT_ENTITY';

export async function fetchAccountDetails({
  jobState,
  instance,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const name = `Cobalt - ${instance.name}`;
  const accountEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'Cobalt',
          name: 'Cobalt Account',
        },
        assign: {
          _key: `cobalt-account:${instance.id}`,
          _type: 'cobalt_account',
          _class: 'Account',
          name: name,
          displayName: name,
        },
      },
    }),
  );

  await jobState.setData(DATA_ACCOUNT_ENTITY, accountEntity);
}

export const accountSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-account',
    name: 'Fetch Account Details',
    entities: [
      {
        resourceName: 'Cobalt Account',
        _type: 'cobalt_account',
        _class: 'Account',
      },
    ],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
