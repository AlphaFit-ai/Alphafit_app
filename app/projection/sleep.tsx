import { renderStep } from '../../src/wizard';

/** One question of the Projection wizard, drawn from `src/wizard/flows.ts`. */
export default function SleepScreen() {
  return renderStep('projection-sleep');
}
