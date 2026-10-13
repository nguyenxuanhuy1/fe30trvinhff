import "./loading-state.scss";

function LoadingState() {
  return (
    <div className="general-loading-overlay" role="status" aria-label="Đang tải dữ liệu">
      <div className="general-loading-overlay__window">
        <div className="general-loading-overlay__header">
          <span className="general-loading-overlay__title">Loading</span>
        </div>
        <div className="general-loading-overlay__body">
          <div className="general-loading-overlay__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="general-loading-overlay__text">
            <p>Đang tải dữ liệu...</p>
            <p className="general-loading-overlay__hint">Vui lòng đợi trong giây lát.</p>
          </div>
        </div>
        <div className="general-loading-overlay__progress">
          <div className="general-loading-overlay__progress-bar"></div>
        </div>
      </div>
    </div>
  );
}

export { LoadingState };
