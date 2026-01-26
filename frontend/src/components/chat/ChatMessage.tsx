import React, { useState, memo, useCallback } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { Message } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatMessageProps {
  message: Message;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { theme } = useTheme();

  // 모달 상태 변화 추적
  React.useEffect(() => {
    console.log('Modal state changed:', showImageModal, 'for message type:', message.type);
  }, [showImageModal, message.type]);

  const getLoadingText = (type: string) => {
    switch (type) {
      case 'image': return '이미지 생성 중...';
      case 'video': return '비디오 생성 중...';
      default: return '생성 중...';
    }
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-6`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>

        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700' : 'bg-white dark:bg-neutral-100 border border-white dark:border-neutral-100'}`}>
          {isUser ? <User size={14} className="text-gray-500 dark:text-neutral-400" /> : <Bot size={14} className="text-gray-900 dark:text-neutral-900" />}
        </div>

        {/* Bubble & Footer Container */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full min-w-0`}>
          <div
            className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed tracking-wide min-w-[60px] ${isUser ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 rounded-tr-none border border-gray-300 dark:border-neutral-700 shadow-sm' : 'bg-transparent text-gray-900 dark:text-white border-none shadow-none pl-0'}`}
          >
            {message.type === 'text' && (
              <div className="font-sans break-words markdown-body">
                {isUser ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 border-b border-neutral-200/20 dark:border-neutral-700/30 pb-1" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-3 py-1 my-2 text-neutral-500 dark:text-neutral-400 italic bg-neutral-50/50 dark:bg-neutral-800/30 rounded-r" {...props} />
                      ),
                      a: ({ node, ...props }) => <a className="text-blue-600 hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline) {
                          return (
                            <div className="rounded-lg overflow-hidden my-3 border border-neutral-200/20 shadow-sm">
                              <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-900 border-b border-neutral-800">
                                <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                                  {match ? match[1] : 'code'}
                                </span>
                              </div>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match ? match[1] : 'javascript'}
                                PreTag="div"
                                customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px', padding: '1rem' }}
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }
                        return (
                          <code className="bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200 rounded px-1.5 py-0.5 text-xs font-mono font-medium" {...props}>
                            {children}
                          </code>
                        );
                      },
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-neutral-100 dark:bg-neutral-800" {...props} />,
                      tbody: ({ node, ...props }) => <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-900" {...props} />,
                      tr: ({ node, ...props }) => <tr className="" {...props} />,
                      th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider" {...props} />,
                      td: ({ node, ...props }) => <td className="px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 whitespace-nowrap" {...props} />,
                      hr: ({ node, ...props }) => <hr className="my-4 border-neutral-200 dark:border-neutral-700" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
                {message.isStreaming && (
                  <div className="inline-flex items-center ml-3">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-neutral-100/80 to-neutral-200/80 dark:from-neutral-800/80 dark:to-neutral-700/80 rounded-full border border-neutral-300/50 dark:border-neutral-600/50 backdrop-blur-sm">
                      <div className="flex space-x-0.5">
                        <div
                          className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                          style={{
                            animation: 'typingDot 1.4s infinite ease-in-out',
                            animationDelay: '0s'
                          }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                          style={{
                            animation: 'typingDot 1.4s infinite ease-in-out',
                            animationDelay: '0.2s'
                          }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                          style={{
                            animation: 'typingDot 1.4s infinite ease-in-out',
                            animationDelay: '0.4s'
                          }}
                        />
                      </div>
                      <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium ml-2">생각 중...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {message.type === 'image' && message.mediaUrl && (
              <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 mt-2 group cursor-pointer" onClick={() => {
                console.log('Image clicked, setting modal to true');
                setShowImageModal(true);
              }}>
                <img src={message.mediaUrl} alt="Generated" className="max-w-full h-auto transition-transform group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    클릭하여 확대
                  </span>
                </div>
              </div>
            )}

            {message.type === 'video' && message.mediaUrl && (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <video controls src={message.mediaUrl} className="max-w-full h-auto" />
                </div>

                {/* Video Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = message.mediaUrl!;
                      link.download = `weav-video-${Date.now()}.mp4`;
                      link.click();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.mediaUrl!);
                      // You could add a toast notification here
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    공유
                  </button>

                  <button
                    onClick={() => {
                      // Add to favorites or save to collection
                      // For now, just show an alert
                      alert('동영상이 저장되었습니다!');
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    저장
                  </button>
                </div>
              </div>
            )}

            {(message.type === 'image' || message.type === 'video') && !message.mediaUrl && (
              <div className="flex flex-col items-start space-y-3 mt-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <div className="absolute inset-1 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">{getLoadingText(message.type)}</span>
                    {message.progress !== undefined && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-500">{message.progress}% 완료</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {message.progress !== undefined && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                      <span>진행률</span>
                      <span>{message.estimatedTime && `약 ${message.estimatedTime} 남음`}</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${message.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Animated dots */}
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                    <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors py-1"
              title="메시지 복사"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
            <span className="text-[10px] text-neutral-600 font-mono">
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

        </div>
      </div>
    </div>
  );

  // Image Modal
  const handleDownload = async () => {
    console.log('Download button clicked, mediaUrl:', message.mediaUrl);
    if (!message.mediaUrl) {
      console.log('No mediaUrl, returning');
      return;
    }

    // CORS 문제로 직접 다운로드가 어려우므로 새 탭에서 열기
    console.log('Opening image in new tab for download');
    window.open(message.mediaUrl, '_blank');

    // 추후 개선: 서버 사이드 프록시를 통한 다운로드 구현 가능
    /*
    try {
      console.log('Starting download process...');
      const response = await fetch(message.mediaUrl);
      console.log('Fetch response:', response);
      const blob = await response.blob();
      console.log('Blob created:', blob);
      const blobUrl = window.URL.createObjectURL(blob);
      console.log('Blob URL created:', blobUrl);

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      const ext = message.type === 'image' ? 'png' : 'mp4';
      a.download = `weav_ai_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      console.log('Clicking download link...');
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      console.log('Download completed');
    } catch (e) {
      console.error("Download failed", e);
      console.log('Falling back to opening in new tab');
      window.open(message.mediaUrl, '_blank');
    }
    */
  };

  return (
    <>
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-6`}>
        <div className={`flex max-w-[90%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>

          {/* Avatar */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700' : 'bg-white dark:bg-neutral-100 border border-white dark:border-neutral-100'}`}>
            {isUser ? <User size={14} className="text-gray-500 dark:text-neutral-400" /> : <Bot size={14} className="text-gray-900 dark:text-neutral-900" />}
          </div>

          {/* Bubble & Footer Container */}
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full min-w-0`}>
            <div
              className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed tracking-wide min-w-[60px] ${isUser ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 rounded-tr-none border border-gray-300 dark:border-neutral-700 shadow-sm' : 'bg-transparent text-gray-900 dark:text-white border-none shadow-none pl-0'}`}
            >
              {message.type === 'text' && (
                <div className="font-sans break-words markdown-body">
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 border-b border-neutral-200/20 dark:border-neutral-700/30 pb-1" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-inherit" {...props} />,
                        blockquote: ({ node, ...props }) => (
                          <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-3 py-1 my-2 text-neutral-500 dark:text-neutral-400 italic bg-neutral-50/50 dark:bg-neutral-800/30 rounded-r" {...props} />
                        ),
                        a: ({ node, ...props }) => <a className="text-blue-600 hover:underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />,
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline) {
                            return (
                              <div className="rounded-lg overflow-hidden my-3 border border-neutral-200/20 shadow-sm">
                                <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-900 border-b border-neutral-800">
                                  <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                                    {match ? match[1] : 'code'}
                                  </span>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match ? match[1] : 'javascript'}
                                  PreTag="div"
                                  customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px', padding: '1rem' }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code className="bg-neutral-200/50 text-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-200 rounded px-1.5 py-0.5 text-xs font-mono font-medium" {...props}>
                              {children}
                            </code>
                          );
                        },
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-neutral-100 dark:bg-neutral-800" {...props} />,
                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-900" {...props} />,
                        tr: ({ node, ...props }) => <tr className="" {...props} />,
                        th: ({ node, ...props }) => <th className="px-3 py-2 text-left text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider" {...props} />,
                        td: ({ node, ...props }) => <td className="px-3 py-2 text-xs text-neutral-700 dark:text-neutral-300 whitespace-nowrap" {...props} />,
                        hr: ({ node, ...props }) => <hr className="my-4 border-neutral-200 dark:border-neutral-700" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                  {message.isStreaming && (
                    <div className="inline-flex items-center ml-3">
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-neutral-100/80 to-neutral-200/80 dark:from-neutral-800/80 dark:to-neutral-700/80 rounded-full border border-neutral-300/50 dark:border-neutral-600/50 backdrop-blur-sm">
                        <div className="flex space-x-0.5">
                          <div
                            className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                            style={{
                              animation: 'typingDot 1.4s infinite ease-in-out',
                              animationDelay: '0s'
                            }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                            style={{
                              animation: 'typingDot 1.4s infinite ease-in-out',
                              animationDelay: '0.2s'
                            }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-neutral-500 dark:bg-neutral-400 rounded-full animate-pulse"
                            style={{
                              animation: 'typingDot 1.4s infinite ease-in-out',
                              animationDelay: '0.4s'
                            }}
                          />
                        </div>
                        <span className="text-xs text-neutral-600 dark:text-neutral-300 font-medium ml-2">생각 중...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {message.type === 'image' && message.mediaUrl && (
                <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 mt-2 group cursor-pointer" onClick={() => setShowImageModal(true)}>
                  <img src={message.mediaUrl} alt="Generated" className="max-w-full h-auto transition-transform group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                      클릭하여 확대
                    </span>
                  </div>
                </div>
              )}

              {message.type === 'video' && message.mediaUrl && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <video controls src={message.mediaUrl} className="max-w-full h-auto" />
                  </div>

                  {/* Video Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = message.mediaUrl!;
                        link.download = `weav-video-${Date.now()}.mp4`;
                        link.click();
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      다운로드
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(message.mediaUrl!);
                        // You could add a toast notification here
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      공유
                    </button>

                    <button
                      onClick={() => {
                        // Add to favorites or save to collection
                        // For now, just show an alert
                        alert('동영상이 저장되었습니다!');
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      저장
                    </button>
                  </div>
                </div>
              )}

              {(message.type === 'image' || message.type === 'video') && !message.mediaUrl && (
                <div className="flex flex-col items-start space-y-3 mt-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <div className="absolute inset-1 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">{getLoadingText(message.type)}</span>
                      {message.progress !== undefined && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-500">{message.progress}% 완료</span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {message.progress !== undefined && (
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mb-1">
                        <span>진행률</span>
                        <span>{message.estimatedTime && `약 ${message.estimatedTime} 남음`}</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${message.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Animated dots */}
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                      <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-pulse" style={{ animationDelay: '800ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors py-1"
                title="메시지 복사"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                <span>{copied ? '복사됨' : '복사'}</span>
              </button>
              <span className="text-[10px] text-neutral-600 font-mono">
                {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        </div>

      {/* Image Modal */}
      {showImageModal && message.type === 'image' && message.mediaUrl && (() => {
        console.log('RENDERING MODAL for image:', message.mediaUrl);
        return true;
      })() && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {/* Image Display */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black w-full">
              <img src={message.mediaUrl} alt="Generated" className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain" />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md sm:max-w-none">
              {/* Date info */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-mono px-3 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md sm:pr-4 sm:border-r sm:border-white/10 sm:mr-4">
                <span className="hidden sm:inline">{new Date(message.timestamp).toLocaleString()}</span>
                <span className="sm:hidden">{new Date(message.timestamp).toLocaleDateString()}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Download Image</span>
                  <span className="sm:hidden">Download</span>
                </button>

                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2.5 hover:bg-white/10 rounded-lg text-white transition-colors border border-white/10 hover:border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && message.type === 'image' && message.mediaUrl && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {/* Image Display */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black w-full">
              <img src={message.mediaUrl} alt="Generated" className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain" />
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md sm:max-w-none">
              {/* Date info */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-mono px-3 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md sm:pr-4 sm:border-r sm:border-white/10 sm:mr-4">
                <span className="hidden sm:inline">{new Date(message.timestamp).toLocaleString()}</span>
                <span className="sm:hidden">{new Date(message.timestamp).toLocaleDateString()}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Download Image</span>
                  <span className="sm:hidden">Download</span>
                </button>

                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2.5 hover:bg-white/10 rounded-lg text-white transition-colors border border-white/10 hover:border-white/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const ChatMessage = memo(ChatMessageComponent);