import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const BillingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUserInfo } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        if (refreshUserInfo) await refreshUserInfo();
        toast.success('멤버십이 활성화되었습니다.');
      } catch (e) {
        console.error('refreshUserInfo:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [refreshUserInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">구독을 활성화하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          결제 완료!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          멤버십이 활성화되었습니다. 이제 모든 프리미엄 기능을 사용할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          시작하기
        </button>
      </div>
    </div>
  );
};
