export type AccessoryConfig = {
  type: 'hat' | 'glasses' | 'mask' | 'mascot';
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  hairLift?: number;
  ext?: string;
};

export const ACCESSORIES: Record<string, AccessoryConfig> = {
  hat_circle: { type: 'hat', scale: 1.6, offsetX: 0, hairLift: 0.12 },
  hat_cap: { type: 'hat', scale: 1.5, offsetX: 0, hairLift: 0.12 },
  glasses_aviator: { type: 'glasses', scale: 1.6, offsetX: 0, offsetY: 0 },
  glasses_square: { type: 'glasses', scale: 1.6, offsetX: 0, offsetY: 0 },
  mask_01: { type: 'mask', scaleX: 1.05, scaleY: 1.2, offsetX: 0, offsetY: 0 },
  mask_matla: { type: 'mask', scaleX: 1.05, scaleY: 1.2, offsetX: 0, offsetY: 0, ext: 'png' },
  glasses_kinh: { type: 'glasses', scale: 1.6, offsetX: 0, offsetY: 0, ext: 'png' },
  'chuotuser-hole': { type: 'mascot', ext: 'png' },
  'chuotuser': { type: 'mascot', ext: 'png' },
};
