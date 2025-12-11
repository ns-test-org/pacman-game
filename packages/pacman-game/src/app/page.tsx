'use client';

import { useEffect, useRef, useState } from 'react';

const CELL_SIZE = 30;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 20;

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pacmanPos, setPacmanPos] = useState({ x: 1, y: 1 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [dots, setDots] = useState<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastMoveTime = useRef<number>(0);

  // Initialize dots
  useEffect(() => {
    const initialDots = new Set<string>();
    for (let x = 1; x < GRID_WIDTH - 1; x++) {
      for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        initialDots.add(`${x},${y}`);
      }
    }
    setDots(initialDots);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameStarted) {
        setGameStarted(true);
        return;
      }

      if (!gameStarted) return;

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
  }, [gameStarted]);

  // Game loop with smooth animation
  useEffect(() => {
    if (!gameStarted) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastMoveTime.current;
      
      // Move every 150ms for smooth gameplay
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

          return { x: boundedX, y: boundedY };
        });
        
        lastMoveTime.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameStarted, direction, dots]);

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
  }, [pacmanPos, gameStarted, dots]);

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
        <p className="text-sm text-gray-400 mt-2">Press Space to Start</p>
      </div>
    </div>
  );
}







