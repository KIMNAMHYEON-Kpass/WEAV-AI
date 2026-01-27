const envFlag = (key: string, defaultValue: boolean): boolean => {
  const raw = import.meta.env[key];
  if (raw === undefined) return defaultValue;
  return raw === 'true';
};

export const FEATURE_FLAGS = {
  // 기본값은 "결제/멤버십 비활성화". 필요하면 .env에서 명시적으로 활성화.
  bypassMembership: envFlag('VITE_BYPASS_MEMBERSHIP', !envFlag('VITE_ENFORCE_MEMBERSHIP', false)),
  hideBillingUI: envFlag('VITE_HIDE_BILLING_UI', !envFlag('VITE_ENABLE_BILLING', false)),
  enforceMembership: envFlag('VITE_ENFORCE_MEMBERSHIP', false),
};
