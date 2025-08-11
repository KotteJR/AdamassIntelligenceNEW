// Generate beautiful background images for analysis cards

export interface CardBackground {
  gradient: string; // kept for potential future; not used visually now
  pattern?: string;
  overlay?: string;
}

// Color palettes for different industries/themes
const gradientPalettes = [
  // Tech/Innovation
  ['from-blue-500', 'via-purple-500', 'to-pink-500'],
  ['from-cyan-400', 'via-blue-500', 'to-indigo-600'],
  ['from-violet-500', 'via-purple-500', 'to-blue-500'],
  
  // Finance/Professional
  ['from-slate-600', 'via-gray-700', 'to-slate-800'],
  ['from-emerald-500', 'via-teal-500', 'to-cyan-600'],
  ['from-indigo-500', 'via-blue-600', 'to-cyan-500'],
  
  // Energy/Industrial
  ['from-orange-500', 'via-red-500', 'to-pink-500'],
  ['from-yellow-400', 'via-orange-500', 'to-red-500'],
  ['from-amber-400', 'via-yellow-500', 'to-orange-500'],
  
  // Healthcare/Life Sciences
  ['from-green-400', 'via-emerald-500', 'to-teal-600'],
  ['from-teal-400', 'via-cyan-500', 'to-blue-500'],
  ['from-lime-400', 'via-green-500', 'to-emerald-600'],
  
  // Creative/Media
  ['from-pink-500', 'via-rose-500', 'to-red-500'],
  ['from-purple-500', 'via-pink-500', 'to-rose-500'],
  ['from-fuchsia-500', 'via-purple-500', 'to-violet-500'],
  
  // Neutral/Professional
  ['from-slate-500', 'via-zinc-600', 'to-neutral-700'],
  ['from-gray-500', 'via-slate-600', 'to-zinc-700'],
];

// Geometric patterns for visual interest
const patterns = [
  // Dots
  'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
  'radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 1px, transparent 1px)',
  
  // Grid
  'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
  
  // Diagonal lines
  'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
  'repeating-linear-gradient(-45deg, transparent, transparent 15px, rgba(255,255,255,0.03) 15px, rgba(255,255,255,0.03) 30px)',
  
  // Organic shapes
  'radial-gradient(ellipse at top left, rgba(255,255,255,0.1), transparent 50%)',
  'radial-gradient(ellipse at bottom right, rgba(255,255,255,0.08), transparent 60%)',
];

// Hash function for consistent color selection
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Detect industry/category from company name for smarter color selection
function detectCategory(companyName: string): number {
  const name = companyName.toLowerCase();
  
  // Tech/Software
  if (name.includes('tech') || name.includes('software') || name.includes('ai') || 
      name.includes('digital') || name.includes('app') || name.includes('cloud') ||
      name.includes('data') || name.includes('cyber')) {
    return 0; // Tech colors (0-2)
  }
  
  // Finance/Banking
  if (name.includes('bank') || name.includes('finance') || name.includes('capital') ||
      name.includes('invest') || name.includes('fund') || name.includes('insurance') ||
      name.includes('credit') || name.includes('loan')) {
    return 3; // Finance colors (3-5)
  }
  
  // Energy/Industrial
  if (name.includes('energy') || name.includes('oil') || name.includes('gas') ||
      name.includes('power') || name.includes('electric') || name.includes('solar') ||
      name.includes('industrial') || name.includes('manufacturing')) {
    return 6; // Energy colors (6-8)
  }
  
  // Healthcare/Pharma
  if (name.includes('health') || name.includes('medical') || name.includes('pharma') ||
      name.includes('bio') || name.includes('care') || name.includes('hospital') ||
      name.includes('clinic') || name.includes('drug')) {
    return 9; // Healthcare colors (9-11)
  }
  
  // Media/Creative
  if (name.includes('media') || name.includes('creative') || name.includes('design') ||
      name.includes('marketing') || name.includes('advertising') || name.includes('content') ||
      name.includes('entertainment') || name.includes('studio')) {
    return 12; // Creative colors (12-14)
  }
  
  // Default to neutral/professional
  return 15; // Neutral colors (15-16)
}

export function generateCardBackground(companyName: string, jobId: string): CardBackground {
  const hash = simpleHash(companyName + jobId);
  const categoryStart = detectCategory(companyName);
  
  // Select gradient from appropriate category (with some variation)
  const paletteIndex = categoryStart + (hash % 3);
  const gradient = gradientPalettes[Math.min(paletteIndex, gradientPalettes.length - 1)];
  
  // Add pattern for visual interest (30% chance)
  const pattern = (hash % 10) < 3 ? patterns[hash % patterns.length] : undefined;
  
  // Create the background style
  const backgroundGradient = `bg-gradient-to-br ${gradient.join(' ')}`;
  return {
    gradient: backgroundGradient,
    pattern,
    overlay: 'bg-black/10',
  };
}

// Get background styles as CSS properties for dynamic backgrounds
export function getBackgroundStyle(background: CardBackground): React.CSSProperties {
  const style: React.CSSProperties = {};
  
  if (background.pattern) {
    style.backgroundImage = background.pattern;
    style.backgroundSize = '20px 20px';
  }
  
  return style;
}

// Generate a contrasting text color based on background
export function getTextColor(background: CardBackground): string {
  // Most of our gradients are dark enough for white text
  return 'text-white';
}

// Get a subtle badge color that complements the background
export function getBadgeStyle(background: CardBackground): string {
  return 'bg-white/20 text-white border border-white/30';
}

// Note: image handling moved to cardImages.ts