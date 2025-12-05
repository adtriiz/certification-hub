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
  proofFileName?: string;
  proofUploadedAt?: string;
  expiresAt?: string;
}

export interface UserCertificationData {
  favorites: string[];
  applications: FundingApplication[];
  completedCertifications: CompletedCertification[];
}
