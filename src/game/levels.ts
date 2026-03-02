import { Entity, LevelData } from '../types';

const BG_COLORS = {
  1: '#ecfdf5', // Forest
  2: '#1e293b', // Cave
  3: '#450a0a', // Volcano
  4: '#e0f7fa', // Crystal Caverns (light teal glow)
  5: '#dbeafe', // Sky Ruins (pale sky blue)
  6: '#2a0303', // Lava Fortress (dark red)
};

const createPlatform = (id: string, x: number, y: number, width: number, height: number): Entity => ({
  id,
  type: 'platform',
  x,
  y,
  width,
  height,
  color: '#3f3f46',
});

const createHazard = (id: string, x: number, y: number, width: number, height: number, color = '#ef4444'): Entity => ({
  id,
  type: 'hazard',
  x,
  y,
  width,
  height,
  color,
});

const createMonster = (id: string, x: number, y: number, range: number, speed: number): Entity => ({
  id,
  type: 'monster',
  x,
  y,
  width: 30,
  height: 30,
  color: '#a855f7', // Purple monster
  initialX: x,
  initialY: y,
  movementRange: range,
  speed,
  direction: 1,
});

const createMovingPlatform = (id: string, x: number, y: number, width: number, height: number, range: number, speed: number): Entity => ({
  id,
  type: 'moving_platform',
  x,
  y,
  width,
  height,
  color: '#71717a',
  initialX: x,
  initialY: y,
  movementRange: range,
  speed,
  direction: 1,
});

const createExtraLife = (id: string, x: number, y: number): Entity => ({
  id,
  type: 'extra_life',
  x,
  y,
  width: 20,
  height: 20,
  color: '#f43f5e', // Rose color
});

const createCoin = (id: string, x: number, y: number): Entity => ({
  id,
  type: 'coin',
  x,
  y,
  width: 15,
  height: 15,
  color: '#fbbf24', // Amber/Gold
});

export const LEVELS: LevelData[] = [];

