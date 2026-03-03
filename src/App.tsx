import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { GameState, Entity, LevelData, Point, User } from './types';
import { LEVELS } from './game/levels';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Play, BookOpen, ChevronRight, RotateCcw, Home, Trophy, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ShoppingBag, Edit3, Save, Trash2, Coins } from 'lucide-react';

const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3.5;
const FRICTION = 0.8;
const PLAYER_SIZE = 30;

const SHOP_ITEMS = [
  { id: 'life', name: 'Extra Starting Life', cost: 50, description: 'Increase max starting lives' },
  { id: 'platform', name: 'Editor: Platforms', cost: 100, description: 'Unlock platforms for editor' },
  { id: 'monster', name: 'Editor: Monsters', cost: 200, description: 'Unlock monsters for editor' },
  { id: 'hazard', name: 'Editor: Hazards', cost: 150, description: 'Unlock hazards for editor' },
  { id: 'coin', name: 'Editor: Coins', cost: 80, description: 'Unlock coins for editor' },
  { id: 'extra_life', name: 'Editor: Extra Lives', cost: 150, description: 'Unlock extra lives for editor' },
  { id: 'background', name: 'Editor: Backgrounds', cost: 120, description: 'Unlock backgrounds for editor' },
  { id: 'colors', name: 'Editor: Color Customizer', cost: 250, description: 'Unlock custom colors for editor' },
];

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.ACCOUNT_SELECT);

  // world information used in the selector
  const WORLD_INFO: { [w: number]: { title: string; description: string; cost?: number } } = {
    1: { title: 'WORLD 1', description: 'A gentle introduction with simple platforms.' },
    2: { title: 'WORLD 2', description: 'A darker cave filled with surprises.' },
    3: { title: 'WORLD 3', description: 'Volcanic challenges await with rising heat.' },
    4: { title: 'CRYSTAL CAVERNS', description: 'Sparkling crystals and glowing scenery – medium challenge, more coins!', cost: 120 },
    5: { title: 'SKY RUINS', description: 'Beautiful skies and floating ruins – harder with better rewards.', cost: 200 },
    6: { title: 'LAVA FORTRESS', description: 'Striking fiery visuals and danger – hardest, highest coins.', cost: 300 },
  };

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('triworld_users');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Player 1', unlockedLevels: [1], unlockedWorlds: [1,2,3], totalCoins: 0, ownedItems: [], maxLives: 6, tutorialEnabled: true, tutorialSeen: [] }
    ];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [tutorialEnabled, setTutorialEnabled] = useState(true);
  const [tutorialSeen, setTutorialSeen] = useState<string[]>([]);
  const [unlockedWorlds, setUnlockedWorlds] = useState<number[]>([]);
  
  // ... existing states continue ...
  const [tutorialMessage, setTutorialMessage] = useState<string | null>(null);
  const [tutorialInfo, setTutorialInfo] = useState<{ title: string, content: string, icon: React.ReactNode } | null>(null);
  const [tutorialQueue, setTutorialQueue] = useState<{ title: string, content: string, icon: React.ReactNode }[]>([]);
  const [customWorldName, setCustomWorldName] = useState('My World');
  const [nameInput, setNameInput] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Entity>({
    id: 'player',
    type: 'player',
    x: 50,
    y: 500,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    vx: 0,
    vy: 0,
    color: '#3b82f6'
  });
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [lives, setLives] = useState(6);
  const [maxLives, setMaxLives] = useState(6);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [isJumping, setIsJumping] = useState(false);
  const [movingPlatforms, setMovingPlatforms] = useState<Entity[]>([]);
  const [monsters, setMonsters] = useState<Entity[]>([]);
  const [extraLives, setExtraLives] = useState<Entity[]>([]);
  const [coins, setCoins] = useState<Entity[]>([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [invincibilityFrames, setInvincibilityFrames] = useState(0);

  // Sync state with currentUser
  useEffect(() => {
    if (currentUser) {
      setUnlockedLevels(currentUser.unlockedLevels);
      setUnlockedWorlds(currentUser.unlockedWorlds || [1,2,3]);
      setTotalCoins(currentUser.totalCoins);
      setMaxLives(currentUser.maxLives);
      setOwnedItems(currentUser.ownedItems);
      setLives(currentUser.maxLives);
      setTutorialEnabled(currentUser.tutorialEnabled);
      setTutorialSeen(currentUser.tutorialSeen);
      setCustomWorldName(currentUser.customWorldName || 'My World');
    }
  }, [currentUser]);

  // Update users array when state changes and persist
  useEffect(() => {
    if (currentUser) {
      const updatedUsers = users.map(u => u.id === currentUser.id ? {
        ...u,
        unlockedLevels,
        unlockedWorlds,
        totalCoins,
        maxLives,
        ownedItems,
        tutorialEnabled,
        tutorialSeen,
        customWorldName
      } : u);
      setUsers(updatedUsers);
      localStorage.setItem('triworld_users', JSON.stringify(updatedUsers));
    }
  }, [unlockedLevels, unlockedWorlds, totalCoins, maxLives, ownedItems, tutorialEnabled, tutorialSeen, customWorldName]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('triworld_users', JSON.stringify(users));
    }
  }, [users, currentUser]);

  const [customLevels, setCustomLevels] = useState<LevelData[]>(() => {
    const saved = localStorage.getItem('triworld_custom_levels');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('triworld_custom_levels', JSON.stringify(customLevels));
  }, [customLevels]);

  // Tutorial Logic
  useEffect(() => {
    if (tutorialEnabled) {
      const level = allLevels[currentLevelIndex] || LEVELS[0];
      if (!level) return;
      
      const newTutorials: { title: string, content: string, icon: React.ReactNode }[] = [];

      // Check for new elements
      if (currentLevelIndex === 0 && !tutorialSeen.includes('movement')) {
        newTutorials.push({
          title: "WELCOME EXPLORER!",
          content: "Use A/D or Arrow Keys to move left and right. Press W or Up Arrow to jump. Reach the yellow block to finish! Your journey begins here!",
          icon: <div className="flex space-x-2"><div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center font-bold">A</div><div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center font-bold">D</div></div>
        });
        setTutorialSeen(prev => [...prev, 'movement']);
      } else if (currentLevelIndex === 0 && !tutorialSeen.includes('goal') && player.x > 300) {
        newTutorials.push({
          title: "THE GOAL",
          content: "Reach the golden square to complete the level and unlock the next challenge!",
          icon: <Trophy className="text-amber-400" size={48} />
        });
        setTutorialSeen(prev => [...prev, 'goal']);
      } else if (coins.some(c => !c.isDead) && !tutorialSeen.includes('coins')) {
        newTutorials.push({
          title: "COLLECTIBLES",
          content: "Collect golden coins to spend in the shop! You can buy new editor items and upgrades.",
          icon: <Coins className="text-amber-400" size={48} />
        });
        setTutorialSeen(prev => [...prev, 'coins']);
      } else if (extraLives.some(l => !l.isDead) && !tutorialSeen.includes('lives')) {
        newTutorials.push({
          title: "EXTRA LIVES",
          content: "These glowing hearts give you an extra chance! Keep an eye out for them in tough spots.",
          icon: <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-2xl font-bold">+</div>
        });
        setTutorialSeen(prev => [...prev, 'lives']);
      } else if (monsters.some(m => !m.isDead) && !tutorialSeen.includes('monsters')) {
        newTutorials.push({
          title: "MONSTERS",
          content: "Watch out! Touching them from the side will hurt you. Jump on their heads to defeat them!",
          icon: <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full mx-1" /><div className="w-2 h-2 bg-white rounded-full mx-1" /></div>
        });
        setTutorialSeen(prev => [...prev, 'monsters']);
      } else if (level.entities.some(e => e.type === 'hazard') && !tutorialSeen.includes('hazards')) {
        newTutorials.push({
          title: "HAZARDS",
          content: "Red zones are extremely dangerous! Touching them will instantly cost you a life.",
          icon: <div className="w-12 h-4 bg-red-500 rounded" />
        });
        setTutorialSeen(prev => [...prev, 'hazards']);
      }

      if (newTutorials.length > 0) {
        setTutorialQueue(prev => [...prev, ...newTutorials]);
      }
    }
  }, [currentLevelIndex, player.x, coins, extraLives, monsters, tutorialEnabled, tutorialSeen]);

  // Show tutorial modals only when NOT playing or at start of level
  useEffect(() => {
    if (tutorialQueue.length > 0 && !tutorialInfo) {
      // If we are playing, wait until level ends or we are at the very beginning
      if (gameState === GameState.PLAYING) {
        // Only show if player hasn't moved much yet (start of level)
        if (player.x < 100 && player.y > 450) {
          setTutorialInfo(tutorialQueue[0]);
          setTutorialQueue(prev => prev.slice(1));
        }
      } else if (gameState === GameState.MENU || gameState === GameState.WORLD_SELECT || gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER) {
        setTutorialInfo(tutorialQueue[0]);
        setTutorialQueue(prev => prev.slice(1));
      }
    }
  }, [tutorialQueue, tutorialInfo, gameState, player.x, player.y]);
  
  // Editor state
  const [editorEntities, setEditorEntities] = useState<Entity[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('platform');
  const [editorBg, setEditorBg] = useState('#ecfdf5');
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [editorGoalPoint, setEditorGoalPoint] = useState<Point>({ x: 700, y: 100 });
  const [editorColors, setEditorColors] = useState({
    platform: '#3f3f46',
    monster: '#a855f7',
    hazard: '#ef4444',
    coin: '#fbbf24',
    extra_life: '#10b981',
    goal: '#fbbf24',
    background: '#ecfdf5'
  });
  const [editorMode, setEditorMode] = useState<'select' | 'edit'>('select');
  const [unreachableEntities, setUnreachableEntities] = useState<string[]>([]);

  const checkReachability = (entities: Entity[], goal: Point) => {
    const platforms = entities.filter(e => e.type === 'platform');
    if (platforms.length === 0) return [];

    const spawnPlatform = platforms.find(p => p.id === 'spawn-platform') || platforms[0];
    const reachable = new Set<string>();
    const queue = [spawnPlatform];
    reachable.add(spawnPlatform.id);

    // First find all reachable platforms
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const target of platforms) {
        if (reachable.has(target.id)) continue;

        const dx = Math.abs(current.x - target.x);
        const dy = current.y - target.y; 

        const horizontalOk = dx <= 180;
        const verticalOk = (dy >= -400 && dy <= 130);

        if (horizontalOk && verticalOk) {
          reachable.add(target.id);
          queue.push(target);
        }
      }
    }

    // Now check if other entities are near reachable platforms
    const unreachable = platforms.filter(p => !reachable.has(p.id)).map(p => p.id);
    
    // Check goal
    let goalReachable = false;
    for (const p of platforms) {
      if (!reachable.has(p.id)) continue;
      const dx = Math.abs(p.x - goal.x);
      const dy = p.y - goal.y;
      if (dx <= 180 && dy >= -400 && dy <= 130) {
        goalReachable = true;
        break;
      }
    }
    if (!goalReachable) unreachable.push('goal');

    // Check other entities
    entities.forEach(e => {
      if (e.type === 'platform') return;
      let eReachable = false;
      for (const p of platforms) {
        if (!reachable.has(p.id)) continue;
        const dx = Math.abs(p.x - e.x);
        const dy = p.y - e.y;
        if (dx <= 180 && dy >= -400 && dy <= 130) {
          eReachable = true;
          break;
        }
      }
      if (!eReachable) unreachable.push(e.id);
    });

    return unreachable;
  };

  useEffect(() => {
    if (gameState === GameState.EDITOR && editorMode === 'edit') {
      const unreachable = checkReachability(editorEntities, editorGoalPoint);
      setUnreachableEntities(unreachable);
    }
  }, [editorEntities, editorGoalPoint, gameState, editorMode]);

  const [editorIsShared, setEditorIsShared] = useState(false);
  const [editorLevelName, setEditorLevelName] = useState('');

  const startNewLevel = () => {
    setEditingLevelId(null);
    setEditorEntities([
      {
        id: 'spawn-platform',
        type: 'platform',
        x: 0,
        y: 550,
        width: 150,
        height: 50,
        color: '#3f3f46'
      }
    ]);
    setEditorGoalPoint({ x: 700, y: 100 });
    setEditorBg('#ecfdf5');
    setEditorColors({
      platform: '#3f3f46',
      monster: '#a855f7',
      hazard: '#ef4444',
      coin: '#fbbf24',
      extra_life: '#10b981',
      goal: '#fbbf24',
      background: '#ecfdf5'
    });
    setEditorLevelName(`Custom Level ${customLevels.length + 1}`);
    setEditorIsShared(false);
    setEditorMode('edit');
  };

  const editLevel = (lvl: LevelData) => {
    // Check if player can edit
    const canEdit = lvl.isShared || lvl.creatorId === currentUser?.id;
    if (!canEdit) {
      alert("You don't have permission to edit this level!");
      return;
    }

    setEditingLevelId(lvl.id);
    setEditorEntities(lvl.entities);
    setEditorGoalPoint(lvl.goalPoint);
    setEditorBg(lvl.background);
    if (lvl.customColors) {
      setEditorColors({ ...editorColors, ...lvl.customColors });
    } else {
      setEditorColors({
        platform: '#3f3f46',
        monster: '#a855f7',
        hazard: '#ef4444',
        coin: '#fbbf24',
        extra_life: '#10b981',
        goal: '#fbbf24',
        background: lvl.background
      });
    }
    setEditorLevelName(lvl.name);
    setEditorIsShared(lvl.isShared || false);
    setEditorMode('edit');
  };

  const requestRef = useRef<number>(null);
  const allLevels = [...LEVELS, ...customLevels];
  const level = allLevels[currentLevelIndex] || LEVELS[0] || { id: 0, world: 1, name: 'Default', entities: [], background: '#000', spawnPoint: {x:0, y:0}, goalPoint: {x:0, y:0} };

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize level
  useEffect(() => {
    if (gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) {
      const currentLevel = allLevels[currentLevelIndex] || LEVELS[0];
      if (!currentLevel) return;
      
      setPlayer(prev => ({
        ...prev,
        x: currentLevel.spawnPoint.x,
        y: currentLevel.spawnPoint.y,
        vx: 0,
        vy: 0
      }));
      setMovingPlatforms(currentLevel.entities.filter(e => e.type === 'moving_platform').map(e => ({...e})));
      setMonsters(currentLevel.entities.filter(e => e.type === 'monster').map(e => ({...e})));
      setExtraLives(currentLevel.entities.filter(e => e.type === 'extra_life').map(e => ({...e})));
      setCoins(currentLevel.entities.filter(e => e.type === 'coin').map(e => ({...e})));
      setLives(maxLives);
    }
  }, [currentLevelIndex, gameState]);

  const handleDeath = (resetPosition = false) => {
    if (invincibilityFrames > 0) return;

    setLives(prev => {
      if (prev > 1) {
        setInvincibilityFrames(90); // ~1.5 seconds at 60fps
        if (resetPosition) {
          setPlayer(p => ({
            ...p,
            x: level.spawnPoint.x,
            y: level.spawnPoint.y,
            vx: 0,
            vy: 0
          }));
          if (tutorialEnabled && !tutorialSeen.includes('holes')) {
            setTutorialQueue(prevQueue => [...prevQueue, {
              title: "WATCH YOUR STEP!",
              content: "Falling into the abyss will cost you a life! Be careful near the edges of platforms.",
              icon: <ArrowDown className="text-red-500 animate-bounce" size={48} />
            }]);
            setTutorialSeen(prevSeen => [...prevSeen, 'holes']);
          }
        }
        return prev - 1;
      } else {
        // Deduct coins on Game Over
        const deduction = Math.min(totalCoins, 10);
        setTotalCoins(c => c - deduction);
        setGameState(GameState.GAME_OVER);
        return 0;
      }
    });
  };

  const update = () => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.TUTORIAL) return;

    setPlayer(prev => {
      let nextVx = prev.vx || 0;
      let nextVy = prev.vy || 0;

      // Movement
      const currentMoveSpeed = MOVE_SPEED * speedMultiplier;
      if (keys['a'] || keys['arrowleft']) nextVx = -currentMoveSpeed;
      else if (keys['d'] || keys['arrowright']) nextVx = currentMoveSpeed;
      else nextVx *= FRICTION;

      // Jump
      if ((keys['w'] || keys['arrowup'] || keys[' ']) && !isJumping) {
        nextVy = JUMP_FORCE;
        setIsJumping(true);
      }

      // Gravity
      nextVy += GRAVITY;

      if (invincibilityFrames > 0) {
        setInvincibilityFrames(prev => prev - 1);
      }

      let nextX = prev.x + nextVx;
      let nextY = prev.y + nextVy;

      // Collision detection
      let grounded = false;
      const currentLevel = allLevels[currentLevelIndex] || LEVELS[0];
      if (!currentLevel) return;
      
      // Combine static platforms and moving platforms for collision
      const allPlatforms = [
        ...currentLevel.entities.filter(e => e.type === 'platform'),
        ...movingPlatforms
      ];

      for (const plat of allPlatforms) {
        // Simple AABB collision
        if (
          nextX < plat.x + plat.width &&
          nextX + prev.width > plat.x &&
          nextY < plat.y + plat.height &&
          nextY + prev.height > plat.y
        ) {
          // Check collision side
          const prevBottom = prev.y + prev.height;
          const platTop = plat.y;
          
          if (prevBottom <= platTop && nextY + prev.height >= platTop) {
            // Landing on top
            nextY = platTop - prev.height;
            nextVy = 0;
            grounded = true;
            
            // If it's a moving platform, move with it
            if (plat.type === 'moving_platform') {
               nextX += (plat.vx || 0);
            }
          } else if (prev.y >= plat.y + plat.height && nextY <= plat.y + plat.height) {
            // Hitting bottom
            nextY = plat.y + plat.height;
            nextVy = 0;
          } else if (prev.x + prev.width <= plat.x && nextX + prev.width >= plat.x) {
            // Hitting left
            nextX = plat.x - prev.width;
            nextVx = 0;
          } else if (prev.x >= plat.x + plat.width && nextX <= plat.x + plat.width) {
            // Hitting right
            nextX = plat.x + plat.width;
            nextVx = 0;
          }
        }
      }

      // Hazard collision
      for (const hazard of currentLevel.entities.filter(e => e.type === 'hazard')) {
        if (
          nextX < hazard.x + hazard.width &&
          nextX + prev.width > hazard.x &&
          nextY < hazard.y + hazard.height &&
          nextY + prev.height > hazard.y
        ) {
          handleDeath(false);
          // Don't return prev, allow player to move through or bounce back?
          // For now, just let them be invincible and stay there
        }
      }

      // Monster collision
      for (const monster of monsters) {
        if (monster.isDead) continue;
        if (
          nextX < monster.x + monster.width &&
          nextX + prev.width > monster.x &&
          nextY < monster.y + monster.height &&
          nextY + prev.height > monster.y
        ) {
          // Check if stomping
          const prevBottom = prev.y + prev.height;
          const monsterTop = monster.y;
          if (prevBottom <= monsterTop + 10 && nextVy > 0) {
            // Kill monster
            setMonsters(ms => ms.map(m => m.id === monster.id ? { ...m, isDead: true } : m));
            nextVy = JUMP_FORCE * 0.8; // Small bounce
            grounded = true;
            setTotalCoins(c => c + 5); // Monster kill bonus
          } else {
            handleDeath(false);
          }
        }
      }

      // Extra life collision
      for (const life of extraLives) {
        if (life.isDead) continue;
        if (
          nextX < life.x + life.width &&
          nextX + prev.width > life.x &&
          nextY < life.y + life.height &&
          nextY + prev.height > life.y
        ) {
          if (lives >= 6) {
            setTotalCoins(c => c + 2); // Life overfill bonus
          } else {
            setLives(l => Math.min(l + 1, maxLives));
          }
          setExtraLives(ls => ls.map(l => l.id === life.id ? { ...l, isDead: true } : l));
        }
      }

      // Coin collision
      for (const coin of coins) {
        if (coin.isDead) continue;
        if (
          nextX < coin.x + coin.width &&
          nextX + prev.width > coin.x &&
          nextY < coin.y + coin.height &&
          nextY + prev.height > coin.y
        ) {
          setTotalCoins(c => c + 1);
          setCoins(cs => cs.map(c => c.id === coin.id ? { ...c, isDead: true } : c));
        }
      }

      // Goal check
      const goal = currentLevel.goalPoint;
      const goalSize = 40;
      if (
        nextX < goal.x + goalSize &&
        nextX + prev.width > goal.x &&
        nextY < goal.y + goalSize &&
        nextY + prev.height > goal.y
      ) {
        handleLevelComplete();
      }

      // Boundary checks
      if (nextX < 0) nextX = 0;
      if (nextX > 800 - prev.width) nextX = 800 - prev.width;
      if (nextY > 600) {
        handleDeath(true); // Reset position on fall
        return { ...prev, x: currentLevel.spawnPoint.x, y: currentLevel.spawnPoint.y, vx: 0, vy: 0 };
      }

      setIsJumping(!grounded);
      return { ...prev, x: nextX, y: nextY, vx: nextVx, vy: nextVy };
    });

    // Update moving platforms
    setMovingPlatforms(prev => prev.map(plat => {
      let nextX = plat.x + (plat.speed || 0) * (plat.direction || 1);
      let nextDir = plat.direction || 1;
      
      if (Math.abs(nextX - (plat.initialX || 0)) > (plat.movementRange || 0)) {
        nextDir *= -1;
      }
      
      return {
        ...plat,
        x: nextX,
        direction: nextDir as 1 | -1,
        vx: (plat.speed || 0) * nextDir
      };
    }));

    // Update monsters
    setMonsters(prev => prev.map(monster => {
      if (monster.isDead) return monster;
      
      if (monster.pathStart && monster.pathEnd) {
        const target = monster.direction === 1 ? monster.pathEnd : monster.pathStart;
        const dx = target.x - monster.x;
        const dy = target.y - monster.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < (monster.speed || 2)) {
          return { ...monster, direction: monster.direction === 1 ? -1 : 1 };
        }
        
        const vx = (dx / dist) * (monster.speed || 2);
        const vy = (dy / dist) * (monster.speed || 2);
        
        return { ...monster, x: monster.x + vx, y: monster.y + vy };
      }

      let nextX = monster.x + (monster.speed || 0) * (monster.direction || 1);
      let nextDir = monster.direction || 1;
      
      if (Math.abs(nextX - (monster.initialX || 0)) > (monster.movementRange || 0)) {
        nextDir *= -1;
      }
      
      return {
        ...monster,
        x: nextX,
        direction: nextDir as 1 | -1
      };
    }));

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, keys, currentLevelIndex, movingPlatforms, monsters, speedMultiplier, invincibilityFrames]);

  const handleLevelComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    // Bonus coins for finishing with 6+ lives
    if (lives >= 6) {
      setTotalCoins(c => c + 5);
    }

    // detect custom levels by seeing if the id falls outside the
    // original LEVELS array (customs are appended after).
    const isCustom = level.id > LEVELS.length;

    if (isCustom) {
      setGameState(GameState.WORLD_SELECT);
      return;
    }

    // handle unlocking the next level, but only if its world is unlocked
    const nextLevel = allLevels.find(l => l.id === level.id + 1);
    if (nextLevel) {
      const world = nextLevel.world;
      const canUnlockWorld = world <= 3 || unlockedWorlds.includes(world);
      if (canUnlockWorld && !unlockedLevels.includes(nextLevel.id)) {
        setUnlockedLevels(prev => [...prev, nextLevel.id]);
      }
    }

    if (currentLevelIndex === allLevels.length - 1 && !isCustom) {
      setGameState(GameState.GAME_COMPLETE);
    } else if ((currentLevelIndex + 1) % 5 === 0 && !isCustom) {
      // World complete
      setGameState(GameState.WORLD_SELECT);
    } else {
      setGameState(GameState.LEVEL_COMPLETE);
    }
  };

  const startLevel = (index: number) => {
    setCurrentLevelIndex(index);
    setGameState(GameState.PLAYING);
  };

  const renderAccountSelect = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8 overflow-y-auto">
      <h2 className="text-4xl font-black mb-12 text-emerald-400">WHO IS PLAYING?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {users.map(user => (
          <div key={user.id} className="relative group">
            {editingUserId === user.id ? (
              <div className="w-full bg-slate-800 p-6 rounded-2xl border-2 border-emerald-500 flex flex-col space-y-4">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (nameInput.trim()) {
                        const updatedUsers = users.map(u => u.id === user.id ? { ...u, name: nameInput.trim() } : u);
                        setUsers(updatedUsers);
                        setEditingUserId(null);
                        if (currentUser?.id === user.id) {
                          setCurrentUser(prev => prev ? { ...prev, name: nameInput.trim() } : null);
                        }
                      }
                    } else if (e.key === 'Escape') {
                      setEditingUserId(null);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter name..."
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={() => {
                      const trimmedName = nameInput.trim();
                      if (!trimmedName) {
                        alert("Name cannot be blank!");
                        return;
                      }
                      if (users.some(u => u.id !== user.id && u.name.toLowerCase() === trimmedName.toLowerCase())) {
                        alert("This name is already taken!");
                        return;
                      }
                      const updatedUsers = users.map(u => u.id === user.id ? { ...u, name: trimmedName } : u);
                      setUsers(updatedUsers);
                      setEditingUserId(null);
                      if (currentUser?.id === user.id) {
                        setCurrentUser(prev => prev ? { ...prev, name: trimmedName } : null);
                      }
                    }}
                    className="flex-1 bg-emerald-500 py-2 rounded-lg font-bold text-sm"
                  >
                    SAVE
                  </button>
                  <button 
                    onClick={() => setEditingUserId(null)}
                    className="flex-1 bg-slate-700 py-2 rounded-lg font-bold text-sm"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentUser(user);
                    setGameState(GameState.MENU);
                  }}
                  className="w-full bg-slate-800 p-8 rounded-2xl border-2 border-slate-700 hover:border-emerald-500 hover:bg-slate-700 transition-all flex flex-col items-center space-y-4"
                >
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-2xl font-black text-emerald-500 group-hover:scale-110 transition-all">
                    {user.name[0]}
                  </div>
                  <span className="font-bold text-xl truncate w-full text-center">{user.name}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingUserId(user.id);
                    setNameInput(user.name);
                  }}
                  className="absolute top-2 right-2 p-2 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 hover:bg-emerald-500 transition-all z-10"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingUserId(user.id);
                  }}
                  className="absolute top-2 left-2 p-2 bg-slate-700 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all z-10"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        
        {isCreatingAccount ? (
          <div className="bg-slate-800 p-6 rounded-2xl border-2 border-emerald-500 flex flex-col space-y-4">
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmedName = nameInput.trim();
                  if (!trimmedName) {
                    alert("Name cannot be blank!");
                    return;
                  }
                  if (users.some(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
                    alert("This name is already taken!");
                    return;
                  }
                  const newUser: User = {
                    id: Date.now().toString(),
                    name: trimmedName,
                    unlockedLevels: [1],
                    unlockedWorlds: [1,2,3],
                    totalCoins: 0,
                    ownedItems: [],
                    maxLives: 6,
                    tutorialEnabled: true,
                    tutorialSeen: []
                  };
                  setUsers(prev => [...prev, newUser]);
                  setIsCreatingAccount(false);
                  setNameInput('');
                } else if (e.key === 'Escape') {
                  setIsCreatingAccount(false);
                  setNameInput('');
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="New player name..."
            />
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  const trimmedName = nameInput.trim();
                  if (!trimmedName) {
                    alert("Name cannot be blank!");
                    return;
                  }
                  if (users.some(u => u.name.toLowerCase() === trimmedName.toLowerCase())) {
                    alert("This name is already taken!");
                    return;
                  }
                  const newUser: User = {
                    id: Date.now().toString(),
                    name: trimmedName,
                    unlockedLevels: [1],
                    unlockedWorlds: [1,2,3],
                    totalCoins: 0,
                    ownedItems: [],
                    maxLives: 6,
                    tutorialEnabled: true,
                    tutorialSeen: []
                  };
                  setUsers(prev => [...prev, newUser]);
                  setIsCreatingAccount(false);
                  setNameInput('');
                }}
                className="flex-1 bg-emerald-500 py-2 rounded-lg font-bold text-sm"
              >
                CREATE
              </button>
              <button 
                onClick={() => {
                  setIsCreatingAccount(false);
                  setNameInput('');
                }}
                className="flex-1 bg-slate-700 py-2 rounded-lg font-bold text-sm"
              >
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsCreatingAccount(true);
              setNameInput('');
            }}
            className="bg-slate-800/50 p-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 hover:bg-slate-700 transition-all flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center text-2xl font-black text-slate-400">
              +
            </div>
            <span className="font-bold text-slate-400">New Account</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUserId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border-2 border-red-500 p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="text-red-500" size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">DELETE ACCOUNT?</h3>
                <p className="text-slate-400">This will permanently remove all progress for <span className="text-white font-bold">{users.find(u => u.id === deletingUserId)?.name}</span>.</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    if (users.length <= 1) {
                      alert("You must have at least one player!");
                      setDeletingUserId(null);
                      return;
                    }
                    const updatedUsers = users.filter(u => u.id !== deletingUserId);
                    setUsers(updatedUsers);
                    if (currentUser?.id === deletingUserId) {
                      setCurrentUser(null);
                    }
                    setDeletingUserId(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-bold transition-all"
                >
                  DELETE
                </button>
                <button 
                  onClick={() => setDeletingUserId(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition-all"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 bg-slate-900 text-white p-8">
      <button 
        onClick={() => setGameState(GameState.ACCOUNT_SELECT)}
        className="absolute top-8 right-8 flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700 hover:bg-slate-700 transition-all"
      >
        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-black">
          {currentUser?.name[0]}
        </div>
        <span className="text-sm font-bold">{currentUser?.name}</span>
      </button>

      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-6xl font-bold tracking-tighter text-emerald-400 italic"
      >
        TRI-WORLD ODYSSEY
      </motion.h1>
      
      <div className="flex flex-col space-y-4 w-64">
        <button 
          onClick={() => setGameState(GameState.WORLD_SELECT)}
          className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg"
        >
          <Play size={24} />
          <span>START GAME</span>
        </button>
        
        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center space-x-2">
            <BookOpen size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-300">TUTORIAL MODE</span>
          </div>
          <button 
            onClick={() => setTutorialEnabled(!tutorialEnabled)}
            className={`w-12 h-6 rounded-full transition-all relative ${tutorialEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tutorialEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={() => setGameState(GameState.SHOP)}
            className="flex-1 flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-3 rounded-xl font-bold transition-all"
          >
            <ShoppingBag size={20} />
            <span>SHOP</span>
          </button>
          <button 
            onClick={() => {
              setEditorMode('select');
              setGameState(GameState.EDITOR);
            }}
            className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-all"
          >
            <Edit3 size={20} />
            <span>EDITOR</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
        <Coins className="text-amber-400" size={20} />
        <span className="font-bold text-amber-400">{totalCoins}</span>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Movement Speed</span>
        <div className="flex space-x-2">
          {[1, 1.25, 1.5].map(s => (
            <button
              key={s}
              onClick={() => setSpeedMultiplier(s)}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${speedMultiplier === s ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-3 gap-8 text-center opacity-50 text-sm">
        <div>
          <div className="font-bold text-emerald-400">WORLD 1</div>
          <div>The Whispering Woods</div>
        </div>
        <div>
          <div className="font-bold text-blue-400">WORLD 2</div>
          <div>The Echoing Depths</div>
        </div>
        <div>
          <div className="font-bold text-red-400">WORLD 3</div>
          <div>The Molten Core</div>
        </div>
      </div>
    </div>
  );

  const renderTutorialPrompt = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 bg-slate-900 text-white p-8 text-center">
      <h2 className="text-3xl font-bold">New Explorer Detected</h2>
      <p className="text-slate-400 max-w-md">Would you like to go through the basic training before starting your journey?</p>
      
      <div className="flex space-x-4">
        <button 
          onClick={() => {
            setCurrentLevelIndex(0);
            setGameState(GameState.TUTORIAL);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-xl font-bold"
        >
          YES, TEACH ME
        </button>
        <button 
          onClick={() => setGameState(GameState.WORLD_SELECT)}
          className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-xl font-bold"
        >
          NO, I'M READY
        </button>
      </div>
    </div>
  );

  const renderWorldSelect = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8 overflow-y-auto">
      <button onClick={() => setGameState(GameState.MENU)} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center space-x-2">
        <Home size={20} />
        <span>Back to Menu</span>
      </button>
      
      <h2 className="text-4xl font-bold mb-4">Select Your Destination</h2>
      <div className="mb-8 text-xl">
        Coins: <span className="text-amber-300 font-semibold">{totalCoins}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {[1, 2, 3, 4, 5, 6, 'my', 'shared', 'others'].map(w => {
          let worldLevels: LevelData[] = [];
          let title = "";
          let color = "";

          if (typeof w === 'number') {
            worldLevels = LEVELS.filter(l => l.world === w);
            const info = WORLD_INFO[w];
            title = info?.title || `WORLD ${w}`;
            color = w === 1 ? 'text-emerald-400'
                  : w === 2 ? 'text-blue-400'
                  : w === 3 ? 'text-red-400'
                  : w === 4 ? 'text-cyan-400'
                  : w === 5 ? 'text-blue-200'
                  : 'text-red-600';
          } else if (w === 'my') {
            worldLevels = customLevels.filter(l => l.creatorId === currentUser?.id && !l.isShared);
            title = customWorldName.toUpperCase();
            color = 'text-indigo-400';
          } else if (w === 'shared') {
            worldLevels = customLevels.filter(l => l.isShared);
            title = "SHARED WORLD";
            color = 'text-amber-400';
          } else if (w === 'others') {
            worldLevels = customLevels.filter(l => l.creatorId !== currentUser?.id && !l.isShared);
            title = "COMMUNITY WORLDS";
            color = 'text-slate-400';
          }

          if (typeof w !== 'number' && worldLevels.length === 0 && w !== 'my') return null;

          // determine unlock/cost status for numbered worlds
          const isWorldUnlocked = typeof w === 'number' ? unlockedWorlds.includes(w) || w <= 3 : true;
          const cost = typeof w === 'number' ? WORLD_INFO[w]?.cost : undefined;
          const maxUnlocked = unlockedWorlds.length ? Math.max(...unlockedWorlds) : 1;
          const canPurchase = typeof w === 'number' && cost && !isWorldUnlocked && w === maxUnlocked + 1 && totalCoins >= cost;
          const purchaseAction = () => {
            if (cost && totalCoins >= cost) {
              if (window.confirm(`Spend ${cost} coins to unlock ${WORLD_INFO[w]?.title || 'this world'}?`)) {
                setTotalCoins(c => c - cost);
                const worldNum = Number(w);
                setUnlockedWorlds(prev => [...prev, worldNum]);
                setUnlockedLevels(prev => [...prev, (worldNum - 1) * 5 + 1]);
              }
            } else {
              alert("You don't have enough coins yet!");
            }
          };

          return (
            <div key={w} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${color}`}>
                  {title}
                </h3>
                {w === 'my' && (
                  <button 
                    onClick={() => {
                      const newName = prompt("Rename your world:", customWorldName);
                      if (newName && newName.trim()) setCustomWorldName(newName.trim());
                    }}
                    className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-white"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
              {typeof w === 'number' && WORLD_INFO[w] && (
                <p className="text-sm text-slate-300 mb-2">
                  {WORLD_INFO[w].description}
                </p>
              )}
              {!isWorldUnlocked && typeof w === 'number' && cost && (
                <>
                  <button
                    onClick={purchaseAction}
                    disabled={!canPurchase}
                    className="mb-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full px-3 py-1 text-sm disabled:opacity-50"
                  >
                    {canPurchase ? `Unlock for ${cost} coins` : `Locked (${cost} coins)`}
                  </button>
                  {(!canPurchase && w !== maxUnlocked + 1) && (
                    <p className="text-[10px] text-slate-500">Unlock previous worlds first</p>
                  )}
                </>
              )}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: Math.max(5, worldLevels.length) }).map((_, i) => {
                  const level = worldLevels[i];
                  const isUnlocked = typeof w === 'number' ? unlockedLevels.includes(((w - 1) * 5 + i + 1)) : true;
                  const hasLevel = !!level;

                  return (
                    <button
                      key={i}
                      disabled={!isUnlocked || !hasLevel || !isWorldUnlocked}
                      onClick={() => {
                        if (level) {
                          const idx = allLevels.findIndex(l => l.id === level.id);
                          if (idx !== -1) startLevel(idx);
                        }
                      }}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold transition-all ${
                        isUnlocked && hasLevel
                          ? 'bg-slate-700 hover:bg-slate-600 text-white cursor-pointer' 
                          : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLevelComplete = () => (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6"
      >
        <Trophy size={80} className="mx-auto text-yellow-400" />
        <h2 className="text-4xl font-bold">Level Complete!</h2>
        <p className="text-slate-400">You've conquered {level.name}</p>
        
        <div className="flex space-x-4 justify-center">
          <button 
            onClick={() => setGameState(GameState.WORLD_SELECT)}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold"
          >
            LEVEL SELECT
          </button>
          <button 
            onClick={() => startLevel(currentLevelIndex + 1)}
            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-bold flex items-center space-x-2"
          >
            <span>NEXT LEVEL</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderGameComplete = () => (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8 text-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="space-y-8"
      >
        <Trophy size={120} className="mx-auto text-yellow-400 animate-bounce" />
        <h1 className="text-6xl font-black text-emerald-400">LEGENDARY!</h1>
        <p className="text-xl text-slate-300 max-w-lg mx-auto">
          You have traversed the Forest, survived the Depths, and conquered the Core. 
          The Tri-World Odyssey is complete!
        </p>
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="bg-emerald-500 hover:bg-emerald-600 px-12 py-4 rounded-2xl font-black text-xl shadow-2xl"
        >
          RETURN TO GLORY
        </button>
      </motion.div>
    </div>
  );

  const renderGameOver = () => (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white z-50">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-6"
      >
        <h2 className="text-6xl font-black text-red-500">GAME OVER</h2>
        <p className="text-slate-400">You ran out of lives!</p>
        
        <div className="flex space-x-4 justify-center">
          <button 
            onClick={() => setGameState(GameState.MENU)}
            className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded-xl font-bold"
          >
            MENU
          </button>
          <button 
            onClick={() => {
              setLives(maxLives);
              setGameState(GameState.PLAYING);
              setPlayer(prev => ({ ...prev, x: level.spawnPoint.x, y: level.spawnPoint.y, vx: 0, vy: 0 }));
            }}
            className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-xl font-bold"
          >
            TRY AGAIN
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderShop = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
      {/* Shop Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0 bg-slate-900/50 backdrop-blur-md z-10">
        <button 
          onClick={() => setGameState(GameState.MENU)} 
          className="text-slate-400 hover:text-white flex items-center space-x-2 transition-colors"
        >
          <Home size={24} />
          <span className="font-bold">Back to Menu</span>
        </button>

        <div className="flex items-center space-x-4">
          <ShoppingBag size={32} className="text-amber-400" />
          <h2 className="text-2xl font-bold">Odyssey Shop</h2>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <Coins className="text-amber-400" size={20} />
          <span className="font-bold text-amber-400">{totalCoins}</span>
        </div>
      </div>

      {/* Shop Items - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto pb-8">
          {SHOP_ITEMS.map(item => {
            const isOwned = ownedItems.includes(item.id);
            const canAfford = totalCoins >= item.cost;
            const isLife = item.id === 'life';

            return (
              <div key={item.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-all group">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{item.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{item.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-1 text-amber-400 font-bold">
                    <Coins size={16} />
                    <span>{item.cost}</span>
                  </div>
                  <button
                    disabled={(!isLife && isOwned) || !canAfford}
                    onClick={() => {
                      if (isLife && maxLives >= 10) {
                        alert("Maximum lives reached (10)!");
                        return;
                      }
                      setTotalCoins(c => c - item.cost);
                      if (isLife) {
                        setMaxLives(l => l + 1);
                      } else {
                        setOwnedItems(prev => [...prev, item.id]);
                      }
                    }}
                    className={`px-6 py-2 rounded-xl font-bold transition-all shadow-lg ${
                      (!isLife && isOwned) || (isLife && maxLives >= 10)
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : canAfford 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95' 
                          : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {(!isLife && isOwned) ? 'OWNED' : (isLife && maxLives >= 10) ? 'MAXED' : isLife ? `BUY (+1)` : 'BUY'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderEditor = () => {
    if (editorMode === 'select') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-8">
          <button onClick={() => setGameState(GameState.MENU)} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center space-x-2">
            <Home size={20} />
            <span>Back to Menu</span>
          </button>
          
          <h2 className="text-4xl font-bold mb-8">Level Editor</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <button 
              onClick={startNewLevel}
              className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 hover:border-emerald-500 hover:bg-slate-700 transition-all group"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                <Edit3 size={32} />
              </div>
              <span className="text-xl font-bold">Create New Level</span>
            </button>

            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 flex flex-col">
              <h3 className="text-xl font-bold mb-4 text-slate-400">Edit Existing</h3>
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-2">
                {customLevels.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No custom levels yet.</p>
                ) : (
                  customLevels.map(lvl => (
                    <div key={lvl.id} className="flex items-center space-x-2">
                      <button
                        onClick={() => editLevel(lvl)}
                        className="flex-1 text-left p-4 bg-slate-900 hover:bg-slate-700 rounded-xl flex items-center justify-between group transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{lvl.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest">By {lvl.creator || 'Unknown'}</span>
                        </div>
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                      {(lvl.creator === currentUser?.name) && (
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${lvl.name}"?`)) {
                              setCustomLevels(prev => prev.filter(l => l.id !== lvl.id));
                            }
                          }}
                          className="p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-slate-900 text-white">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-30">
          <div className="flex items-center space-x-4">
            <button onClick={() => setEditorMode('select')} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-black tracking-tight">{editingLevelId ? 'EDIT LEVEL' : 'NEW LEVEL'}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800 rounded-lg px-3 py-1 border border-slate-700">
              <input 
                type="text" 
                value={editorLevelName}
                onChange={(e) => setEditorLevelName(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm font-bold w-32"
                placeholder="Level Name"
              />
              <button onClick={() => {
                const newName = prompt("Rename level:", editorLevelName);
                if (newName && newName.trim()) setEditorLevelName(newName.trim());
              }}>
                <Edit3 size={14} className="text-slate-500 hover:text-white" />
              </button>
            </div>
            <button 
              onClick={() => {
                const newLevel: LevelData = {
                  id: editingLevelId || Date.now(),
                  world: 4,
                  name: editorLevelName || (editingLevelId ? customLevels.find(l => l.id === editingLevelId)?.name || 'Custom Level' : `Custom Level ${customLevels.length + 1}`),
                  entities: editorEntities,
                  spawnPoint: { x: 50, y: 500 },
                  goalPoint: editorGoalPoint,
                  background: editorColors.background,
                  customColors: editorColors,
                  creator: currentUser?.name || 'Unknown',
                  creatorId: editingLevelId ? customLevels.find(l => l.id === editingLevelId)?.creatorId || currentUser?.id : currentUser?.id,
                  lastEditorId: currentUser?.id,
                  lastEditorName: currentUser?.name,
                  isShared: editorIsShared
                };
                
                if (editingLevelId) {
                  setCustomLevels(prev => prev.map(l => l.id === editingLevelId ? newLevel : l));
                } else {
                  setCustomLevels(prev => [...prev, newLevel]);
                }
                setGameState(GameState.WORLD_SELECT);
              }}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-bold"
            >
              <Save size={20} />
              <span>SAVE LEVEL</span>
            </button>
            <button 
              onClick={() => {
                setEditorEntities([]);
                setSelectedEntityId(null);
              }}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold"
            >
              <Trash2 size={20} />
              <span>CLEAR</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Toolbar */}
          <div className="w-56 bg-slate-800 p-4 border-r border-slate-700 flex flex-col space-y-4 overflow-y-auto shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tools</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'platform', icon: <div className="w-5 h-2 rounded-sm" style={{ backgroundColor: editorColors.platform }} />, label: 'Platform' },
                { id: 'monster', icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: editorColors.monster }} />, label: 'Monster' },
                { id: 'hazard', icon: <div className="w-5 h-2 rounded-sm" style={{ backgroundColor: editorColors.hazard }} />, label: 'Hazard' },
                { id: 'coin', icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editorColors.coin }} />, label: 'Coin' },
                { id: 'extra_life', icon: <div className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: editorColors.extra_life }}>+</div>, label: 'Life' },
                { id: 'goal', icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: editorColors.goal }} />, label: 'Finish' },
                { id: 'trash', icon: <Trash2 size={18} />, label: 'Delete' },
              ].map(tool => {
                const isOwned = ownedItems.includes(tool.id) || tool.id === 'platform' || tool.id === 'goal' || tool.id === 'trash';
                return (
                  <button
                    key={tool.id}
                    disabled={!isOwned}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setSelectedEntityId(null);
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all ${
                      !isOwned ? 'opacity-30 cursor-not-allowed grayscale' :
                      selectedTool === tool.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-8 flex justify-center">{tool.icon}</div>
                    <span className="text-xs font-bold">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedEntityId && (
              <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Properties</h4>
                  <button 
                    onClick={() => {
                      setEditorEntities(prev => prev.filter(e => e.id !== selectedEntityId));
                      setSelectedEntityId(null);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="space-y-4">
                  {editorEntities.find(e => e.id === selectedEntityId)?.type !== 'goal' && (
                    <>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Width</span>
                          <span>{Math.round(editorEntities.find(e => e.id === selectedEntityId)?.width || 0)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="400" 
                          value={editorEntities.find(e => e.id === selectedEntityId)?.width || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setEditorEntities(prev => prev.map(ent => ent.id === selectedEntityId ? { ...ent, width: val } : ent));
                          }}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Height</span>
                          <span>{Math.round(editorEntities.find(e => e.id === selectedEntityId)?.height || 0)}</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="400" 
                          value={editorEntities.find(e => e.id === selectedEntityId)?.height || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setEditorEntities(prev => prev.map(ent => ent.id === selectedEntityId ? { ...ent, height: val } : ent));
                          }}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </>
                  )}
                  <p className="text-[10px] text-slate-400">Drag handles on canvas to resize or change route.</p>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settings</h4>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Shared World</span>
                <button 
                  onClick={() => setEditorIsShared(!editorIsShared)}
                  className={`w-10 h-5 rounded-full transition-all relative ${editorIsShared ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editorIsShared ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {editingLevelId && (
                <div className="space-y-1">
                  <p className="text-[9px] text-slate-500">Created by: {customLevels.find(l => l.id === editingLevelId)?.creator}</p>
                  <p className="text-[9px] text-slate-500">Last edit: {customLevels.find(l => l.id === editingLevelId)?.lastEditorName}</p>
                </div>
              )}
            </div>

            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4">Colors</h3>
            <div className="space-y-3">
              {[
                { id: 'background', label: 'BG' },
                { id: 'platform', label: 'Plat' },
                { id: 'monster', label: 'Mon' },
                { id: 'hazard', label: 'Haz' },
                { id: 'coin', label: 'Coin' },
                { id: 'extra_life', label: 'Life' },
                { id: 'goal', label: 'Goal' },
              ].map(c => {
                const isOwned = ownedItems.includes('colors') || c.id === 'background';
                return (
                  <div key={c.id} className={`flex items-center justify-between ${!isOwned ? 'opacity-30' : ''}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{c.label}</span>
                    <input 
                      type="color" 
                      disabled={!isOwned}
                      value={editorColors[c.id as keyof typeof editorColors]}
                      onChange={(e) => setEditorColors(prev => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                    />
                  </div>
                );
              })}
              {!ownedItems.includes('colors') && <p className="text-[10px] text-slate-500">Unlock colors in shop!</p>}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-black p-4 flex items-center justify-center overflow-hidden">
            <div className="relative w-[800px] h-[600px] bg-slate-800 rounded-lg overflow-hidden shadow-2xl origin-center scale-[0.85] md:scale-100">
              <Stage 
                width={800} 
                height={600}
                onMouseDown={(e) => {
                  const stage = e.target.getStage();
                  if (!stage) return;
                  const pos = stage.getPointerPosition();
                  if (!pos) return;

                  // If clicked on an entity, select it
                  const clickedOn = e.target;
                  if (clickedOn.attrs.id && clickedOn.attrs.id.startsWith('editor-')) {
                    if (selectedTool === 'trash') {
                      setEditorEntities(prev => prev.filter(ent => ent.id !== clickedOn.attrs.id));
                      setSelectedEntityId(null);
                    } else {
                      setSelectedEntityId(clickedOn.attrs.id);
                    }
                    return;
                  }

                  // If a monster is selected and we click on the background, set its path end
                  if (selectedEntityId) {
                    const selectedEnt = editorEntities.find(ent => ent.id === selectedEntityId);
                    if (selectedEnt && selectedEnt.type === 'monster') {
                      setEditorEntities(prev => prev.map(ent => ent.id === selectedEntityId ? { ...ent, pathEnd: { x: pos.x, y: pos.y } } : ent));
                      return;
                    }
                  }

                  if (selectedTool === 'goal') {
                    setEditorGoalPoint({ x: pos.x - 20, y: pos.y - 20 });
                    return;
                  }

                  // Place new
                  if (selectedTool) {
                    // Limits
                    if (selectedTool === 'coin' && editorEntities.filter(e => e.type === 'coin').length >= 5) return;
                    if (selectedTool === 'extra_life' && editorEntities.filter(e => e.type === 'extra_life').length >= 3) return;

                    const newEntity: Entity = {
                      id: `editor-${Date.now()}`,
                      type: selectedTool as any,
                      x: pos.x - 25,
                      y: pos.y - 10,
                      width: selectedTool === 'monster' ? 30 : (selectedTool === 'coin' || selectedTool === 'extra_life') ? 20 : 100,
                      height: selectedTool === 'monster' ? 30 : (selectedTool === 'coin' || selectedTool === 'extra_life') ? 20 : 20,
                      color: editorColors[selectedTool as keyof typeof editorColors] || '#ffffff',
                      initialX: pos.x - 25,
                      initialY: pos.y - 10,
                      movementRange: selectedTool === 'monster' ? 100 : 0,
                      speed: selectedTool === 'monster' ? 2 : 0,
                      direction: 1,
                      pathStart: selectedTool === 'monster' ? { x: pos.x - 25, y: pos.y - 10 } : undefined,
                      pathEnd: selectedTool === 'monster' ? { x: pos.x + 75, y: pos.y - 10 } : undefined
                    };
                    setEditorEntities(prev => [...prev, newEntity]);
                    setSelectedEntityId(newEntity.id);
                  } else {
                    setSelectedEntityId(null);
                  }
                }}
              >
                <Layer>
                  <Rect width={800} height={600} fill={editorColors.background} />
                  {editorEntities.map(e => (
                    <Group key={e.id}>
                      <Rect
                        id={e.id}
                        x={e.x}
                        y={e.y}
                        width={e.width}
                        height={e.height}
                        fill={unreachableEntities.includes(e.id) ? '#f87171' : (editorColors[e.type as keyof typeof editorColors] || e.color)}
                        stroke={selectedEntityId === e.id ? '#10b981' : (unreachableEntities.includes(e.id) ? '#ef4444' : undefined)}
                        strokeWidth={selectedEntityId === e.id ? 2 : (unreachableEntities.includes(e.id) ? 2 : 0)}
                        cornerRadius={e.type === 'platform' ? 4 : e.type === 'coin' ? 10 : 0}
                        draggable={selectedEntityId === e.id}
                        onDragMove={(evt) => {
                          const newPos = evt.target.position();
                          const dx = newPos.x - e.x;
                          const dy = newPos.y - e.y;
                          setEditorEntities(prev => prev.map(ent => ent.id === e.id ? { 
                            ...ent, 
                            x: newPos.x, 
                            y: newPos.y, 
                            initialX: newPos.x, 
                            initialY: newPos.y,
                            pathStart: ent.pathStart ? { x: ent.pathStart.x + dx, y: ent.pathStart.y + dy } : undefined,
                            pathEnd: ent.pathEnd ? { x: ent.pathEnd.x + dx, y: ent.pathEnd.y + dy } : undefined
                          } : ent));
                        }}
                      />
                      {/* Resize Handles */}
                      {selectedEntityId === e.id && (e.type === 'platform' || e.type === 'hazard') && (
                        <Rect 
                          x={e.x + e.width - 10}
                          y={e.y + e.height - 10}
                          width={10}
                          height={10}
                          fill="#10b981"
                          draggable
                          onDragMove={(evt) => {
                            const pos = evt.target.position();
                            const newWidth = Math.max(20, pos.x - e.x + 5);
                            const newHeight = Math.max(10, pos.y - e.y + 5);
                            setEditorEntities(prev => prev.map(ent => ent.id === e.id ? { ...ent, width: newWidth, height: newHeight } : ent));
                            evt.target.position({ x: e.x + newWidth - 10, y: e.y + newHeight - 10 });
                          }}
                        />
                      )}
                      {/* Monster Path Handles */}
                      {selectedEntityId === e.id && e.type === 'monster' && (
                        <Group>
                          {/* Path Line */}
                          <Rect 
                            x={e.pathStart?.x || e.x}
                            y={e.pathStart?.y || e.y}
                            width={Math.sqrt(Math.pow((e.pathEnd?.x || e.x) - (e.pathStart?.x || e.x), 2) + Math.pow((e.pathEnd?.y || e.y) - (e.pathStart?.y || e.y), 2))}
                            height={2}
                            fill="#10b981"
                            opacity={0.5}
                            rotation={Math.atan2((e.pathEnd?.y || e.y) - (e.pathStart?.y || e.y), (e.pathEnd?.x || e.x) - (e.pathStart?.x || e.x)) * 180 / Math.PI}
                          />
                          {/* Start Handle */}
                          <Rect 
                            x={(e.pathStart?.x || e.x) - 5}
                            y={(e.pathStart?.y || e.y) - 5}
                            width={10}
                            height={10}
                            fill="#3b82f6"
                            cornerRadius={5}
                            draggable
                            onDragMove={(evt) => {
                              const pos = evt.target.position();
                              setEditorEntities(prev => prev.map(ent => ent.id === e.id ? { ...ent, pathStart: { x: pos.x + 5, y: pos.y + 5 } } : ent));
                            }}
                          />
                          {/* End Handle */}
                          <Rect 
                            x={(e.pathEnd?.x || e.x) - 5}
                            y={(e.pathEnd?.y || e.y) - 5}
                            width={10}
                            height={10}
                            fill="#ef4444"
                            cornerRadius={5}
                            draggable
                            onDragMove={(evt) => {
                              const pos = evt.target.position();
                              setEditorEntities(prev => prev.map(ent => ent.id === e.id ? { ...ent, pathEnd: { x: pos.x + 5, y: pos.y + 5 } } : ent));
                            }}
                          />
                        </Group>
                      )}
                    </Group>
                  ))}
                  {/* Goal */}
                  <Rect 
                    x={editorGoalPoint.x} 
                    y={editorGoalPoint.y} 
                    width={40} 
                    height={40} 
                    fill={unreachableEntities.includes('goal') ? '#f87171' : editorColors.goal} 
                    stroke={unreachableEntities.includes('goal') ? '#ef4444' : undefined}
                    strokeWidth={unreachableEntities.includes('goal') ? 2 : 0}
                    cornerRadius={8} 
                    draggable
                    onDragMove={(evt) => {
                      const pos = evt.target.position();
                      setEditorGoalPoint({ x: pos.x, y: pos.y });
                    }}
                  />
                  <Text text="GOAL" x={editorGoalPoint.x + 5} y={editorGoalPoint.y + 15} fontSize={10} fill="#000" fontStyle="bold" pointerEvents="none" />
                </Layer>
              </Stage>
              <div className="absolute bottom-4 right-4 text-white/30 text-xs pointer-events-none">
                Select item to drag, resize, or change route • Click empty space to place tool
              </div>
              
              {unreachableEntities.length > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full border border-red-400 text-white text-xs font-bold shadow-lg animate-pulse z-20">
                  ⚠️ Some items are unreachable!
                </div>
              )}

              <div className="absolute top-4 right-4 flex flex-col items-end space-y-1 z-20">
                <div className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-900/80 border border-white/10 ${editorEntities.filter(e => e.type === 'coin').length >= 5 ? 'text-red-400' : 'text-slate-200'}`}>
                  Coins: {editorEntities.filter(e => e.type === 'coin').length}/5
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-900/80 border border-white/10 ${editorEntities.filter(e => e.type === 'extra_life').length >= 3 ? 'text-red-400' : 'text-slate-200'}`}>
                  Lives: {editorEntities.filter(e => e.type === 'extra_life').length}/3
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden font-sans">
      <div className="relative w-[800px] h-[600px] bg-slate-800 shadow-2xl rounded-lg overflow-hidden">
        
        {gameState === GameState.ACCOUNT_SELECT && renderAccountSelect()}
        {gameState === GameState.MENU && renderMenu()}
        {gameState === GameState.TUTORIAL_PROMPT && renderTutorialPrompt()}
        {gameState === GameState.WORLD_SELECT && renderWorldSelect()}
        {gameState === GameState.GAME_COMPLETE && renderGameComplete()}
        {gameState === GameState.GAME_OVER && renderGameOver()}
        {gameState === GameState.SHOP && renderShop()}
        {gameState === GameState.EDITOR && renderEditor()}

        {/* Tutorial Modal */}
        <AnimatePresence>
          {tutorialInfo && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-slate-800 border-2 border-emerald-500 p-8 rounded-[2rem] max-w-md w-full text-center space-y-8 shadow-2xl"
              >
                <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto text-emerald-500">
                  {tutorialInfo.icon}
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-emerald-400 tracking-tight">{tutorialInfo.title}</h3>
                  <p className="text-slate-300 text-lg leading-relaxed">{tutorialInfo.content}</p>
                </div>
                <button 
                  onClick={() => setTutorialInfo(null)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-2xl font-black text-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  GOT IT!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {(gameState === GameState.PLAYING || gameState === GameState.TUTORIAL || gameState === GameState.LEVEL_COMPLETE || gameState === GameState.GAME_OVER) && (
          <>
            <Stage width={800} height={600}>
              <Layer>
                <Rect width={800} height={600} fill={level.customColors?.background || level.background} />
                {level.entities.filter(e => e.type !== 'moving_platform' && e.type !== 'monster' && e.type !== 'extra_life' && e.type !== 'coin').map(e => (
                  <Rect
                    key={e.id}
                    x={e.x}
                    y={e.y}
                    width={e.width}
                    height={e.height}
                    fill={level.customColors?.[e.type as keyof typeof level.customColors] || e.color}
                    cornerRadius={e.type === 'platform' ? 4 : 0}
                  />
                ))}
                {extraLives.filter(e => !e.isDead).map(e => (
                  <Group key={e.id} x={e.x} y={e.y}>
                    <Rect
                      width={e.width}
                      height={e.height}
                      fill={level.customColors?.extra_life || e.color}
                      cornerRadius={4}
                      shadowBlur={10}
                      shadowColor={level.customColors?.extra_life || e.color}
                    />
                    <Text text="+" fontSize={14} fill="white" x={5} y={2} fontStyle="bold" />
                  </Group>
                ))}
                {coins.filter(e => !e.isDead).map(e => (
                  <Group key={e.id} x={e.x} y={e.y}>
                    <Rect
                      width={e.width}
                      height={e.height}
                      fill={level.customColors?.coin || e.color}
                      cornerRadius={10}
                      shadowBlur={5}
                      shadowColor={level.customColors?.coin || e.color}
                    />
                    <Text text="$" fontSize={10} fill="white" x={4} y={2} fontStyle="bold" />
                  </Group>
                ))}
                {movingPlatforms.map(e => (
                  <Rect
                    key={e.id}
                    x={e.x}
                    y={e.y}
                    width={e.width}
                    height={e.height}
                    fill={level.customColors?.platform || e.color}
                    cornerRadius={4}
                  />
                ))}
                {monsters.filter(e => !e.isDead).map(e => (
                  <Group key={e.id} x={e.x} y={e.y}>
                    <Rect
                      width={e.width}
                      height={e.height}
                      fill={level.customColors?.monster || e.color}
                      cornerRadius={8}
                    />
                    <Rect x={5} y={8} width={6} height={6} fill="white" cornerRadius={3} />
                    <Rect x={19} y={8} width={6} height={6} fill="white" cornerRadius={3} />
                  </Group>
                ))}
                <Group x={level.goalPoint.x} y={level.goalPoint.y}>
                  <Rect
                    width={40}
                    height={40}
                    fill={level.customColors?.goal || "#fbbf24"}
                    cornerRadius={8}
                    shadowBlur={10}
                    shadowColor={level.customColors?.goal || "#fbbf24"}
                  />
                  <Text
                    text="GOAL"
                    fontSize={10}
                    fontStyle="bold"
                    fill="#000"
                    x={5}
                    y={15}
                  />
                </Group>
                <Rect
                  x={player.x}
                  y={player.y}
                  width={player.width}
                  height={player.height}
                  fill={player.color}
                  cornerRadius={6}
                  shadowBlur={5}
                  shadowColor={player.color}
                  opacity={invincibilityFrames > 0 ? (Math.floor(invincibilityFrames / 5) % 2 === 0 ? 0.3 : 0.8) : 1}
                />
              </Layer>
            </Stage>

            {/* Tutorial Message Overlay */}
            <AnimatePresence>
              {tutorialMessage && (
                <motion.div 
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                  <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center space-x-3 border-2 border-white/20">
                    <BookOpen size={20} />
                    <span>{tutorialMessage}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* UI Overlays */}
            <div className="absolute top-4 left-4 flex space-x-4 items-center">
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold border border-white/10 flex items-center space-x-4">
                <span>{level.name}</span>
                <div className="h-4 w-[1px] bg-white/20" />
                <div className="flex space-x-1">
                  {Array.from({ length: maxLives }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-3 w-3 rounded-full ${i < lives ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-700'}`} 
                    />
                  ))}
                </div>
                <div className="h-4 w-[1px] bg-white/20" />
                <div className="flex items-center space-x-1 text-amber-400">
                  <Coins size={14} />
                  <span>{totalCoins}</span>
                </div>
              </div>
              <button 
                onClick={() => setGameState(GameState.WORLD_SELECT)}
                className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 border border-white/10"
              >
                <Home size={20} />
              </button>
              <button 
                onClick={() => {
                  setPlayer(prev => ({ ...prev, x: level.spawnPoint.x, y: level.spawnPoint.y, vx: 0, vy: 0 }));
                }}
                className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 border border-white/10"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {gameState === GameState.TUTORIAL && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/30 text-white max-w-md w-full">
                <h3 className="text-emerald-400 font-bold mb-2 flex items-center space-x-2">
                  <BookOpen size={18} />
                  <span>TUTORIAL MODE</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <kbd className="bg-slate-700 px-2 py-1 rounded">A</kbd>
                      <kbd className="bg-slate-700 px-2 py-1 rounded">D</kbd>
                    </div>
                    <span className="text-slate-400">or</span>
                    <div className="flex space-x-1">
                      <ArrowLeft size={16} />
                      <ArrowRight size={16} />
                    </div>
                    <span>Move</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="bg-slate-700 px-2 py-1 rounded">W</kbd>
                    <span className="text-slate-400">or</span>
                    <ArrowUp size={16} />
                    <span>Jump</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">Reach the golden square to complete the level. Avoid the red hazards!</p>
              </div>
            )}

            {gameState === GameState.LEVEL_COMPLETE && renderLevelComplete()}
          </>
        )}
      </div>
    </div>
  );
}
