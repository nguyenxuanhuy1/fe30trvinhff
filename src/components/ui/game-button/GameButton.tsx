import React, { ButtonHTMLAttributes } from 'react';
import './GameButton.scss';

export interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

export function GameButton({ 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: GameButtonProps) {
  const rootClass = `game-button game-button--${size} ${className}`.trim();

  return (
    <button className={rootClass} {...props}>
      <span>{children}</span>
    </button>
  );
}
