import paperMap from "../../../../../public/images/pappermap.webp";
import missionImage from "../../../../../public/images/bgm23.jpg";
import hoatiet from "../../../../../public/images/hoatiet.png";
import { BRAND_NAME } from "../../constants";
import { missionPillars, steamFeatures, teamGroups } from "../../data/content";
import "./about-sections.scss";

function AboutSections() {
  return (
    <div className="landing-about">
      <section
        className="landing-about__section landing-about__section--steam"
        id="steam"
        aria-labelledby="steam-title"
      >
        <div
          className="landing-about__steam-map"
          style={{ backgroundImage: `url("${paperMap.src}")` }}
          aria-hidden="true"
        />
        <div className="landing-about__section-inner">
          <div className="landing-about__heading">
            <div>
              <h2 className="landing-about__title" id="steam-title">
                {BRAND_NAME} LÀ GÌ?
              </h2>
              <p className="landing-about__description">
                Học {BRAND_NAME} qua trò chơi dành cho học sinh cấp 2, nơi kiến
                thức mới trở thành thử thách để chơi, khám phá và nhận quà.
              </p>
            </div>
          </div>

          <div className="landing-about__steam-layout">
            <article className="landing-about__steam-card">
              <span className="landing-about__card-label">{BRAND_NAME} / NỀN TẢNG</span>
              <p className="landing-about__steam-card-copy">
                Một nơi để các bạn khám phá kiến thức mới, tự tay thực hành và
                luôn có thử thách tiếp theo đang chờ.
              </p>
              <div className="landing-about__steam-status">
                <span>KHÁM PHÁ · THỰC HÀNH · NHẬN QUÀ</span>
              </div>
            </article>

            <div className="landing-about__feature-grid">
              {steamFeatures.map((feature) => (
                <article className="landing-about__feature" key={feature.number}>
                  <span className="landing-about__card-number">{feature.number}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="landing-about__section landing-about__section--mission landing-about__section--combined"
        id="su-menh"
        aria-labelledby="mission-title"
      >
        <div
          className="landing-about__mission-map"
          style={{ backgroundImage: `url("${missionImage.src}")` }}
          aria-hidden="true"
        />
        <div className="landing-about__section-inner">
          <div className="landing-about__block landing-about__block--mission">
            <div className="landing-about__heading">
              <div>
                <h2 className="landing-about__title" id="mission-title">
                  SỨ MỆNH CỦA CHÚNG TÔI
                </h2>
                <p className="landing-about__description">
                  Chúng tôi muốn biến mỗi bài học {BRAND_NAME} thành một hành
                  trình vui, nơi học sinh dám thử, dám sai và có lý do để quay
                  lại.
                </p>
              </div>
            </div>

            <div className="landing-about__mission-layout">
              <article className="landing-about__mission-statement">
                <span className="landing-about__card-label">CAM KẾT CỦA CHÚNG TÔI</span>
                <p className="landing-about__mission-quote">
                  “Tạo nên một nơi mà học sinh được chơi, được học và tự tin khám
                  phá khoa học bằng chính đôi tay của mình.”
                </p>
                <div className="landing-about__mission-seal">
                  <strong>{BRAND_NAME}</strong>
                  <span>— PLAY / LEARN / GROW</span>
                </div>
              </article>

              <div className="landing-about__pillar-list">
                {missionPillars.map((pillar) => (
                  <article className="landing-about__pillar" key={pillar.number}>
                    <span className="landing-about__card-number">{pillar.number}</span>
                    <div>
                      <h3>{pillar.title}</h3>
                      <p>{pillar.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="landing-about__block landing-about__block--team" id="doi-ngu">
            <div className="landing-about__heading">
              <div>
                <h2 className="landing-about__title" id="team-title">
                  ĐỘI NGŨ CỦA CHÚNG TÔI
                </h2>
                <p className="landing-about__description">
                  Nhóm 4 người yêu giáo dục, yêu công nghệ và muốn việc học trở
                  nên thú vị hơn.
                </p>
              </div>
            </div>

            <div className="landing-about__team-grid">
              {teamGroups.map((group) => (
                <article className="landing-about__team-card" key={group.number}>
                  <div
                    className="landing-about__team-art"
                    style={{ backgroundImage: `url("${hoatiet.src}")` }}
                    aria-hidden="true"
                  />
                  <span className="landing-about__team-number">{group.number}</span>
                  <div className="landing-about__team-content">
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export { AboutSections };
