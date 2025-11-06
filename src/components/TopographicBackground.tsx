import { useEffect, useRef } from 'react';

export function TopographicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Generate topographic contour lines
    const drawTopography = (offsetY: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(100, 120, 150, 0.15)'; // Midnight blue tint
      ctx.lineWidth = 0.8;

      const numLines = 40;
      const spacing = canvas.height / numLines;

      for (let i = 0; i < numLines + 5; i++) {
        ctx.beginPath();
        
        const y = i * spacing + offsetY;
        const amplitude = 60 + Math.sin(i * 0.3) * 30;
        const frequency = 0.003 + Math.sin(i * 0.2) * 0.001;
        
        for (let x = 0; x <= canvas.width; x += 2) {
          const wave1 = Math.sin(x * frequency + i * 0.5) * amplitude;
          const wave2 = Math.sin(x * frequency * 0.5 + i * 0.3) * (amplitude * 0.5);
          const yPos = y + wave1 + wave2;
          
          if (x === 0) {
            ctx.moveTo(x, yPos);
          } else {
            ctx.lineTo(x, yPos);
          }
        }
        
        ctx.stroke();
      }
    };

    // Animation loop for parallax effect
    let animationId: number;
    let offset = 0;

    const animate = () => {
      offset += 0.2; // Slow movement
      if (offset > canvas.height / 40) {
        offset = 0;
      }
      drawTopography(offset);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
