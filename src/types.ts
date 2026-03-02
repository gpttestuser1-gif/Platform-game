export enum GameState {
  MENU = 'MENU',
  TUTORIAL_PROMPT = 'TUTORIAL_PROMPT',
  TUTORIAL = 'TUTORIAL',
  PLAYING = 'PLAYING',
  WORLD_SELECT = 'WORLD_SELECT',
  LEVEL_SELECT = 'LEVEL_SELECT',
  GAME_OVER = 'GAME_OVER',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  GAME_COMPLETE = 'GAME_COMPLETE',
  SHOP = 'SHOP',
  EDITOR = 'EDITOR',
  ACCOUNT_SELECT = 'ACCOUNT_SELECT'
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity extends Rect {
  id: string;
  type: 'player' | 'platform' | 'hazard' | 'goal' | 'collectible' | 'moving_platform' | 'monster' | 'extra_life' | 'coin';
  color?: string;
  vx?: number;
  vy?: number;
  movementRange?: number;
  speed?: number;
  direction?: 1 | -1;
  initialX?: number;
  initialY?: number;
  isDead?: boolean;
  pathStart?: Point;
  pathEnd?: Point;
}

export interface User {
  id: string;
  name: string;
  unlockedLevels: number[];
  unlockedWorlds: number[]; // new: which worlds have been purchased/unlocked
  totalCoins: number;
  ownedItems: string[];
  maxLives: number;
  tutorialEnabled: boolean;
  tutorialSeen: string[];
  customWorldName?: string;
}

export interface LevelData {
  id: number;
  world: number;
  name: string;
  entities: Entity[];
  spawnPoint: Point;
  goalPoint: Point;
  background: string;
  customColors?: {
    platform?: string;
    monster?: string;
    hazard?: string;
    coin?: string;
    extra_life?: string;
    goal?: string;
    background?: string;
  };
  creator?: string;
  creatorId?: string;
  lastEditorId?: string;
  lastEditorName?: string;
  isShared?: boolean;
}

export interface GameSettings {
  showTutorial: boolean;
  currentWorld: number;
  currentLevel: number;
  unlockedLevels: number[];
  speedMultiplier: number;
  coins: number;
  maxStartingLives: number;
  ownedEditorItems: string[]; // 'platform', 'monster', 'hazard', 'coin', 'background'
}
