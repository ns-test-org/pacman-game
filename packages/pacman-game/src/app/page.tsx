'use client';

import { useEffect, useRef, useState } from 'react';

const CELL_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;

type Ghost = {
  x: number;
  y: number;
  color: string;
  originalColor: string;
  name: string;
  mode: 'chase' | 'scatter' | 'frightened';
};

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [pacmanPos, setPacmanPos] = useState({ x: 1, y: 1 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [dots, setDots] = useState<Set<string>>(new Set());
  const [powerPellets, setPowerPellets] = useState<Set<string>>(new Set());
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [frightenedMode, setFrightenedMode] = useState(false);
  const animationRef = useRef<number>(0);
  const lastMoveTime = useRef<number>(0);
  const lastGhostMoveTime = useRef<number>(0);
  const frightenedTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize dots, power pellets, and ghosts
  useEffect(() => {
    const initialDots = new Set<string>();
    const initialPowerPellets = new Set<string>();
    
    // Ghost house area (center of map)
    const ghostHouseX = Math.floor(GRID_WIDTH / 2);
    const ghostHouseY = Math.floor(GRID_HEIGHT / 2);
    
    for (let x = 1; x < GRID_WIDTH - 1; x++) {
      for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        // Skip ghost house area
        if (Math.abs(x - ghostHouseX) <= 1 && Math.abs(y - ghostHouseY) <= 1) {
          continue;
        }
        initialDots.add(`${x},${y}`);
      }
    }
    
    // Add power pellets in corners
    initialPowerPellets.add('2,2');
    initialPowerPellets.add(`${GRID_WIDTH - 3},2`);
    initialPowerPellets.add(`2,${GRID_HEIGHT - 3}`);
    initialPowerPellets.add(`${GRID_WIDTH - 3},${GRID_HEIGHT - 3}`);
    
    // Remove power pellet positions from dots
    initialPowerPellets.forEach(pellet => initialDots.delete(pellet));
    
    setDots(initialDots);
    setPowerPellets(initialPowerPellets);
    
    // Initialize ghosts in ghost house
    setGhosts([
      { x: ghostHouseX - 1, y: ghostHouseY, color: '#FF0000', originalColor: '#FF0000', name: 'Blinky', mode: 'chase' },
      { x: ghostHouseX + 1, y: ghostHouseY, color: '#FFB8FF', originalColor: '#FFB8FF', name: 'Pinky', mode: 'chase' },
      { x: ghostHouseX, y: ghostHouseY - 1, color: '#00FFFF', originalColor: '#00FFFF', name: 'Inky', mode: 'chase' },
      { x: ghostHouseX, y: ghostHouseY + 1, color: '#FFB851', originalColor: '#FFB851', name: 'Clyde', mode: 'chase' },
    ]);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameStarted) {
        setGameStarted(true);
        return;
      }
      
      if (e.code === 'Space' && gameOver) {
        // Reset game
        setGameOver(false);
        setGameStarted(false);
        setPacmanPos({ x: 1, y: 1 });
        setDirection({ x: 0, y: 0 });
        setScore(0);
        setFrightenedMode(false);
        
        // Reinitialize dots, power pellets, and ghosts
        const initialDots = new Set<string>();
        const initialPowerPellets = new Set<string>();
        const ghostHouseX = Math.floor(GRID_WIDTH / 2);
        const ghostHouseY = Math.floor(GRID_HEIGHT / 2);
        
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
          for (let y = 1; y < GRID_HEIGHT - 1; y++) {
            if (Math.abs(x - ghostHouseX) <= 1 && Math.abs(y - ghostHouseY) <= 1) {
              continue;
            }
            initialDots.add(`${x},${y}`);
          }
        }
        
        initialPowerPellets.add('2,2');
        initialPowerPellets.add(`${GRID_WIDTH - 3},2`);
        initialPowerPellets.add(`2,${GRID_HEIGHT - 3}`);
        initialPowerPellets.add(`${GRID_WIDTH - 3},${GRID_HEIGHT - 3}`);
        initialPowerPellets.forEach(pellet => initialDots.delete(pellet));
        
        setDots(initialDots);
        setPowerPellets(initialPowerPellets);
        setGhosts([
          { x: ghostHouseX - 1, y: ghostHouseY, color: '#FF0000', originalColor: '#FF0000', name: 'Blinky', mode: 'chase' },
          { x: ghostHouseX + 1, y: ghostHouseY, color: '#FFB8FF', originalColor: '#FFB8FF', name: 'Pinky', mode: 'chase' },
          { x: ghostHouseX, y: ghostHouseY - 1, color: '#00FFFF', originalColor: '#00FFFF', name: 'Inky', mode: 'chase' },
          { x: ghostHouseX, y: ghostHouseY + 1, color: '#FFB851', originalColor: '#FFB851', name: 'Clyde', mode: 'chase' },
        ]);
        return;
      }

      if (!gameStarted || gameOver) return;

      e.preventDefault();

      switch (e.key) {
        case 'ArrowUp':
          setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]);

  // Ghost AI logic
  const moveGhost = (ghost: Ghost, pacman: { x: number; y: number }): { x: number; y: number } => {
    let targetX = pacman.x;
    let targetY = pacman.y;
    
    if (ghost.mode === 'frightened') {
      // Random movement when frightened
      const moves = [
        { x: ghost.x + 1, y: ghost.y },
        { x: ghost.x - 1, y: ghost.y },
        { x: ghost.x, y: ghost.y + 1 },
        { x: ghost.x, y: ghost.y - 1 },
      ].filter(pos => 
        pos.x >= 0 && pos.x < GRID_WIDTH && 
        pos.y >= 0 && pos.y < GRID_HEIGHT
      );
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return randomMove || { x: ghost.x, y: ghost.y };
    }
    
    // Classic ghost AI behaviors
    switch (ghost.name) {
      case 'Blinky': // Red - Direct chase
        targetX = pacman.x;
        targetY = pacman.y;
        break;
        
      case 'Pinky': // Pink - Ambush (4 tiles ahead)
        targetX = pacman.x + direction.x * 4;
        targetY = pacman.y + direction.y * 4;
        break;
        
      case 'Inky': // Cyan - Flanking (complex pattern)
        const blinky = ghosts.find(g => g.name === 'Blinky');
        if (blinky) {
          const aheadX = pacman.x + direction.x * 2;
          const aheadY = pacman.y + direction.y * 2;
          targetX = aheadX + (aheadX - blinky.x);
          targetY = aheadY + (aheadY - blinky.y);
        }
        break;
        
      case 'Clyde': // Orange - Chase when far, scatter when close
        const distance = Math.abs(ghost.x - pacman.x) + Math.abs(ghost.y - pacman.y);
        if (distance > 8) {
          targetX = pacman.x;
          targetY = pacman.y;
        } else {
          targetX = 0;
          targetY = GRID_HEIGHT - 1;
        }
        break;
    }
    
    // Move towards target
    const dx = targetX - ghost.x;
    const dy = targetY - ghost.y;
    
    let newX = ghost.x;
    let newY = ghost.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      newX = ghost.x + (dx > 0 ? 1 : -1);
    } else if (dy !== 0) {
      newY = ghost.y + (dy > 0 ? 1 : -1);
    }
    
    // Keep within bounds
    newX = Math.max(0, Math.min(GRID_WIDTH - 1, newX));
    newY = Math.max(0, Math.min(GRID_HEIGHT - 1, newY));
    
    return { x: newX, y: newY };
  };

  // Game loop with smooth animation
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastMoveTime.current;
      const ghostDeltaTime = timestamp - lastGhostMoveTime.current;
      
      // Move Pacman every 150ms
      if (deltaTime > 150) {
        setPacmanPos(prev => {
          const newX = prev.x + direction.x;
          const newY = prev.y + direction.y;

          // Keep within bounds
          const boundedX = Math.max(0, Math.min(GRID_WIDTH - 1, newX));
          const boundedY = Math.max(0, Math.min(GRID_HEIGHT - 1, newY));

          // Check if dot exists at new position
          const dotKey = `${boundedX},${boundedY}`;
          if (dots.has(dotKey)) {
            setDots(prev => {
              const newDots = new Set(prev);
              newDots.delete(dotKey);
              return newDots;
            });
            setScore(s => s + 10);
          }
          
          // Check if power pellet exists at new position
          if (powerPellets.has(dotKey)) {
            setPowerPellets(prev => {
              const newPellets = new Set(prev);
              newPellets.delete(dotKey);
              return newPellets;
            });
            setScore(s => s + 50);
            
            // Activate frightened mode
            setFrightenedMode(true);
            setGhosts(prev => prev.map(g => ({ ...g, mode: 'frightened' as const, color: '#0000FF' })));
            
            // Clear existing timer
            if (frightenedTimer.current) {
              clearTimeout(frightenedTimer.current);
            }
            
            // Set timer to end frightened mode (7 seconds)
            frightenedTimer.current = setTimeout(() => {
              setFrightenedMode(false);
              setGhosts(prev => prev.map(g => ({ ...g, mode: 'chase' as const, color: g.originalColor })));
            }, 7000); // Ghosts turn back to original colors after 7 seconds
          }

          return { x: boundedX, y: boundedY };
        });
        
        lastMoveTime.current = timestamp;
      }
      
      // Move ghosts every 200ms (slightly slower than Pacman)
      if (ghostDeltaTime > (frightenedMode ? 250 : 200)) {
        setGhosts(prevGhosts => {
          return prevGhosts.map(ghost => {
            const newPos = moveGhost(ghost, pacmanPos);
            return { ...ghost, x: newPos.x, y: newPos.y };
          });
        });
        
        lastGhostMoveTime.current = timestamp;
      }
      
      // Check collision with ghosts (after ghost movement)
      const currentGhosts = ghosts;
      currentGhosts.forEach(ghost => {
        if (ghost.x === pacmanPos.x && ghost.y === pacmanPos.y) {
          if (ghost.mode === 'frightened') {
            // Eat ghost
            setScore(s => s + 200);
            // Reset ghost to ghost house
            const ghostHouseX = Math.floor(GRID_WIDTH / 2);
            const ghostHouseY = Math.floor(GRID_HEIGHT / 2);
            setGhosts(prev => prev.map(g => 
              g.name === ghost.name 
                ? { ...g, x: ghostHouseX, y: ghostHouseY, mode: 'chase' as const, color: g.originalColor }
                : g
            ));
          } else {
            // Game over
            setGameOver(true);
          }
        }
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (frightenedTimer.current) {
        clearTimeout(frightenedTimer.current);
      }
    };
  }, [gameStarted, gameOver, direction, dots, powerPellets, ghosts, pacmanPos, frightenedMode]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = GRID_WIDTH * CELL_SIZE;
    canvas.height = GRID_HEIGHT * CELL_SIZE;

    // Draw game board
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ghost house
    const ghostHouseX = Math.floor(GRID_WIDTH / 2);
    const ghostHouseY = Math.floor(GRID_HEIGHT / 2);
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      (ghostHouseX - 1.5) * CELL_SIZE,
      (ghostHouseY - 1.5) * CELL_SIZE,
      CELL_SIZE * 3,
      CELL_SIZE * 3
    );

    // Draw dots
    ctx.fillStyle = '#FFB897';
    dots.forEach(dotKey => {
      const [x, y] = dotKey.split(',').map(Number);
      ctx.beginPath();
      ctx.arc(
        x * CELL_SIZE + CELL_SIZE / 2,
        y * CELL_SIZE + CELL_SIZE / 2,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });
    
    // Draw power pellets
    ctx.fillStyle = '#FFF';
    powerPellets.forEach(pelletKey => {
      const [x, y] = pelletKey.split(',').map(Number);
      ctx.beginPath();
      ctx.arc(
        x * CELL_SIZE + CELL_SIZE / 2,
        y * CELL_SIZE + CELL_SIZE / 2,
        6,
        0,
        2 * Math.PI
      );
      ctx.fill();
    });

    // Draw ghosts
    ghosts.forEach(ghost => {
      ctx.fillStyle = ghost.color;
      
      // Ghost body
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        Math.PI,
        0
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE - 6,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 4
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + 6,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 + 4
      );
      ctx.lineTo(
        ghost.x * CELL_SIZE + 2,
        ghost.y * CELL_SIZE + CELL_SIZE - 2
      );
      ctx.closePath();
      ctx.fill();
      
      // Draw unique hats for each ghost
      if (ghost.mode !== 'frightened') {
        const centerX = ghost.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = ghost.y * CELL_SIZE + CELL_SIZE / 2;
        
        switch (ghost.name) {
          case 'Blinky': // Crown
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(centerX - 8, centerY - 10);
            ctx.lineTo(centerX - 6, centerY - 14);
            ctx.lineTo(centerX - 3, centerY - 11);
            ctx.lineTo(centerX, centerY - 15);
            ctx.lineTo(centerX + 3, centerY - 11);
            ctx.lineTo(centerX + 6, centerY - 14);
            ctx.lineTo(centerX + 8, centerY - 10);
            ctx.lineTo(centerX - 8, centerY - 10);
            ctx.fill();
            break;
            
          case 'Pinky': // Bow
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(centerX - 5, centerY - 12, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 5, centerY - 12, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillRect(centerX - 2, centerY - 13, 4, 3);
            break;
            
          case 'Inky': // Top hat
            ctx.fillStyle = '#000';
            ctx.fillRect(centerX - 8, centerY - 11, 16, 2);
            ctx.fillRect(centerX - 5, centerY - 18, 10, 7);
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(centerX - 5, centerY - 15, 10, 1);
            break;
            
          case 'Clyde': // Baseball cap
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY - 11, 8, 4, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillRect(centerX - 2, centerY - 16, 8, 5);
            break;
        }
      }
      
      // Ghost eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 - 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 3,
        3,
        0,
        2 * Math.PI
      );
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2 + 5,
        ghost.y * CELL_SIZE + CELL_SIZE / 2 - 3,
        3,
        0,
        2 * Math.PI
      );
      ctx.fill();
      
      if (ghost.mode !== 'frightened') {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(
          ghost.x * CELL_SIZE + CELL_SIZE / 2 - 5,
          ghost.y * CELL_SIZE + CELL_SIZE / 2 - 3,
          1.5,
          0,
          2 * Math.PI
        );
        ctx.arc(
          ghost.x * CELL_SIZE + CELL_SIZE / 2 + 5,
          ghost.y * CELL_SIZE + CELL_SIZE / 2 - 3,
          1.5,
          0,
          2 * Math.PI
        );
        ctx.fill();
      }
    });

    // Draw Pacman
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(
      pacmanPos.x * CELL_SIZE + CELL_SIZE / 2,
      pacmanPos.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0.2 * Math.PI,
      1.8 * Math.PI
    );
    ctx.lineTo(
      pacmanPos.x * CELL_SIZE + CELL_SIZE / 2,
      pacmanPos.y * CELL_SIZE + CELL_SIZE / 2
    );
    ctx.fill();

    // Draw start overlay
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFF';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }
    
    // Draw game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FF0000';
      ctx.font = '32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#FFF';
      ctx.font = '18px Arial';
      ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }, [pacmanPos, gameStarted, gameOver, dots, powerPellets, ghosts, frightenedMode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-4xl font-bold text-yellow-400 mb-4">PACMAN</h1>
      <div className="text-white text-2xl mb-4">Score: {score}</div>
      <canvas 
        ref={canvasRef}
        className="border-4 border-blue-600 rounded-lg shadow-2xl"
      />
      <div className="mt-6 text-white text-center">
        <p className="text-lg">Use Arrow Keys to Move</p>
        <p className="text-sm text-gray-400 mt-2">
          {!gameStarted ? 'Press Space to Start' : 'Eat power pellets to turn ghosts blue!'}
        </p>
        {frightenedMode && (
          <p className="text-sm text-blue-400 mt-2 font-bold">POWER MODE!</p>
        )}
      </div>
    </div>
  );
}
















