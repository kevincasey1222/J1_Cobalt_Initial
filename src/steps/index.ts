import { accountSteps } from './account';
import { accessSteps } from './access';
import { pentestSteps } from './pentests';
import { findingSteps } from './findings';

const integrationSteps = [...accountSteps, ...pentestSteps, ...findingSteps];

export { integrationSteps };
