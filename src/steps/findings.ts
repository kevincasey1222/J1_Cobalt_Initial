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

export async function fetchFindings({
  instance,
  jobState,
}: IntegrationStepExecutionContext<IntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(DATA_ACCOUNT_ENTITY)) as Entity;

  await apiClient.iterateFindings(async (finding) => {
    const findingProps = finding.resource;
    const findingEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: finding,
          assign: {
            _type: 'cobalt_finding',
            _class: 'Finding',
            _key: findingProps.id,
            tag: findingProps.tag,
            name: findingProps.title,
            displayName: findingProps.title,
            description: findingProps.description,
            category: findingProps.type_category, //required property in J1 Finding
            typeCategory: findingProps.type_category,
            labels: JSON.stringify(findingProps.labels, null, 2),
            impact: JSON.stringify(findingProps.impact), //required to be a string in J1 Finding
            severity: JSON.stringify(findingProps.impact), //required property in J1 Finding
            numericSeverity: findingProps.impact, //required property in J1 Finding
            likelihood: findingProps.likelihood,
            state: findingProps.state,
            open: true, //required property in J1 Finding
            affectedTargets: JSON.stringify(
              findingProps.affected_targets,
              null,
              2,
            ),
            proofOfConcept: findingProps.proof_of_concept,
            suggestedFix: findingProps.suggested_fix,
            prerequisites: findingProps.prerequisites,
            pentestID: findingProps.pentest_id,
            assetID: findingProps.asset_id,
            log: JSON.stringify(findingProps.log, null, 2),
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: findingEntity,
      }),
    );
  });
}

export const findingSteps: IntegrationStep<IntegrationConfig>[] = [
  {
    id: 'fetch-findings',
    name: 'Fetch Findings',
    entities: [
      {
        resourceName: 'Cobalt Finding',
        _type: 'cobalt_finding',
        _class: 'Finding',
      },
    ],
    relationships: [
      {
        _type: 'cobalt_account_has_finding',
        _class: RelationshipClass.HAS,
        sourceType: 'cobalt_account',
        targetType: 'cobalt_finding',
      },
    ],
    dependsOn: ['fetch-pentests'],
    executionHandler: fetchFindings,
  },
];
