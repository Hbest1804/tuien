export const MAJOR_STAGES = ['Sơ Kỳ', 'Trung Kỳ', 'Hậu Kỳ', 'Đại Viên Mãn'];
export const STAGES: string[] = MAJOR_STAGES.flatMap(k => Array.from({ length: 9 }, (_, i) => `${k} Tầng ${i + 1}`));

export interface RealmConfig {
  id: number;
  name: string;
  color: string;
  glow: string;
  stages: string[];
  successRate: number;       // Tỷ lệ thành công cơ bản
  tribulationDamage: number; // Sát thương Lôi Kiếp khi đột phá
}

export const REALMS: RealmConfig[] = [
  { id: 0, name: 'Luyện Khí',  color: '#7ed99e', glow: 'rgba(126,217,158,0.4)', stages: STAGES, successRate: 0.9,  tribulationDamage: 0 },
  { id: 1, name: 'Trúc Cơ',   color: '#f2ca50', glow: 'rgba(242,202,80,0.4)',  stages: STAGES, successRate: 0.75, tribulationDamage: 500 },
  { id: 2, name: 'Kim Đan',   color: '#f2ca50', glow: 'rgba(242,202,80,0.5)',  stages: STAGES, successRate: 0.5,  tribulationDamage: 2000 },
  { id: 3, name: 'Nguyên Anh',color: '#b066ff', glow: 'rgba(176,102,255,0.4)', stages: STAGES, successRate: 0.3,  tribulationDamage: 10000 },
  { id: 4, name: 'Hóa Thần',  color: '#b066ff', glow: 'rgba(176,102,255,0.5)', stages: STAGES, successRate: 0.1,  tribulationDamage: 50000 },
];

export const SECONDS_PER_YEAR = 3600;
export const LIFESPAN_DRAIN: number[] = [1, 1, 1, 1, 0];
