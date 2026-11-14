import { renderStep } from '../../src/wizard';

/** One question of the Diet wizard, drawn from `src/wizard/flows.ts`. */
export default function SupplementsScreen() {
  return renderStep('diet-supplements');
}
