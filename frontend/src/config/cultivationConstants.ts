export const MAJOR_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
export const STAGES: string[] = MAJOR_STAGES.flatMap(k => Array.from({ length: 9 }, (_, i) => `${k} Tầng ${i + 1}`));

export interface RealmConfig {
  id: number;
  name: string;
  color: string;
  glow: string;
  stages: string[];
}

export const REALMS: RealmConfig[] = [
  { id: 0, name: 'Luyện Khí',  color: '#7ed99e', glow: 'rgba(126,217,158,0.4)', stages: STAGES },
  { id: 1, name: 'Trúc Cơ',   color: '#f2ca50', glow: 'rgba(242,202,80,0.4)',  stages: STAGES },
  { id: 2, name: 'Kim Đan',   color: '#f2ca50', glow: 'rgba(242,202,80,0.5)',  stages: STAGES },
  { id: 3, name: 'Nguyên Anh',color: '#b066ff', glow: 'rgba(176,102,255,0.4)', stages: STAGES },
  { id: 4, name: 'Hóa Thần',  color: '#b066ff', glow: 'rgba(176,102,255,0.5)', stages: STAGES },
];

export const SECONDS_PER_YEAR = 3600;
export const LIFESPAN_DRAIN: number[] = [1, 1, 1, 1, 0];
