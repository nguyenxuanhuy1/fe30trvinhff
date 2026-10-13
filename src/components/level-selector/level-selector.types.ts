import type { ItemSlot } from "@/modules/inventory";

export type LevelDifficulty = 1 | 2 | 3 | 4 | 5;

export type LevelIconType =
  | "flask"
  | "microscope"
  | "hand"
  | "flame"
  | "atom"
  | "crystal";

export interface PlayLevel {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  description: string;
  difficulty: LevelDifficulty;
  difficultyLabel: string;
  iconType: LevelIconType;
  isLocked: boolean;
  lockReason?: string;
  targetPath: string;
  rewards: string[];
  suggestedSlots: ItemSlot[];
  slug?: string | null;
  isPlugin?: boolean;
  roomId?: string | null;
}

export interface LevelSelectorProps {
  onEnterLab?: (level: PlayLevel) => void;
  className?: string;
  initialSelectedId?: string;
  compact?: boolean;
}

export interface LevelSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onEnterLab?: (level: PlayLevel) => void;
}
