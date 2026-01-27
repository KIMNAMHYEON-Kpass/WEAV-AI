import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPlans, preparePayment, completePayment, Plan } from '@/services/api/billingService';
import { requestPayment } from '@/services/payments/portone';
import { toast } from 'sonner';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

const STORE_ID = import.meta.env.VITE_PORTONE_STORE_ID ?? '';
const CHANNEL_KEY = import.meta.env.VITE_PORTONE_CHANNEL_KEY ?? '';

export const PricingPage: React.FC = () => {
  const { user, refreshUserInfo } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (FEATURE_FLAGS.hideBillingUI) {
      setLoading(false);
      return;
    }
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (error) {
      console.error('플랜 로드 실패:', error);
      toast.error('가격 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (FEATURE_FLAGS.hideBillingUI) {
      toast.info('결제 기능이 비활성화되어 있습니다.');
      return;
    }
    if (!user) {
      toast.error('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!STORE_ID || !CHANNEL_KEY) {
      toast.error('결제 설정이 없습니다. (VITE_PORTONE_STORE_ID, VITE_PORTONE_CHANNEL_KEY)');
      return;
    }

    setProcessing(plan.id);

    try {
      const prep = await preparePayment(plan.id as 'standard' | 'premium');
      await requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEY,
        paymentId: prep.paymentId,
        orderName: prep.orderName,
        totalAmount: prep.totalAmount,
        currency: prep.currency,
        payMethod: prep.payMethod,
      });

      const complete = await completePayment(prep.paymentId);
      if (complete.ok) {
        if (refreshUserInfo) await refreshUserInfo();
        toast.success('결제가 완료되었습니다.');
        navigate('/billing/success');
      } else {
        toast.error(complete.message || '결제 완료 처리에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('구독 시작 실패:', error);
      toast.error(error?.message || '결제를 시작하는데 실패했습니다.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (FEATURE_FLAGS.hideBillingUI) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            결제/멤버십 기능 준비중
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            현재는 결제 기능이 비활성화되어 있습니다.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            멤버십 선택
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            30일권을 선택하고 AI의 모든 기능을 활용하세요
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 relative"
            >
              {plan.id === 'premium' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    인기
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                {plan.id === 'standard' ? (
                  <Zap className="w-8 h-8 text-blue-500" />
                ) : (
                  <Sparkles className="w-8 h-8 text-purple-500" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h2>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.amount.toLocaleString()}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    원 / 30일
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={processing === plan.id}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.id === 'premium'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </span>
                ) : (
                  '결제하기'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← 홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
