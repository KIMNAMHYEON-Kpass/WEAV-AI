import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const LoginView: React.FC = () => {
    const { signIn, user } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async () => {
        try {
            await signIn();
            toast.success('로그인 성공!', { description: 'Google 계정으로 로그인되었습니다.' });
            navigate('/');
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error?.message || '로그인 중 오류가 발생했습니다.';
            toast.error('로그인 실패', { description: errorMessage });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        WEAV-AI
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        프로젝트를 시작하려면 로그인이 필요합니다.
                    </p>
                </div>

                <button
                    onClick={handleLogin}
                    type="button"
                    className="group relative flex w-full justify-center rounded-lg bg-black dark:bg-white px-3 py-3 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all"
                >
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        {/* Google G icon */}
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                        </svg>
                    </span>
                    Google 계정으로 계속하기
                </button>
            </div>
        </div>
    );
};
