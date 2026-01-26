import React, { useState, useMemo } from 'react';
import { X, Download, Play, Image as ImageIcon, Film, Filter, Calendar } from 'lucide-react';
import { useChatContext } from '../../contexts/ChatContext';

interface MediaGalleryModalProps {
    onClose: () => void;
}

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({ onClose }) => {
    const { messages } = useChatContext();
    const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
    const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: 'image' | 'video', date: number } | null>(null);

    // Filter messages to get only media
    const mediaItems = useMemo(() => {
        return messages.filter(m =>
            (m.type === 'image' || m.type === 'video') &&
            m.mediaUrl &&
            m.role === 'model' // Only AI generated content
        ).sort((a, b) => b.timestamp - a.timestamp); // Newest first
    }, [messages]);

    const filteredItems = useMemo(() => {
        if (filter === 'all') return mediaItems;
        return mediaItems.filter(m => m.type === filter);
    }, [mediaItems, filter]);

    const handleDownload = async (url: string, type: 'image' | 'video') => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            const ext = type === 'image' ? 'png' : 'mp4';
            a.download = `weav_ai_${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
        } catch (e) {
            console.error("Download failed", e);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#111] border border-white/10 rounded-2xl md:rounded-3xl w-full max-w-5xl h-full md:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">

                {/* Header - 반응형 개선 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-white/5 bg-[#111] z-10 gap-4 sm:gap-0">
                    {/* 모바일: 타이틀과 닫기 버튼을 같은 줄에 */}
                    <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                        <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3">
                            <span className="bg-gradient-to-br from-indigo-500 to-purple-500 text-transparent bg-clip-text">Media Gallery</span>
                            <span className="text-xs sm:text-sm font-normal text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                {mediaItems.length}
                            </span>
                        </h2>

                        {/* 모바일에서 닫기 버튼을 타이틀과 같은 줄에 */}
                        <button
                            onClick={onClose}
                            className="sm:hidden p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Filters - 반응형 크기 조정 */}
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                            {(['all', 'image', 'video'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-neutral-500 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {f === 'all' ? 'All' : f === 'image' ? 'Img' : 'Vid'}
                                </button>
                            ))}
                        </div>

                        {/* 데스크톱에서만 닫기 버튼 표시 */}
                        <button
                            onClick={onClose}
                            className="hidden sm:flex p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Grid Content - 반응형 그리드 개선 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-8">
                    {filteredItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-500 gap-4 py-12">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <Film size={24} sm:w-8 sm:h-8 className="opacity-20" />
                            </div>
                            <div className="text-center px-4">
                                <p className="text-sm sm:text-base mb-2">No media generated yet.</p>
                                <p className="text-xs text-neutral-600">Create your first image or video to see it here!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative aspect-square bg-neutral-900 rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                                    onClick={() => setSelectedMedia({ url: item.mediaUrl!, type: item.type as 'image' | 'video', date: item.timestamp })}
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.mediaUrl} alt="Generated" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <video src={item.mediaUrl} className="w-full h-full object-cover" />
                                    )}

                                    {/* Overlay - 터치 친화적으로 개선 */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 sm:gap-3 backdrop-blur-[2px]">
                                        <span className="p-2 sm:p-3 bg-white/10 rounded-full backdrop-blur-md text-white border border-white/20">
                                            {item.type === 'video' ? <Play size={20} sm:w-6 sm:h-6 fill="white" /> : <ImageIcon size={20} sm:w-6 sm:h-6 />}
                                        </span>
                                        <span className="text-xs font-medium text-white/80 hidden sm:inline">View Details</span>
                                    </div>

                                    {/* Type Badge - 모바일에서 더 작게 */}
                                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/60 backdrop-blur rounded text-[9px] sm:text-[10px] font-bold text-white uppercase border border-white/10">
                                        {item.type === 'video' ? 'VID' : 'IMG'}
                                    </div>

                                    {/* Date - 모바일에서 숨김 */}
                                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-[9px] sm:text-[10px] text-neutral-300 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur border border-white/5 hidden sm:block">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal Overlay - 반응형 개선 */}
            {selectedMedia && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in" onClick={() => setSelectedMedia(null)}>
                    <div className="relative max-w-6xl w-full max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>

                        {/* Media Display - 반응형 크기 조정 */}
                        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black w-full">
                            {selectedMedia.type === 'image' ? (
                                <img src={selectedMedia.url} alt="Preview" className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain" />
                            ) : (
                                <video src={selectedMedia.url} controls autoPlay className="w-full h-auto max-h-[70vh] sm:max-h-[80vh]" />
                            )}
                        </div>

                        {/* Controls - 반응형 레이아웃 */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md sm:max-w-none">
                            {/* 날짜 정보 - 모바일에서 위쪽에 */}
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 font-mono px-3 py-2 bg-black/50 border border-white/10 rounded-lg backdrop-blur-md sm:pr-4 sm:border-r sm:border-white/10 sm:mr-4">
                                <Calendar size={12} sm:w-4 sm:h-4 />
                                <span className="hidden sm:inline">{new Date(selectedMedia.date).toLocaleString()}</span>
                                <span className="sm:hidden">{new Date(selectedMedia.date).toLocaleDateString()}</span>
                            </div>

                            {/* 버튼들 */}
                            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <button
                                    onClick={() => handleDownload(selectedMedia.url, selectedMedia.type)}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors"
                                >
                                    <Download size={16} />
                                    <span className="hidden sm:inline">Download {selectedMedia.type === 'video' ? 'Video' : 'Image'}</span>
                                    <span className="sm:hidden">Download</span>
                                </button>

                                <button
                                    onClick={() => setSelectedMedia(null)}
                                    className="p-2.5 hover:bg-white/10 rounded-lg text-white transition-colors border border-white/10 hover:border-white/20"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
