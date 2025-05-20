import "./styles.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>О проекте</h3>
          <p>
            Платформа для решения практических кейсов и развития
            профессиональных навыков
          </p>
        </div>
        <div className="footer-section">
          <h3>Контакты</h3>
          <p>Email: support@example.com</p>
          <p>Телефон: +7 (XXX) XXX-XX-XX</p>
        </div>
        <div className="footer-section">
          <h3>Ссылки</h3>
          <ul>
            <li>
              <a href="/about">О нас</a>
            </li>
            <li>
              <a href="/privacy">Политика конфиденциальности</a>
            </li>
            <li>
              <a href="/terms">Условия использования</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Все права защищены</p>
      </div>
    </footer>
  );
};

export default Footer;
