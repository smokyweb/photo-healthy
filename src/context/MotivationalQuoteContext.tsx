import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getPublicSettings } from '../services/api';

export type MotivationalQuote = { quote: string; author?: string };

export const MIN_MOTIVATIONAL_QUOTES = 20;

export const DEFAULT_MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  { quote: 'Every photo tells a story. Make yours worth telling.' },
  { quote: 'Movement is medicine. Capture yours.' },
  { quote: 'Wellness is not a destination. It is a journey. Keep moving.' },
  { quote: 'Small steps every day lead to big changes.' },
  { quote: 'Your wellness journey is uniquely yours. Celebrate every step.' },
  { quote: 'Progress begins the moment you decide to keep going.' },
  { quote: 'Capture the moment. Celebrate the movement.' },
  { quote: 'A healthier life is built one choice at a time.' },
  { quote: 'Consistency turns ordinary effort into lasting change.' },
  { quote: 'Every walk forward is a win worth remembering.' },
  { quote: 'Celebrate what your body can do today.' },
  { quote: 'Strong habits grow from small, repeatable actions.' },
  { quote: 'You do not have to be perfect to make progress.' },
  { quote: 'One healthy choice can change the direction of your day.' },
  { quote: "Let today's effort become tomorrow's strength." },
  { quote: 'Breathe deeply, move freely, and notice the good around you.' },
  { quote: 'Your future self is cheering for the step you take today.' },
  { quote: 'Community turns motivation into momentum.' },
  { quote: 'Keep showing up. Your progress is already taking shape.' },
  { quote: 'The best view often comes after the hardest climb.' },
];

export const normalizeMotivationalQuoteLibrary = (
  value: any,
  selectedQuote?: string,
  selectedAuthor?: string,
): MotivationalQuote[] => {
  let rawItems: any[] = [];
  if (Array.isArray(value)) {
    rawItems = value;
  } else if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      rawItems = Array.isArray(parsed) ? parsed : [];
    } catch {
      rawItems = value.split('\n');
    }
  }

  const normalized = rawItems
    .map((item: any) => typeof item === 'string'
      ? { quote: item.trim(), author: '' }
      : {
          quote: String(item?.quote || item?.text || item?.content || '').trim(),
          author: String(item?.author || item?.name || '').trim(),
        })
    .filter((item: MotivationalQuote) => item.quote);

  const legacyQuote = String(selectedQuote || '').trim();
  if (legacyQuote) {
    normalized.unshift({ quote: legacyQuote, author: String(selectedAuthor || '').trim() });
  }

  const unique: MotivationalQuote[] = [];
  const seen = new Set<string>();
  [...normalized, ...DEFAULT_MOTIVATIONAL_QUOTES].forEach(item => {
    const key = item.quote.toLocaleLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(item);
  });

  return unique;
};

type MotivationalQuoteContextValue = {
  quote: MotivationalQuote;
  quotes: MotivationalQuote[];
  rotateQuote: () => void;
  refreshQuotes: () => Promise<void>;
};

const MotivationalQuoteContext = createContext<MotivationalQuoteContextValue | null>(null);

const randomIndex = (length: number, previous = -1) => {
  if (length <= 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (next === previous) next = (next + 1 + Math.floor(Math.random() * (length - 1))) % length;
  return next;
};

export function MotivationalQuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<MotivationalQuote[]>(DEFAULT_MOTIVATIONAL_QUOTES);
  const [currentIndex, setCurrentIndex] = useState(() => randomIndex(DEFAULT_MOTIVATIONAL_QUOTES.length));

  const rotateQuote = useCallback(() => {
    setCurrentIndex(previous => randomIndex(quotes.length, previous));
  }, [quotes.length]);

  const refreshQuotes = useCallback(async () => {
    try {
      const data = await getPublicSettings();
      const settings = data?.settings || data || {};
      const nextQuotes = normalizeMotivationalQuoteLibrary(
        settings.quotes_list,
        settings.motivational_quote,
        settings.motivational_quote_author,
      );
      setQuotes(nextQuotes);
      setCurrentIndex(previous => randomIndex(nextQuotes.length, previous));
    } catch {
      setQuotes(DEFAULT_MOTIVATIONAL_QUOTES);
    }
  }, []);

  useEffect(() => {
    refreshQuotes();
  }, [refreshQuotes]);

  const value = useMemo(() => ({
    quote: quotes[currentIndex] || quotes[0] || DEFAULT_MOTIVATIONAL_QUOTES[0],
    quotes,
    rotateQuote,
    refreshQuotes,
  }), [currentIndex, quotes, refreshQuotes, rotateQuote]);

  return <MotivationalQuoteContext.Provider value={value}>{children}</MotivationalQuoteContext.Provider>;
}

export const useMotivationalQuotes = () => {
  const value = useContext(MotivationalQuoteContext);
  if (!value) throw new Error('useMotivationalQuotes must be used inside MotivationalQuoteProvider');
  return value;
};
