import "./loading-state.scss";

export interface LoadingStateProps {
  title?: string;
  hint?: string;
  fullScreen?: boolean;
}

function LoadingState({
  title = "Đang tải...",
  hint,
  fullScreen = true,
}: LoadingStateProps = {}) {
  const rootClass = fullScreen
    ? "game-simple-loading"
    : "game-simple-loading game-simple-loading--inline";

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-label={title}>
      <div className="game-simple-loading__container">
        <div className="game-simple-loading__track">
          <div className="game-simple-loading__fill" />
        </div>
        {title && <p className="game-simple-loading__text">{title}</p>}
      </div>
    </div>
  );
}

export { LoadingState };
