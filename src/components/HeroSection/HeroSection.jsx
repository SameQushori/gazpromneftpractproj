// import Button from "../Button/Button";
import CaseCards from "../CaseCards/CaseCards";
import "./styles.css";

const HeroSection = () => {
  return (
    <div className="container">
      <div className="section-wrapper">
        <section className="hero">
          <h1 className="section-title">Хакатон</h1>
          <p className="section-subtitle">
            Примите вызов и решите реальные задачи в сфере IT
            <br />
            <br /> Скачайте кейс и начните прямо сейчас{" "}
          </p>
        </section>
        <CaseCards />
      </div>
    </div>
  );
};

export default HeroSection;
