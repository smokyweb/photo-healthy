export const CHALLENGE_CATEGORIES = [
  'Calm & Presence',
  'Movement & Energy',
  'Nature & Outdoors',
  'Home & Everyday Life',
  'Joy & Gratitude',
  'Connection & Community',
  'Creativity & Seeing Differently',
  'Strength & Resilience',
  'Reflection & Awareness',
  'Place & Exploration',
];

export const FEELING_CATEGORIES = [
  'Joy',
  'Love / Connection',
  'Calm / Peace',
  'Interest / Curiosity',
  'Pride / Confidence',
  'Reflection',
  'Energy',
  'Anticipation',
  'Vulnerability',
  'Renewal',
];

export const MOVEMENT_CATEGORIES = [
  'Active',
  'Subtle',
  'Gentle',
  'Energizing',
  'Grounded',
  'Fluid',
  'Playful',
  'Steady',
  'Expressive',
  'Restorative',
];

export const DEFAULT_TAXONOMY = {
  challenge_categories: CHALLENGE_CATEGORIES,
  feeling_categories: FEELING_CATEGORIES,
  movement_categories: MOVEMENT_CATEGORIES,
};

function cleanCategoryLabel(value: string) {
  return value.replace(/^[^\w]+/u, '').trim();
}

export function normalizeChallengeCategory(value?: string) {
  const raw = (value || '').trim();
  if (!raw) return '-';
  const cleaned = cleanCategoryLabel(raw);
  return CHALLENGE_CATEGORIES.includes(raw)
    ? raw
    : CHALLENGE_CATEGORIES.includes(cleaned)
      ? cleaned
      : '-';
}

export function normalizeFeelingCategory(value?: string) {
  const first = (value || '').split(',')[0].trim();
  return FEELING_CATEGORIES.includes(first) ? first : '-';
}

export function normalizeMovementCategory(value?: string) {
  const first = (value || '').split(',')[0].trim();
  return MOVEMENT_CATEGORIES.includes(first) ? first : '-';
}
