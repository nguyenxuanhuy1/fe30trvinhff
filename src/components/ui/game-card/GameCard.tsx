import React from 'react';
import './GameCard.scss';

export interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isSpecial?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(function GameCard(
  { isSpecial = false, className = '', children, ...props },
  ref
) {
  const rootClass = `ui-game-card ${isSpecial ? 'ui-game-card--special' : ''} ${className}`.trim();

  return (
    <div ref={ref} className={rootClass} {...props}>
      {children}
    </div>
  );
});
