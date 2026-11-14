import React from 'react';
import { ChoiceStep } from './ChoiceStep';
import { STEPS } from './flows';
import { YesNoStep } from './YesNoStep';

export { STEPS } from './flows';
export type { StepConfig } from './flows';

/** The screen for a configured step: what each `app/diet/*` and `app/projection/*` route renders. */
export function renderStep(id: keyof typeof STEPS | string): React.ReactElement {
  const config = STEPS[id];
  if (!config) throw new Error(`Unknown wizard step ${id}`);
  return config.kind === 'choice'
    ? React.createElement(ChoiceStep, { config })
    : React.createElement(YesNoStep, { config });
}
