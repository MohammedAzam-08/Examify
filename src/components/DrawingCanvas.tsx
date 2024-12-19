// src/components/DrawingCanvas.tsx
import React, { useState, useEffect } from 'react';

interface DrawingCanvasProps {
  // Add any props you want to pass to the component here
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = () => {
  const [drawing, setDrawing] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [lineWidth, setLineWidth] = useState(5);
  const [lineColor, setLineColor] = useState('black');
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;

      canvas.addEventListener('mousedown', (e) => {
        setDrawing(true);
        setLastX(e.offsetX);
        setLastY(e.offsetY);
      });

      canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(e.offsetX, e.offsetY);
          ctx.stroke();
          setLastX(e.offsetX);
          setLastY(e.offsetY);
        }
      });

      canvas.addEventListener('mouseup', () => {
        setDrawing(false);
      });
    }
  }, [drawing, lastX, lastY, lineWidth, lineColor]);

  const handleClearCanvas = () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return (
    <div>
      <canvas id="canvas" width={800} height={600} />
      <button onClick={handleClearCanvas}>Clear Canvas</button>
    </div>
  );
};

export default DrawingCanvas;