import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../client';
import { IntegrationConfig } from '../types';
import { DATA_ACCOUNT_ENTITY } from './account';

export async function fetchFindings({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(DATA_ACCOUNT_ENTITY)) as Entity;

  await apiClient.iterateFindings(async (finding) => {
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: finding,
          assign: {
            _type: 'cobalt_finding',
            _class: 'Finding',
            _key: finding.id,
            tag: finding.tag,
            name: finding.title,
            displayName: finding.title,
            description: finding.description,
            typeCategory: finding.type_category,
            labels: JSON.stringify(finding.labels),
            impact: finding.impact,
            likelihood: finding.likelihood,
            state: finding.state,
            affectedTargets: JSON.stringify(finding.affected_targets),
            proofOfConcept: finding.proof_of_concept,
            suggestedFix: finding.suggested_fix,
            prerequisites: finding.prerequisites,
            pentestID: finding.pentest_id,
            assetID: finding.asset_id,
            log: JSON.stringify(finding.log),
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

export async function fetchGroups({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(DATA_ACCOUNT_ENTITY)) as Entity;

  await apiClient.iterateGroups(async (group) => {
    const groupEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: group,
          assign: {
            _type: 'acme_group',
            _class: 'UserGroup',
            email: 'testgroup@test.com',
            // This is a custom property that is not a part of the data model class
            // hierarchy. See: https://github.com/JupiterOne/data-model/blob/master/src/schemas/UserGroup.json
            logoLink: 'https://test.com/logo.png',
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: groupEntity,
      }),
    );

    for (const user of group.users || []) {
      const userEntity = await jobState.findEntity(user.id);

      if (!userEntity) {
        throw new IntegrationMissingKeyError(
          `Expected user with key to exist (key=${user.id})`,
        );
      }

      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: groupEntity,
          to: userEntity,
        }),
      );
    }
  });
}

export const accessSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'Account',
        _type: 'acme_account',
        _class: 'Account',
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
    executionHandler: fetchUsers,
  },
];
