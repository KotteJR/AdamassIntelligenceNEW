// Ultra-cheap project image chooser using Unsplash Source (no API key)

export interface ProjectImage {
  imageUrl: string;
  alt: string;
  fallbackUrl: string;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function detectCategory(nameRaw: string): { query: string; alt: string } {
  const name = (nameRaw || '').toLowerCase();
  const rules: Array<{ test: (n: string) => boolean; query: string; alt: string }> = [
    { test: (n) => /ai|ml|tech|software|cloud|data|saas|platform|cyber|devops/.test(n), query: 'technology, abstract, modern office, code on screen', alt: 'Technology' },
    { test: (n) => /bank|finance|fintech|capital|fund|asset|invest|insurance|credit/.test(n), query: 'finance, skyline, corporate building, trading floor', alt: 'Finance' },
    { test: (n) => /health|med|clinic|pharma|bio|care|hospital/.test(n), query: 'healthcare, lab, clean, biotechnology', alt: 'Healthcare' },
    { test: (n) => /energy|oil|gas|solar|power|utility|industrial|manufactur/.test(n), query: 'energy industry, turbines, power plant, industrial', alt: 'Energy' },
    { test: (n) => /media|creative|studio|marketing|advertis|content|design/.test(n), query: 'creative studio, gradient backdrop, neon light', alt: 'Creative' },
    { test: (n) => /logistics|supply|shipping|warehouse|courier|transport/.test(n), query: 'logistics, shipping containers, warehouse', alt: 'Logistics' },
    { test: (n) => /retail|fashion|store|brand|ecommerce/.test(n), query: 'retail storefront, fashion, display', alt: 'Retail' },
  ];

  const match = rules.find((r) => r.test(name));
  return match || { query: 'modern minimal texture, abstract background', alt: 'Business' };
}

export function getProjectImage(companyName: string, jobId: string): ProjectImage {
  const { query, alt } = detectCategory(companyName || 'Company');
  const seed = simpleHash((companyName || '') + (jobId || '')) % 1000;
  // Use fast local pattern images for guaranteed loading
  const local = `/features/pattern-${(seed % 4) + 1}.svg`;
  const imageUrl = local;
  const fallbackUrl = local;
  return { imageUrl, fallbackUrl, alt: `${alt} image for ${companyName}` };
}

