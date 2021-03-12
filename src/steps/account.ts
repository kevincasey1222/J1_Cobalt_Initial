import {
  createDirectRelationship,
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
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

  const vendorEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'Cobalt',
          name: 'Cobalt',
        },
        assign: {
          _key: `cobalt-vendor`,
          _type: 'cobalt_vendor',
          _class: 'Vendor',
          name: 'Cobalt',
          displayName: 'Cobalt',
          category: 'pentesters',
        },
      },
    }),
  );

  const serviceEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'Cobalt-pentest-service',
          name: 'Cobalt pentest service',
        },
        assign: {
          _key: `cobalt-pentest-service`,
          _type: 'cobalt_service',
          _class: 'Service',
          name: 'Cobalt pentest service',
          displayName: 'Cobalt pentest service',
          category: ['pentesters'],
        },
      },
    }),
  );

  await jobState.addRelationship(
    createDirectRelationship({
      _class: RelationshipClass.PROVIDES,
      from: vendorEntity,
      to: serviceEntity,
    }),
  );

  await jobState.addRelationship(
    createDirectRelationship({
      _class: RelationshipClass.HAS,
      from: accountEntity,
      to: serviceEntity,
    }),
  );
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
      {
        resourceName: 'Cobalt',
        _type: 'cobalt_vendor',
        _class: 'Vendor',
      },
      {
        resourceName: 'Cobalt pentest service',
        _type: 'cobalt_service',
        _class: 'Service',
      },
    ],
    relationships: [
      {
        _type: 'cobalt_account_has_service',
        _class: RelationshipClass.HAS,
        sourceType: 'cobalt_account',
        targetType: 'cobalt_service',
      },
      {
        _type: 'cobalt_vendor_provides_service',
        _class: RelationshipClass.PROVIDES,
        sourceType: 'cobalt_vendor',
        targetType: 'cobalt_service',
      },
    ],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
