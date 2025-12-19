export interface Certification {
  id: string;
  certificationName: string;
  domain: string;
  languageFramework: string[];
  url: string;
  provider: string[];
  price: number;
  currency: string;
  experienceLevel: string;
  certificateQuality: string;
  lastChecked: string;
  notes: string;
  priceInEUR: number;
}

export const mockCertifications: Certification[] = [];

// Helper functions to get unique filter values
export const getUniqueDomains = (certs: Certification[]) =>
  [...new Set(certs.map(c => c.domain).filter(Boolean))].sort();

export const getUniqueLanguages = (certs: Certification[]) =>
  [...new Set(certs.flatMap(c => c.languageFramework).filter(Boolean))].sort();

export const getUniqueProviders = (certs: Certification[]) =>
  [...new Set(certs.flatMap(c => c.provider).filter(Boolean))].sort();

export const getUniqueExperienceLevels = (certs: Certification[]) => {
  const levelOrder = ["entry-level", "intermediate", "advanced", "expert"];
  return [...new Set(certs.map(c => c.experienceLevel).filter(Boolean))].sort((a, b) => {
    const indexA = levelOrder.indexOf(a.toLowerCase());
    const indexB = levelOrder.indexOf(b.toLowerCase());
    // Put known levels in order, unknowns at the end
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
};

export const getUniqueQualities = (certs: Certification[]) =>
  [...new Set(certs.map(c => c.certificateQuality).filter(Boolean))].sort();
