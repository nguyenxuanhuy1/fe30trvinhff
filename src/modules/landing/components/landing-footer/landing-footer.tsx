import "./landing-footer.scss";

function LandingFooter() {
  return (
    <>
      <div className="mountain-divider">
        <svg viewBox="0 0 1200 130" preserveAspectRatio="none">
          <path
            className="mountain-fill"
            d="M0,56.0 Q38.5,61.2 76.9,65.0 Q138.5,60.3 200.0,56.4 Q237.4,60.6 274.7,65.0
               Q337.4,61.2 400.0,57.3 Q443.5,61.4 487.1,65.0 Q543.5,66.1 600.0,67.8
               Q650.0,65.9 699.9,65.0 Q750.0,67.4 800.0,68.3 Q851.8,66.5 903.6,65.0
               Q951.8,62.4 1000.0,60.5 Q1063.2,62.8 1126.3,65.0 Q1163.2,60.7 1200.0,57.0
               L1200,130 L0,130 Z"
          />
        </svg>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <p className="landing-footer__credit">
            Dự án <strong>STEAMaze</strong> được tài trợ bởi dự án <strong>GenAct</strong> - Sáng kiến do <strong>UN Women Việt Nam</strong> phối hợp với <strong>TUVA Communication</strong> tổ chức, tìm kiếm và hỗ trợ các nhóm thanh niên phát triển các giải pháp số nhằm giải quyết những thách thức về bình đẳng giới, đặc biệt hướng tới phụ nữ và các nhóm yếu thế trong kỷ nguyên chuyển đổi số.
          </p>
        </div>
      </footer>
    </>
  );
}

export { LandingFooter };