// Max jump height is ~120px, max horizontal jump is ~200px
for (let w = 1; w <= 6; w++) {
  for (let l = 1; l <= 5; l++) {
    const entities: Entity[] = [];
    let lastX = 50;
    let lastY = 500;
    
    // Start platform
    entities.push(createPlatform(`start-${w}-${l}`, 0, 550, 150, 50));
    
    // World 1 has a safety floor with few holes
    if (w === 1) {
      const floorSegments = 4;
      for (let s = 0; s < floorSegments; s++) {
        const x = s * 220;
        const width = 180;
        entities.push(createPlatform(`floor-${w}-${l}-${s}`, x, 580, width, 20));
      }
    } else if (w === 2) {
      entities.push(createPlatform(`safety-${w}-${l}`, 0, 595, 800, 5));
    }

    const numPlatforms = 5 + l + (w - 1) * 2;
    for (let i = 0; i < numPlatforms; i++) {
      // Tighter vertical gaps for reachability
      const gapX = 100 + Math.random() * 60 + (l * 4); 
      const gapY = (Math.random() - 0.5) * 120; // Max 60px up or down
      
      let nextX = lastX + gapX;
      let nextY = lastY + gapY;
      
      if (nextY < 180) nextY = 180;
      if (nextY > 500) nextY = 500;
      if (nextX > 700) nextX = 700;

      const width = 100 - (l * 3);
      entities.push(createPlatform(`p-${w}-${l}-${i}`, nextX, nextY, width, 20));
      
      // Add extra lives in the middle of the level (between 2nd and 2nd to last platform)
      if (i >= 1 && i < numPlatforms - 1 && Math.random() > 0.6) {
        entities.push(createExtraLife(`life-${w}-${l}-${i}`, nextX + width/2 - 10, nextY - 30));
      }

      // Add coins with higher probability in later worlds
      let coinChance = 0.3;
      if (w >= 4) coinChance = 0.6 + (w - 4) * 0.1; // 0.6,0.7,0.8 for w4,5,6
      if (Math.random() < coinChance) {
        entities.push(createCoin(`coin-${w}-${l}-${i}`, nextX + width/2 - 7, nextY - 20));
      }

      // Add hazards or monsters - ensure they don't overlap too much
      if (w === 1 && i > 2 && Math.random() > 0.8) {
        entities.push(createHazard(`h-${w}-${l}-${i}`, nextX + 20, nextY - 10, 30, 10));
      } else if (w === 2) {
        if (Math.random() > 0.6) {
          entities.push(createMonster(`m-${w}-${l}-${i}`, nextX, nextY - 35, width, 1 + l * 0.3));
        } else if (Math.random() > 0.8) {
          entities.push(createHazard(`h-${w}-${l}-${i}`, nextX + 10, nextY - 10, width - 20, 10));
        }
        if (Math.random() > 0.85) {
          entities.push(createMovingPlatform(`mp-${w}-${l}-${i}`, nextX + 50, nextY - 80, 80, 15, 80, 2));
        }
      } else if (w === 3) {
        // Volcano: reduce fire hazard frequency and size
        if (Math.random() > 0.5) {
          // Only add fire if there's no monster
          if (Math.random() > 0.5) {
            entities.push(createMonster(`m-${w}-${l}-${i}`, nextX, nextY - 35, width, 1.5 + l * 0.5));
          } else {
            const fireWidth = Math.min(width - 40, 40);
            entities.push(createHazard(`fire-${w}-${l}-${i}`, nextX + (width - fireWidth) / 2, nextY - 15, fireWidth, 15, '#f97316'));
          }
        }
      } else if (w === 4) {
        // Crystal Caverns: more coins and occasional moving crystal walls
        if (Math.random() > 0.7) {
          entities.push(createCoin(`coin-${w}-${l}-${i}-bonus`, nextX + width/2 - 7, nextY - 50));
        }
        if (Math.random() > 0.8) {
          entities.push(createMovingPlatform(`mp-${w}-${l}-${i}`, nextX, nextY - 60, 120, 10, 120, 1.5));
        }
      } else if (w === 5) {
        // Sky Ruins: floating platforms and faster monsters
        if (Math.random() > 0.5) {
          entities.push(createMonster(`m-${w}-${l}-${i}`, nextX, nextY - 35, width, 2 + l * 0.4));
        }
        if (Math.random() > 0.6) {
          entities.push(createMovingPlatform(`mp-${w}-${l}-${i}`, nextX, nextY - 80, 100, 15, 100, 3));
        }
      } else if (w === 6) {
        // Lava Fortress: heavy hazards and fast monsters
        if (Math.random() > 0.4) {
          entities.push(createHazard(`lava-${w}-${l}-${i}`, nextX + 10, nextY - 10, width - 20, 15, '#dc2626'));
        }
        if (Math.random() > 0.6) {
          entities.push(createMonster(`m-${w}-${l}-${i}`, nextX, nextY - 35, width, 2.5 + l * 0.5));
        }
        if (Math.random() > 0.7) {
          entities.push(createMovingPlatform(`mp-${w}-${l}-${i}`, nextX, nextY - 60, 120, 10, 120, 2));
        }
      }

      lastX = nextX;
      lastY = nextY;
      if (lastX >= 650) break;
    }

    // Goal platform
    const goalX = lastX + 50;
    const goalY = lastY - 40;
    entities.push(createPlatform(`goal-plat-${w}-${l}`, goalX - 20, goalY + 40, 100, 20));

    LEVELS.push({
      id: (w - 1) * 5 + l,
      world: w,
      name: `World ${w} - Level ${l}`,
      entities,
      spawnPoint: { x: 50, y: 500 },
      goalPoint: { x: goalX + 10, y: goalY },
      background: BG_COLORS[w as 1|2|3|4|5|6],
      // apply custom palette for newer worlds to make them prettier
      customColors: w === 4 ? { platform: '#38bdf8', monster: '#a855f7', hazard: '#6366f1' }
                    : w === 5 ? { platform: '#7dd3fc', monster: '#4ade80', hazard: '#60a5fa' }
                    : w === 6 ? { platform: '#f87171', monster: '#eab308', hazard: '#f97316' }
                    : undefined,
    });
  }
}
