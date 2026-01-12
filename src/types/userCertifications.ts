export interface FundingApplication {
  id: string;
  certificationId: string;
  certificationName: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
  reason: string;
  estimatedCost: number;
}

export interface CompletedCertification {
  id: string;
  certificationId: string;
  certificationName: string;
  completedAt: string;
  credentialUrl?: string;
  provider?: string;
  isExternal: boolean;
  expiresAt?: string;
}

export interface CertificationSuggestion {
  id: string;
  userId: string;
  certificationName: string;
  provider?: string;
  reason: string;
  url?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  profiles?: { email: string };
}

export interface UserCompletedCertifications {
  userId: string;
  userEmail: string;
  completedCount: number;
  certifications: CompletedCertification[];
}

export interface UserCertificationData {
  favorites: string[];
  applications: FundingApplication[];
  completedCertifications: CompletedCertification[];
}
