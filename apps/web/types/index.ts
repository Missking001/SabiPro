// Canonical TypeScript types for SabiPro — mirrors apps/api/prisma/schema.prisma

export type Role = 'CONSUMER' | 'PROVIDER' | 'ADMIN';
export type OnboardingState = 'REGISTERED' | 'PROFILE_COMPLETE' | 'ACTIVE' | 'VERIFIED';
export type InquiryStatus = 'PENDING' | 'SEEN' | 'RESPONDED' | 'CLOSED';
export type TxStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REFUNDED' | 'DISPUTED';
export type PayoutStatus = 'PENDING' | 'RELEASED' | 'WITHHELD';
export type NotificationType =
  | 'INQUIRY_RECEIVED'
  | 'INQUIRY_REPLIED'
  | 'REVIEW_POSTED'
  | 'BADGE_ISSUED'
  | 'BADGE_REVOKED'
  | 'ACCOUNT_SUSPENDED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PAYOUT_RELEASED'
  | 'DISPUTE_RAISED'
  | 'DISPUTE_RESOLVED'
  | 'REFUND_ISSUED'
  | 'PAYOUT_WITHHELD';
export type FlagStatus = 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'REMOVED';
export type BadgeType = 'IDENTITY' | 'CREDENTIAL' | 'BOTH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface VettingBadge {
  badgeType: BadgeType;
  isActive: boolean;
}

export interface ProviderSummary {
  id: string;
  slug: string;
  tradeCategory: string;
  location: string;
  bio?: string | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  isAvailable: boolean;
  onboardingState: OnboardingState;
  user: { name: string; avatarUrl?: string | null };
  vettingBadge?: VettingBadge | null;
  documentUrls?: string[];
}

export interface ReviewSummary {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  consumer: { name: string; avatarUrl?: string | null };
}

export interface ProviderProfile extends ProviderSummary {
  portfolioUrls: string[];
  documentUrls: string[];
  createdAt: string;
  reviews: ReviewSummary[];
}

export interface MyProviderProfile extends ProviderProfile {
  user: { name: string; avatarUrl?: string | null; email: string };
}

export interface Inquiry {
  id: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
  consumer?: { id: string; name: string; avatarUrl?: string | null };
  provider?: {
    id: string;
    slug: string;
    tradeCategory: string;
    location: string;
    user: { name: string; avatarUrl?: string | null };
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  relatedId?: string | null;
  relatedType?: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  consumerId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: TxStatus;
  gatewayRef: string;
  createdAt: string;
  payoutStatus?: PayoutStatus;
  consumer?: { name: string };
  provider?: {
    tradeCategory: string;
    slug: string;
    user: { name: string; avatarUrl?: string | null };
  };
}

export interface ContentFlag {
  id: string;
  reportedBy: string;
  targetId: string;
  targetType: 'REVIEW' | 'INQUIRY';
  reason?: string | null;
  status: FlagStatus;
  createdAt: string;
  reporter?: { name: string; email: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; field?: string };
  meta?: { page: number; pageSize: number; total: number; totalPages: number };
}
