export type AboutPageSection = {
  id: string;
  title: string;
  body: string;
  image_url: string;
  image_alt: string;
};

export type AboutPageContent = {
  hero_title: string;
  hero_body: string;
  hero_image_url: string;
  hero_image_alt: string;
  sections: AboutPageSection[];
  cta_title: string;
  cta_subtitle: string;
};

export const DEFAULT_ABOUT_PAGE_CONTENT: AboutPageContent = {
  hero_title: 'Our Purpose',
  hero_body: 'Photo Healthy is a vibrant community where wellness meets visual storytelling. We empower individuals to document and share their healthy living journeys through photography, building meaningful connections along the way.',
  hero_image_url: '',
  hero_image_alt: 'Photo Healthy community wellness illustration',
  sections: [
    {
      id: 'our-mission',
      title: 'Our Mission',
      body: '“We believe that health is not just a destination — it is a daily practice. Every meal prepared with care, every morning run, every mindful breath is a step toward a better you. Our platform exists to celebrate those moments and connect the people who share them.”\n\nPhoto Healthy was born from a simple idea: sharing your wellness journey can inspire others to begin their own. When we see someone else’s healthy breakfast or sunrise yoga session, something shifts in us. We are reminded that we are not alone on this path.\n\n— Photo Healthy Team',
      image_url: '',
      image_alt: '',
    },
    {
      id: 'our-story',
      title: 'Our Story',
      body: 'Founded in 2024, Photo Healthy grew from a small group of friends who wanted to hold each other accountable for their wellness goals. We started sharing photos of our healthy meals and workouts in a private chat — and it worked.\n\nThe encouragement was real, the accountability was genuine, and the results were undeniable. We realized this model could help thousands more people achieve their wellness goals if we built a proper platform for it.\n\nToday, Photo Healthy is home to a thriving community of health-conscious individuals across the globe, all united by the power of visual storytelling and mutual support.',
      image_url: '',
      image_alt: 'A person taking a wellness photo outdoors',
    },
  ],
  cta_title: 'Join Your Wellness Community',
  cta_subtitle: 'Be part of a growing wellness community that encourages every step. Connect and share with people from around the world.',
};

const valueOrFallback = (value: any, fallback: string) =>
  value === undefined || value === null ? fallback : String(value);

export function normalizeAboutPageContent(value: any): AboutPageContent {
  let parsed = value;
  if (typeof value === 'string' && value.trim()) {
    try { parsed = JSON.parse(value); } catch { parsed = null; }
  }
  if (!parsed || typeof parsed !== 'object') return DEFAULT_ABOUT_PAGE_CONTENT;

  const rawSections = Array.isArray(parsed.sections) ? parsed.sections.slice(0, 12) : [];
  const sections = rawSections.map((section: any, index: number) => ({
    id: String(section?.id || `about-section-${index + 1}`),
    title: valueOrFallback(section?.title, `Section ${index + 1}`),
    body: String(section?.body || section?.text || ''),
    image_url: String(section?.image_url || section?.image || '').trim(),
    image_alt: String(section?.image_alt || section?.alt || '').trim(),
  })).filter((section: AboutPageSection) => section.title || section.body || section.image_url);

  return {
    hero_title: valueOrFallback(parsed.hero_title, DEFAULT_ABOUT_PAGE_CONTENT.hero_title),
    hero_body: valueOrFallback(parsed.hero_body, DEFAULT_ABOUT_PAGE_CONTENT.hero_body),
    hero_image_url: String(parsed.hero_image_url || '').trim(),
    hero_image_alt: valueOrFallback(parsed.hero_image_alt, DEFAULT_ABOUT_PAGE_CONTENT.hero_image_alt),
    sections: sections.length ? sections : DEFAULT_ABOUT_PAGE_CONTENT.sections,
    cta_title: valueOrFallback(parsed.cta_title, DEFAULT_ABOUT_PAGE_CONTENT.cta_title),
    cta_subtitle: valueOrFallback(parsed.cta_subtitle, DEFAULT_ABOUT_PAGE_CONTENT.cta_subtitle),
  };
}
