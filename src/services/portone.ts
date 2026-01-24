/**
 * PortOne 브라우저 SDK 래퍼
 * storeId / channelKey는 .env (VITE_PORTONE_*) 에서 로드
 */

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: {
        storeId: string;
        channelKey: string;
        paymentId: string;
        orderName: string;
        totalAmount: number;
        currency?: string;
        payMethod?: string;
      }) => Promise<{ code?: string; message?: string }>;
    };
  }
}

export interface RequestPaymentParams {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency?: string;
  payMethod?: string;
}

function getPortOne(): typeof window.PortOne {
  if (typeof window === 'undefined') return undefined as any;
  return window.PortOne;
}

export function ensurePortOne(): Promise<typeof window.PortOne> {
  const PortOne = getPortOne();
  if (PortOne) return Promise.resolve(PortOne);
  return new Promise((resolve) => {
    const tick = () => {
      const P = getPortOne();
      if (P) {
        resolve(P);
        return;
      }
      setTimeout(tick, 50);
    };
    tick();
  });
}

export async function requestPayment(params: RequestPaymentParams): Promise<void> {
  const PortOne = await ensurePortOne();
  if (!PortOne?.requestPayment) {
    throw new Error('PortOne 결제창을 불러올 수 없습니다.');
  }
  const result = await PortOne.requestPayment({
    storeId: params.storeId,
    channelKey: params.channelKey,
    paymentId: params.paymentId,
    orderName: params.orderName,
    totalAmount: params.totalAmount,
    currency: params.currency ?? 'KRW',
    payMethod: params.payMethod ?? 'CARD',
  });
  if (result?.code && result.code !== 'PAYMENT_SUCCESS' && result.code !== 'PAYMENT_IN_PROGRESS') {
    throw new Error(result.message || '결제에 실패했습니다.');
  }
}
