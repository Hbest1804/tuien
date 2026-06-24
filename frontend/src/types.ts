export type TabType = 'home' | 'map' | 'roots' | 'pavilion' | 'cultivation';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  quality: 'heaven' | 'mystic' | 'mortal';
  type: 'artifact' | 'book' | 'herb' | 'gem';
  icon: string;
}

export interface CharacterAttribute {
  name: string;
  value: number;
  max: number;
  color: string;
}
