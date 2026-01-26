export const MODEL_CONFIGS = {
    sora: {
        id: 'sora',
        name: 'Sora',
        styles: [
            { id: 'realistic', name: '실사화 (Photorealistic)', desc: '현실과 구분이 어려운 초고해상도 실사 스타일', previewImage: '/assets/styles/sora-realistic.jpg' },
            { id: 'cinematic', name: '시네마틱 (Cinematic)', desc: '할리우드 영화 같은 조명과 색감', previewImage: '/assets/styles/sora-cinematic.jpg' },
            { id: '3d-animation', name: '3D 애니메이션', desc: '픽사/디즈니 스타일의 고품질 3D 렌더링', previewImage: '/assets/styles/sora-3d.jpg' },
            { id: 'anime', name: '애니메이션 (Anime)', desc: '일본 애니메이션 작화 스타일', previewImage: '/assets/styles/sora-anime.jpg' },
            { id: 'fantasy', name: '판타지 (Fantasy)', desc: '몽환적이고 초현실적인 분위기', previewImage: '/assets/styles/sora-fantasy.jpg' },
        ],
        durations: ['4s', '8s', '12s'], // Max 12s for Sora 2
        resolutions: ['720p', '1080p'], // 1080p enabled in UI (mapped to supported size in backend)
        aspectRatios: ['16:9', '9:16', '1:1', '2.35:1', '4:3', '3:4'],
        maxDuration: 12
    }
} as const;
