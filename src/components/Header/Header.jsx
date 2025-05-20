import { useState } from "react";
import Button from "../Button/Button";
import AuthModal from "../AuthModal/AuthModal";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import "./styles.css";

const Header = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  auth.onAuthStateChanged((user) => {
    setUser(user);
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return (
    <header>
      <div className="container">
        <div className="header-content-holder">
          <img className="logo" src="src\assets\images\logo.png" alt="logo" />
          <nav className="header-nav">
            {user ? (
              <>
                <div className="user-email">{user.email}</div>
                <Button className="auth-button" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="auth-button"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Войти
                </Button>
                <Button
                  className="auth-button"
                  onClick={() => setIsRegisterModalOpen(true)}
                >
                  Регистрация
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>

      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        mode="login"
      />
      <AuthModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        mode="register"
      />
    </header>
  );
};

export default Header;
