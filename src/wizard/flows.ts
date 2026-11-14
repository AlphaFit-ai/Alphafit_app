import type { Ionicons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';

/**
 * The questions of the Diet and Projection wizards as data. A screen under `app/` is one line that
 * names a step; `ChoiceStep` and `YesNoStep` render it. Adding a question means adding an entry here
 * (and its translations), not another screen with its own layout, saving and navigation code.
 */

export type FlowId = 'diet' | 'projection';

export interface Choice {
  value: string;
  /** Translation key of the label, or a plain `label` for values like "<3k". */
  labelKey?: string;
  label?: string;
  /** Interpolation values for `labelKey`. */
  labelParams?: Record<string, string | number>;
  image?: ImageSourcePropType;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface BaseStep {
  id: string;
  flow: FlowId;
  /** Position in the flow: the wizard's `currentStep` value for this question. */
  index: number;
  titleKey: string;
  image?: ImageSourcePropType;
}

export interface ChoiceStepConfig extends BaseStep {
  kind: 'choice';
  /** `tiles` = two-column picture tiles, `list` = full-width option cards, `numbers` = big short values. */
  layout: 'tiles' | 'list' | 'numbers';
  options: Choice[];
  /** Name of the field that holds the answer. */
  field: string;
  /** Stored values may be numbers (meals per day): convert here. */
  toStored?: (value: string) => string | number;
  fromStored?: (stored: unknown) => string | undefined;
}

export interface YesNoStepConfig extends BaseStep {
  kind: 'yesno';
  yesKey: string;
  noKey: string;
  placeholderKey: string;
  /** Boolean field ("hasAllergies") and the free-text field ("allergies"). */
  flagField: string;
  textField: string;
}

export type StepConfig = ChoiceStepConfig | YesNoStepConfig;

export const DIET_TOTAL_QUESTIONS = 4;
export const PROJECTION_FIRST_QUESTION = 1;
export const PROJECTION_TOTAL_QUESTIONS = 3;

export const STEPS: Record<string, StepConfig> = {
  'diet-preference': {
    kind: 'choice',
    id: 'diet-preference',
    flow: 'diet',
    index: 0,
    titleKey: 'diet.preference.title',
    layout: 'tiles',
    field: 'dietPreference',
    options: [
      {
        value: 'vegetarian',
        labelKey: 'diet.preference.highProtein',
        image: require('../../assets/images/diet/High-Protein.png'),
      },
      {
        value: 'vegan',
        labelKey: 'diet.preference.plantBased',
        image: require('../../assets/images/diet/Plant-Based.png'),
      },
      {
        value: 'non-veg',
        labelKey: 'diet.preference.lowCarb',
        image: require('../../assets/images/diet/Low-Carb.png'),
      },
      {
        value: 'flexible',
        labelKey: 'diet.preference.balanced',
        image: require('../../assets/images/diet/Balanced.png'),
      },
    ],
  },
  'diet-allergies': {
    kind: 'yesno',
    id: 'diet-allergies',
    flow: 'diet',
    index: 1,
    titleKey: 'diet.allergies.title',
    image: require('../../assets/images/diet/food allergy.png'),
    yesKey: 'diet.allergies.yes',
    noKey: 'diet.allergies.no',
    placeholderKey: 'diet.allergies.placeholder',
    flagField: 'hasAllergies',
    textField: 'allergies',
  },
  'diet-meals': {
    kind: 'choice',
    id: 'diet-meals',
    flow: 'diet',
    index: 2,
    titleKey: 'diet.meals.title',
    image: require('../../assets/images/diet/meals.png'),
    layout: 'numbers',
    field: 'mealsPerDay',
    // 5 means "5 or more".
    options: [
      { value: '2', labelKey: 'diet.meals.options.2' },
      { value: '3', labelKey: 'diet.meals.options.3' },
      { value: '4', labelKey: 'diet.meals.options.4' },
      { value: '5', labelKey: 'diet.meals.options.5' },
    ],
    toStored: (value) => Number(value),
    fromStored: (stored) => (typeof stored === 'number' ? String(stored) : undefined),
  },
  'diet-supplements': {
    kind: 'yesno',
    id: 'diet-supplements',
    flow: 'diet',
    index: 3,
    titleKey: 'diet.supplements.title',
    image: require('../../assets/images/diet/supplements.png'),
    yesKey: 'diet.supplements.yes',
    noKey: 'diet.supplements.no',
    placeholderKey: 'diet.supplements.placeholder',
    flagField: 'takesSupplements',
    textField: 'supplements',
  },
  'projection-sleep': {
    kind: 'choice',
    id: 'projection-sleep',
    flow: 'projection',
    index: 1,
    titleKey: 'projection.sleep.title',
    layout: 'list',
    field: 'sleepHours',
    options: ['<5', '5-6', '7-8', '9+'].map((v) => ({
      value: v,
      labelKey: 'projection.sleep.option',
      labelParams: { value: v },
      icon: 'moon-outline' as const,
    })),
  },
  'projection-steps': {
    kind: 'choice',
    id: 'projection-steps',
    flow: 'projection',
    index: 2,
    titleKey: 'projection.steps.title',
    image: require('../../assets/images/projection/walking.png'),
    layout: 'list',
    field: 'dailySteps',
    options: [
      { value: '<3k', label: '<3k' },
      { value: '3-6k', label: '3-6k' },
      { value: '7-10k', label: '7-10k' },
      { value: '10k+', label: '10k +' },
    ],
  },
  'projection-stress': {
    kind: 'choice',
    id: 'projection-stress',
    flow: 'projection',
    index: 3,
    titleKey: 'projection.stress.title',
    image: require('../../assets/images/projection/stress.png'),
    layout: 'list',
    field: 'stressLevel',
    options: [
      { value: 'low', labelKey: 'onboarding.activity.low', icon: 'trending-down' },
      { value: 'moderate', labelKey: 'onboarding.activity.medium', icon: 'thumbs-up' },
      { value: 'high', labelKey: 'onboarding.activity.high', icon: 'trending-up' },
    ],
  },
};

/** The question index the user is on, as the number shown in "Step n of m" (null: not a question). */
export function questionNumber(step: StepConfig): { current: number; total: number } {
  if (step.flow === 'diet') return { current: step.index + 1, total: DIET_TOTAL_QUESTIONS };
  return {
    current: step.index - PROJECTION_FIRST_QUESTION + 1,
    total: PROJECTION_TOTAL_QUESTIONS,
  };
}
