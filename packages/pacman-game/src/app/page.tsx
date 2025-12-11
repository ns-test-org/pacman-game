'use client';

import { useEffect, useRef } from 'react';

export default function PacmanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    // Draw initial game board
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFD700';
    ctx.font = '24px Arial';
    ctx.fillText('Pacman Game Loading...', 150, 300);
  }, []);

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

