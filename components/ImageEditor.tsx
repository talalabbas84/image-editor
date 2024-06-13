'use client';
import axios from 'axios'; // Add this for making HTTP requests
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface Rect {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

const ImageEditor: React.FC = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      setIsDrawing(true);
      setRect({
        startX: e.clientX - canvasRect.left,
        startY: e.clientY - canvasRect.top,
        width: 0,
        height: 0
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !rect) return;
      const canvasRect = canvas.getBoundingClientRect();
      const newWidth = e.clientX - canvasRect.left - rect.startX;
      const newHeight = e.clientY - canvasRect.top - rect.startY;
      const currentRect = {
        ...rect,
        width: newWidth,
        height: newHeight
      };
      setRect(currentRect);
      drawRectangle(ctx, currentRect);
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      if (ctx && rect) {
        adjustExposure(ctx, rect);
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [rect, isDrawing]);

  const drawRectangle = (ctx: CanvasRenderingContext2D, rect: Rect) => {
    const img = imgRef.current;
    if (!img) return;

    // Clear the canvas and redraw the image
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw the rectangle
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(rect.startX, rect.startX + rect.width),
      Math.min(rect.startY, rect.startY + rect.height),
      Math.abs(rect.width),
      Math.abs(rect.height)
    );
  };

  const adjustExposure = (ctx: CanvasRenderingContext2D, rect: Rect) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );
    const data = imageData.data;

    const startX = Math.min(rect.startX, rect.startX + rect.width);
    const startY = Math.min(rect.startY, rect.startY + rect.height);
    const endX = Math.max(rect.startX, rect.startX + rect.width);
    const endY = Math.max(rect.startY, rect.startY + rect.height);

    for (let y = 0; y < ctx.canvas.height; y++) {
      for (let x = 0; x < ctx.canvas.width; x++) {
        if (x < startX || x > endX || y < startY || y > endY) {
          const index = (y * ctx.canvas.width + x) * 4;
          data[index] = data[index] * 0.8; // Reducing exposure
          data[index + 1] = data[index + 1] * 0.8; // Reducing exposure
          data[index + 2] = data[index + 2] * 0.8; // Reducing exposure
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setImageDataUrl(canvas.toDataURL()); // Save the image data URL
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const updateCanvasSize = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const maxWidth = window.innerWidth * 0.9; // Maximum width as 90% of window width
      const maxHeight = window.innerHeight * 0.9; // Maximum height as 90% of window height

      let newWidth = img.naturalWidth;
      let newHeight = img.naturalHeight;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = maxWidth / aspectRatio;
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${newWidth}px`;
      canvas.style.height = `${newHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  };

  const handleSaveImage = () => {
    if (!imageDataUrl) return;

    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = 'edited-image.png';
    link.click();
  };

  const handleSaveToDB = async () => {
    if (!imageDataUrl) return;
    console.log(imageDataUrl, 'imageDataUrl')
    try {
      await axios.post('/api/save-image', { imageDataUrl });
      alert('Image saved to the database successfully!');
    } catch (error) {
      console.error('Error saving image to database', error);
      alert('Failed to save image to the database.');
    }
  };

  return (
    <div style={{ position: 'relative', maxWidth: '100%', margin: '0 auto' }}>
      <Image
        ref={imgRef}
        src='https://images.unsplash.com/photo-1481349518771-20055b2a7b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzNjUyOXwwfDF8c2VhcmNofDF8fHJhbmRvbXxlbnwwfHx8fDE2NTY4MzMzOTI&ixlib=rb-1.2.1&q=80&w=1080'
        alt='Editable'
        style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }}
        width={1080}
        height={720}
        crossOrigin='anonymous'
        onLoad={handleImageLoad}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'crosshair',
          zIndex: 1
        }}
      />
      <button
        onClick={handleSaveImage}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 2,
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Save Image
      </button>
      <button
        onClick={handleSaveToDB}
        style={{
          position: 'absolute',
          top: '10px',
          right: '120px',
          zIndex: 2,
          padding: '10px 20px',
          backgroundColor: '#28A745',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Save to DB
      </button>
    </div>
  );
};

export default ImageEditor;
