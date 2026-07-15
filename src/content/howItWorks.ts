export type HowItWorksStep = {
  id: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
};

export type HowItWorksContent = {
  hero_title: string;
  hero_subtitle: string;
  steps: HowItWorksStep[];
  pro_title: string;
  pro_body: string;
  pro_benefits: string[];
  cta_title: string;
  cta_subtitle: string;
};

export const DEFAULT_HOW_IT_WORKS_CONTENT: HowItWorksContent = {
  hero_title: 'How It Works',
  hero_subtitle: 'Getting healthy has never been easier. Join a community that motivates you every single day.',
  steps: [
    {
      id: 'create-profile',
      title: 'Sign Up & Create Your Profile',
      body: 'Join for free in seconds. Create your profile and set your wellness goals to get started on the right foot.\n\nIntroduce yourself to the community and let others know what you are working toward. No credit card required.',
      image_url: '',
      image_alt: 'A Photo Healthy member creating a profile',
    },
    {
      id: 'join-challenges',
      title: 'Join Challenges & Submit Photos',
      body: 'Browse active challenges across nutrition, fitness, mindfulness, and more to find what motivates you.\n\nSubmit photos to document your journey, inspire others, and stay accountable to your goals every day.',
      image_url: '',
      image_alt: 'A member submitting a wellness challenge photo',
    },
    {
      id: 'track-progress',
      title: 'Engage, Grow & Track Progress',
      body: "Like and comment on others' submissions, receive genuine encouragement, and build real connections.\n\nUse your personal dashboard to track your wellness journey and celebrate milestones along the way.",
      image_url: '',
      image_alt: 'Photo Healthy community members celebrating progress',
    },
  ],
  pro_title: 'Pro Benefits',
  pro_body: 'Go further with more ways to participate, connect, and celebrate your wellness journey.',
  pro_benefits: [
    'Unlimited monthly challenge submissions',
    'Access to Pro-only exclusive challenges',
    'Pro badge on your profile',
    'Access to Pro-only shop items',
  ],
  cta_title: 'Ready to Start Your Journey?',
  cta_subtitle: 'Join thousands of members already living healthier lives',
};

const text = (value: any, fallback: string) => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

export function normalizeHowItWorksContent(value: any): HowItWorksContent {
  let parsed = value;
  if (typeof value === 'string' && value.trim()) {
    try { parsed = JSON.parse(value); } catch { parsed = null; }
  }
  if (!parsed || typeof parsed !== 'object') return DEFAULT_HOW_IT_WORKS_CONTENT;

  const rawSteps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 12) : [];
  const steps = rawSteps.map((step: any, index: number) => ({
    id: String(step?.id || `how-step-${index + 1}`),
    title: text(step?.title, `Step ${index + 1}`),
    body: String(step?.body || step?.text || '').trim(),
    image_url: String(step?.image_url || step?.image || '').trim(),
    image_alt: String(step?.image_alt || step?.alt || '').trim(),
  })).filter((step: HowItWorksStep) => step.title || step.body || step.image_url);

  const benefits = Array.isArray(parsed.pro_benefits)
    ? parsed.pro_benefits.map((item: any) => String(item || '').trim()).filter(Boolean).slice(0, 12)
    : DEFAULT_HOW_IT_WORKS_CONTENT.pro_benefits;

  return {
    hero_title: text(parsed.hero_title, DEFAULT_HOW_IT_WORKS_CONTENT.hero_title),
    hero_subtitle: text(parsed.hero_subtitle, DEFAULT_HOW_IT_WORKS_CONTENT.hero_subtitle),
    steps: steps.length ? steps : DEFAULT_HOW_IT_WORKS_CONTENT.steps,
    pro_title: text(parsed.pro_title, DEFAULT_HOW_IT_WORKS_CONTENT.pro_title),
    pro_body: text(parsed.pro_body, DEFAULT_HOW_IT_WORKS_CONTENT.pro_body),
    pro_benefits: benefits.length ? benefits : DEFAULT_HOW_IT_WORKS_CONTENT.pro_benefits,
    cta_title: text(parsed.cta_title, DEFAULT_HOW_IT_WORKS_CONTENT.cta_title),
    cta_subtitle: text(parsed.cta_subtitle, DEFAULT_HOW_IT_WORKS_CONTENT.cta_subtitle),
  };
}
