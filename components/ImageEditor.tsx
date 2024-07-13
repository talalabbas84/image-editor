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
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    console.log('Check this natural width',img,  canvas, img?.width);
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
      if (isDrawing && rect) {
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
      } else if (isDragging) {
        const canvasRect = canvas.getBoundingClientRect();
      }
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      setIsDragging(false);
      if (ctx && rect) {
        // Center the rectangle and apply exposure effect
        applyEffects(ctx, rect);
        setImageDataUrl(canvas.toDataURL()); // Set the image data URL
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
  }, [rect, isDrawing, isDragging]);

  const drawRectangle = (ctx: CanvasRenderingContext2D, rect: Rect) => {
    const img = imgRef.current;
    if (!img) return;

    // Draw the image on the canvas
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

  const applyEffects = (ctx: CanvasRenderingContext2D, rect: Rect) => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw the original image
    ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);

    // Apply exposure effect to the original image outside the rectangle
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
          data[index] = data[index] * 0.3; // Reducing exposure
          data[index + 1] = data[index + 1] * 0.3; // Reducing exposure
          data[index + 2] = data[index + 2] * 0.3; // Reducing exposure
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleImageLoad = () => {
    const img = imgRef.current;
    console.log('Image loaded:', img?.width, img?.height);
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const updateCanvasSize = () => {
        console.log('page load');

      const aspectRatio = img.width / img.height;
      const maxWidth = window.innerWidth * 0.9; // Maximum width as 90% of window width
      const maxHeight = window.innerHeight * 0.9; // Maximum height as 90% of window height

      let newWidth = img.width;
      let newHeight = img.height;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = maxWidth / aspectRatio;
      }

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      console.log('canvas width', canvas.width, canvas.height, img.width, img.height);
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;


      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        setImageDataUrl(canvas.toDataURL()); // Set the initial image data URL
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
    if (!rect) {
      alert('Please select a region to save the image.');
      return;
    }
    console.log('Saving image...');
    // Calculate the scaling factors
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;

    // ??? have to decide if i should scale the rect or not

    // Scale the rect coordinates
    // const scaledRect = {
    //   startX: rect.startX * scaleX,
    //   startY: rect.startY * scaleY,
    //   width: rect.width * scaleX,
    //   height: rect.height * scaleY
    // };
    console.log('Scaled rect:', rect, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = 'edited-image.png';
    link.click(); 
  };

  const handleSaveToDB = async () => {
    console.log('Saving image to the database...');
    if (!imageDataUrl || !rect) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Calculate the scaling factors
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;

    // Scale the rect coordinates
    const scaledRect = {
      startX: rect.startX * scaleX,
      startY: rect.startY * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY
    };

    try {
      await axios.post('/api/save-image', {
        imageDataUrl,
        rect: scaledRect,
        imageWidth: img.width,
        imageHeight: img.height
      });
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
        src='https://res.cloudinary.com/ddue2t3ue/image/upload/fl_preserve_transparency/v1720882093/Nicky/Product-Page-Desktop_1_dxwlpu.jpg?_s=public-apps'
        alt='Editable'
        style={{ opacity: 0, position: 'absolute', top: 0, left: 0 }}
        width={1920}
        height={1080}
        crossOrigin='anonymous'
        onLoad={handleImageLoad}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: isDragging ? 'move' : 'crosshair',
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
