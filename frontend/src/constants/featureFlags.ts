const envFlag = (key: string, defaultValue: boolean): boolean => {
  const raw = import.meta.env[key];
  if (raw === undefined) return defaultValue;
  return raw === 'true';
};

export const FEATURE_FLAGS = {
  // 개발 편의를 위한 임시 플래그 (필요 시 .env에서 false로 전환)
  bypassMembership: envFlag('VITE_BYPASS_MEMBERSHIP', true),
  hideBillingUI: envFlag('VITE_HIDE_BILLING_UI', true),
};
