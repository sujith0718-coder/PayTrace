import React, { useRef, useState } from 'react';
import { cn } from '../../utils/cn';

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  maxTilt?: number;
  className?: string;
  children: React.ReactNode;
}

export const CardSpotlight: React.FC<CardSpotlightProps> = ({
  children,
  spotlightColor = 'rgba(214, 182, 108, 0.25)', // Champagne gold spotlight
  maxTilt = 12,
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [opacity, setOpacity] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
    setOpacity(1);

    // Calculate 3D tilt angles based on mouse position relative to center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setOpacity(0);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden transition-transform duration-200 ease-out will-change-transform',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
};

