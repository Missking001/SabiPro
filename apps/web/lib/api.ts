import type {
  ProviderSummary,
  ProviderProfile,
  MyProviderProfile,
  Inquiry,
  Notification,
  ContentFlag,
  Transaction,
  ApiResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Get the access token from NextAuth session.
 * The Navbar component syncs the token from the NextAuth session
 * into sessionStorage so client-side API calls can use it.
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('sabipro_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiClientError(
      'Unable to connect to the server. Make sure the backend is running and try again.',
      'NETWORK_ERROR',
    );
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiClientError(
      'Invalid response from server. Please try again later.',
      'PARSE_ERROR',
    );
  }

  if (!res.ok) {
    throw new ApiClientError(
      json.error?.message || 'Something went wrong. Please try again later',
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.field,
    );
  }

  return json;
}

export class ApiClientError extends Error {
  code: string;
  field?: string;

  constructor(message: string, code: string, field?: string) {
    super(message);
    this.code = code;
    this.field = field;
  }
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; role?: string; phone?: string; city?: string }) =>
      request<{ user: { id: string; name: string; email: string }; message: string }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify(data) },
      ),
    me: () => request<{ id: string; name: string; email: string; role: string }>('/api/auth/me'),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),
    resendVerification: (email: string) =>
      request<{ message: string }>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  providers: {
    search: (params?: Record<string, string | number | undefined>) => {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== '') searchParams.set(key, String(value));
        });
      }
      const qs = searchParams.toString();
      return request<ProviderSummary[]>(`/api/providers${qs ? `?${qs}` : ''}`);
    },
    findBySlug: (slug: string) => request<ProviderProfile>(`/api/providers/${slug}`),
    me: () => request<MyProviderProfile | null>('/api/providers/me'),
    create: (data: { bio?: string; tradeCategory: string; location: string; priceRange?: string }) =>
      request<{ id: string; slug: string }>('/api/providers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      bio?: string;
      tradeCategory?: string;
      location?: string;
      priceRange?: string;
      isAvailable?: boolean;
    }) =>
      request<MyProviderProfile>(`/api/providers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  reviews: {
    create: (data: { providerId: string; rating: number; comment?: string }) =>
      request<{ id: string }>('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getProviderReviews: (providerId: string) =>
      request<{ id: string; rating: number; comment?: string; createdAt: string }[]>(
        `/api/reviews/provider/${providerId}`,
      ),
    flag: (reviewId: string, reason?: string) =>
      request<{ message: string }>(`/api/reviews/${reviewId}/flag`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },

  inquiries: {
    list: () => request<Inquiry[]>('/api/inquiries'),
    create: (data: { providerId: string; message: string }) =>
      request<Inquiry>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<{ id: string; status: string }>(`/api/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  notifications: {
    list: () => request<Notification[]>('/api/notifications'),
    markRead: (id: string) =>
      request<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () =>
      request<{ message: string }>('/api/notifications/read-all', { method: 'PATCH' }),
  },

  admin: {
    dashboard: () =>
      request<{
        totalUsers: number;
        activeProviders: number;
        totalInquiries: number;
        totalTransactions: number;
        platformRevenue: number;
        pendingVetting: number;
        pendingFlags: number;
      }>('/api/admin/dashboard'),
    flags: () => request<ContentFlag[]>('/api/admin/flags'),
    resolveFlag: (id: string, action: 'REMOVE' | 'DISMISS') =>
      request<{ message: string }>(`/api/admin/flags/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    providers: (params?: { page?: number }) => {
      const qs = params?.page ? `?page=${params.page}` : '';
      return request<ProviderSummary[]>(`/api/providers${qs}`);
    },
    users: () => request<{ id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string }[]>('/api/admin/users'),
    suspendUser: (id: string) =>
      request<{ message: string }>(`/api/admin/users/${id}/suspend`, { method: 'PATCH' }),
    approveVetting: (id: string, badgeType: string) =>
      request<{ id: string }>(`/api/admin/vetting/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ badgeType }),
      }),
    revokeBadge: (id: string) =>
      request<{ message: string }>(`/api/admin/vetting/${id}/revoke`, { method: 'POST' }),
    transactions: () => request<Transaction[]>('/api/admin/transactions'),
  },

  payments: {
    initiate: (data: { providerId: string; inquiryId?: string; amount: number }) =>
      request<{ paymentUrl: string }>('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getConsumerHistory: () => request<Transaction[]>('/api/payments/consumer/history'),
    getProviderHistory: () => request<Transaction[]>('/api/payments/provider/history'),
    getSingle: (id: string) => request<Transaction>(`/api/payments/${id}`),
    releasePayout: (id: string) =>
      request<{ message: string }>(`/api/payments/${id}/release`, { method: 'POST' }),
    dispute: (id: string) =>
      request<{ message: string }>(`/api/payments/${id}/dispute`, { method: 'POST' }),
  },

  payouts: {
    submitDetails: (data: { bankCode: string; accountNumber: string }) =>
      request<{ message: string }>('/api/payouts/provider-details', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
