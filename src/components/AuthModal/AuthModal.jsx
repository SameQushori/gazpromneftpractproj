import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { createUserRecord } from "../../utils/userStats";
import "./styles.css";

const getFriendlyErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Неверный формат email адреса.";
    case "auth/user-disabled":
      return "Учетная запись этого пользователя отключена.";
    case "auth/user-not-found":
      return "Пользователь с таким email не найден.";
    case "auth/wrong-password":
      return "Неверный пароль.";
    case "auth/email-already-in-use":
      return "Этот email уже используется другой учетной записью.";
    case "auth/weak-password":
      return "Пароль слишком слабый. Он должен содержать не менее 6 символов.";
    case "auth/operation-not-allowed":
      return "Вход с email и паролем не включен.";
    case "auth/missing-password":
      return "Пожалуйста, введите пароль.";
    case "auth/invalid-credential":
      return "Неверные учетные данные. Проверьте email и пароль.";
    default:
      return "Произошла неизвестная ошибка. Попробуйте еще раз.";
  }
};

const AuthModal = ({ isOpen, onClose, mode: initialMode }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentMode, setCurrentMode] = useState(initialMode);

  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setError("");
      setMessage("");
      setEmail("");
      setPassword("");
    }
  }, [initialMode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (currentMode === "login") {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("User Credential Object:", userCredential);
        console.log(
          "Email Verified Status:",
          userCredential.user.emailVerified
        );
        if (!userCredential.user.emailVerified) {
          setMessage(
            "Ваш email не подтвержден. Пожалуйста, проверьте почту и подтвердите email. Если письмо не пришло, вы можете запросить его повторно при следующей попытке входа."
          );
          await signOut(auth);
          return;
        }
        onClose();
      } else if (currentMode === "register") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        if (userCredential.user) {
          await createUserRecord(userCredential.user.uid, email);
          await sendEmailVerification(userCredential.user);
          setMessage(
            "Письмо для подтверждения email отправлено. Пожалуйста, проверьте вашу почту (включая папку 'Спам'). После подтверждения вы сможете войти."
          );
          setTimeout(async () => {
            await signOut(auth);
          }, 2000);
        }
      } else if (currentMode === "forgotPassword") {
        await sendPasswordResetEmail(auth, email);
        setMessage(
          `Ссылка для сброса пароля отправлена на ${email}. Проверьте вашу почту.`
        );
      }
    } catch (error) {
      console.error("Firebase error:", error, error.code);
      setError(getFriendlyErrorMessage(error.code));
    }
  };

  const handleForgotPasswordClick = () => {
    setCurrentMode("forgotPassword");
    setError("");
    setMessage("");
  };

  const handleSwitchToLogin = () => {
    setCurrentMode("login");
    setError("");
    setMessage("");
    setPassword("");
  };

  const handleSwitchToRegister = () => {
    setCurrentMode("register");
    setError("");
    setMessage("");
    setPassword("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-close" onClick={onClose}>
          ×
        </div>
        <h2 className="modal-title">
          {currentMode === "login" && "Вход"}
          {currentMode === "register" && "Регистрация"}
          {currentMode === "forgotPassword" && "Восстановление пароля"}
        </h2>

        {message && <div className="message-info">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {currentMode !== "forgotPassword" && (
            <div className="form-group">
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={currentMode !== "forgotPassword"}
              />
            </div>
          )}

          <button type="submit" className="submit-button">
            {currentMode === "login" && "Войти"}
            {currentMode === "register" && "Зарегистрироваться"}
            {currentMode === "forgotPassword" && "Отправить ссылку для сброса"}
          </button>
        </form>

        {currentMode === "login" && (
          <div className="auth-links">
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="link-button"
            >
              Забыли пароль?
            </button>
            <p>
              Нет аккаунта?{" "}
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className="link-button"
              >
                Зарегистрироваться
              </button>
            </p>
          </div>
        )}
        {currentMode === "register" && (
          <div className="auth-links">
            <p>
              Уже есть аккаунт?{" "}
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className="link-button"
              >
                Войти
              </button>
            </p>
          </div>
        )}
        {currentMode === "forgotPassword" && (
          <div className="auth-links">
            <div
              type="button"
              onClick={handleSwitchToLogin}
              className="link-button"
            >
              Вернуться ко входу
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
