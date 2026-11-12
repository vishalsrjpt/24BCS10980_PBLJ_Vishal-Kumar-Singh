export type Role = 'STUDENT' | 'ADMIN' | 'SUPERADMIN';

export type ReportType = 'LOST' | 'FOUND';

export type ItemCategory =
  | 'Electronics'
  | 'Documents and ID Cards'
  | 'Bags'
  | 'Wallets and Money'
  | 'Books and Stationery'
  | 'Keys'
  | 'Clothing'
  | 'Accessories'
  | 'Other';

export type ReportStatus =
  | 'OPEN'
  | 'CLAIM_PENDING'
  | 'DISPUTED'
  | 'RECOVERED'
  | 'REJECTED'
  | 'EXPIRED';

export type ClaimStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'DISPUTED';

export type NotificationType =
  | 'MATCH_FOUND'
  | 'CLAIM_SUBMITTED'
  | 'CLAIM_APPROVED'
  | 'CLAIM_REJECTED'
  | 'CLAIM_INFO_REQUESTED'
  | 'DISPUTE_UPDATE'
  | 'ITEM_RECOVERED'
  | 'SYSTEM';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string;
  studentId?: string;
  department?: string;
  active: boolean;
  createdAt: string;
}

export interface ItemImage {
  id: number;
  fileName: string;
  url: string;
  contentType?: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface ItemReport {
  id: number;
  title: string;
  description: string;
  reportType: ReportType;
  category: ItemCategory;
  color?: string;
  brand?: string;
  location: string;
  eventDate: string;
  status: ReportStatus;
  reporterName: string;
  reporterId: number;
  identifyingDetails?: string;
  additionalNotes?: string;
  recoveredAt?: string;
  recoveredByClaimId?: number;
  images: ItemImage[];
  createdAt: string;
  updatedAt: string;
  canClaim: boolean;
  hasClaimed: boolean;
  claimsCount: number;
}

export interface Claim {
  id: number;
  itemReportId: number;
  itemTitle: string;
  itemCategory: ItemCategory;
  itemLocation: string;
  itemReportType: ReportType;
  itemPrimaryImageUrl?: string;
  claimantId: number;
  claimantName: string;
  claimantEmail?: string;
  claimantPhone?: string;
  claimantStudentId?: string;
  explanation: string;
  identifyingDetails: string;
  purchaseDetails?: string;
  status: ClaimStatus;
  adminNotes?: string;
  reviewerId?: number;
  reviewerName?: string;
  images: ItemImage[];
  submittedAt: string;
  reviewedAt?: string;
  dispute: boolean;
  totalClaimsOnItem: number;
}

export interface ItemMatch {
  id: number;
  lostReportId: number;
  lostTitle: string;
  lostCategory: ItemCategory;
  lostLocation: string;
  lostImageUrl?: string;
  lostReporterId: number;
  foundReportId: number;
  foundTitle: string;
  foundCategory: ItemCategory;
  foundLocation: string;
  foundImageUrl?: string;
  foundReporterId: number;
  similarityScore: number;
  matchReason: string;
  matchLevel: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: number;
  read: boolean;
  createdAt: string;
}

export interface AdminAuditLog {
  id: number;
  adminId: number;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PlatformStatistics {
  totalStudents: number;
  totalAdmins: number;
  totalLostReports: number;
  totalFoundReports: number;
  totalReports: number;
  openReports: number;
  pendingClaims: number;
  recoveredItems: number;
  disputedClaims: number;
  recoveryRate: number;
  categoryDistribution: Record<string, number>;
  monthlyReports: Record<string, number>;
  monthlyRecoveries: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
