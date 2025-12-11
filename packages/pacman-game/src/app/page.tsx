'use client';

import { useEffect, useRef, useState } from 'react';

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pacmanPos, setPacmanPos] = useState({ x: 300, y: 300 });

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !gameStarted) {
        setGameStarted(true);
        return;
      }

      if (!gameStarted) return;

      setPacmanPos(prev => {
        let newX = prev.x;
        let newY = prev.y;

        switch (e.key) {
          case 'ArrowUp':
            newY = prev.y - 20;
            break;
          case 'ArrowDown':
            newY = prev.y + 20;
            break;
          case 'ArrowLeft':
            newX = prev.x - 20;
            break;
          case 'ArrowRight':
            newX = prev.x + 20;
            break;
        }

        // Keep Pacman within bounds
        newX = Math.max(20, Math.min(580, newX));
        newY = Math.max(20, Math.min(580, newY));

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    // Draw game board
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Pacman
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(pacmanPos.x, pacmanPos.y, 20, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(pacmanPos.x, pacmanPos.y);
    ctx.fill();

    // Draw some dots
    ctx.fillStyle = '#FFB897';
    for (let x = 50; x < 600; x += 50) {
      for (let y = 50; y < 600; y += 50) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Draw start overlay
    if (!gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFF';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }
  }, [pacmanPos, gameStarted]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">PACMAN</h1>
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



