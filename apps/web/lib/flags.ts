export const featureFlags = {
  FEATURE_VETTING_BADGES: true,
  FEATURE_INQUIRY_SYSTEM: true,
  FEATURE_NOTIFICATIONS: true,
  FEATURE_EMAIL_VERIFICATION: true,
  FEATURE_CONTENT_MODERATION: true,
  FEATURE_PROVIDER_ONBOARDING: true,
  FEATURE_PAYMENT_SYSTEM: true,
  FEATURE_ADMIN_PANEL: true,
};

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag];
}
