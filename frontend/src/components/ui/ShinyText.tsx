import React from 'react';
import { cn } from '../../utils/cn';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = '',
}) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={cn(
        'inline-block font-extrabold bg-clip-text',
        disabled
          ? 'text-gold-400'
          : 'text-[#e5c77e] bg-[linear-gradient(110deg,#c29f50,45%,#ffffff,55%,#c29f50)] bg-[length:250%_100%] animate-shine',
        className
      )}
      style={{
        animationDuration: animationDuration,
      }}
    >
      {text}
    </span>
  );
};
