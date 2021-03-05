import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  //IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../types';
import { DATA_ACCOUNT_ENTITY } from './account';

export async function fetchAssets({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);
  const accountEntity = (await jobState.getData(DATA_ACCOUNT_ENTITY)) as Entity;
  await apiClient.iterateAssets(async (asset) => {
    const assetProps = asset.resource;
    var classAssigned: string;
    if (assetProps.asset_type == 'API' || assetProps.asset_type == 'api') {
      classAssigned = 'ApplicationEndpoint';
    } else {
      classAssigned = 'Application';
    } // just a stub here... need specific decisions
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: asset,
          assign: {
            _type: 'cobalt_asset',
            _class: classAssigned,
            _key: assetProps.id,
            name: assetProps.title,
            displayName: assetProps.title,
            description: assetProps.description,
            assetType: assetProps.asset_type,
            attachments: JSON.stringify(assetProps.attachments, null, 2),
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );
  });
}

export const assetSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-assets',
    name: 'Fetch Assets',
    entities: [
      {
        resourceName: 'Cobalt Asset',
        _type: 'cobalt_asset',
        _class: 'Application',
      },
    ],
    relationships: [
      {
        _type: 'acme_account_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'acme_account',
        targetType: 'acme_user',
      },
      {
        _type: 'acme_account_has_group',
        _class: RelationshipClass.HAS,
        sourceType: 'acme_account',
        targetType: 'acme_group',
      },
      {
        _type: 'acme_group_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'acme_group',
        targetType: 'acme_user',
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchAssets,
  },
];
