import { useState, useEffect } from "react";
import "./styles.css";
import Button from "../Button/Button";
import { auth } from "../../firebase";
import CaseModal from "../CaseModal/CaseModal";
import UserStats from "../UserStats/UserStats";
import UploadSolution from "../UploadSolution/UploadSolution";

const CaseCards = () => {
  const [cases, setCases] = useState([
    {
      id: 1,
      title: "Личный кабинет студента",
      description:
        "Создание интуитивно понятного и функционального личного кабинета для магистрантов, который будет интегрирован с учебными процессами, ресурсами университета и возможностями для профессионального роста.",
      fileUrl: "/cases/case1.pdf",
      functions: [
        "Управление расписанием с возможностью добавления напоминаний",
        "Доступ к учебным материалам и возможность обмена ими",
        "Отслеживание успеваемости и получение рекомендаций",
        "Карьерные возможности и ИПР",
        "Формы обратной связи и опросы",
      ],
      platform: "Веб-приложение с адаптивным дизайном",
      technologies: "React, Node.js/Django/FastAPI, PostgreSQL",
      goals: [
        "Упрощение доступа к ресурсам и информации",
        "Повышение вовлеченности в учебный процесс",
        "Улучшение коммуникации между студентами и преподавателями",
        "Развитие навыков командной работы",
      ],
      artifacts: [
        "Техническое задание с описанием целей и задач",
        "Мнемосхема бизнес-процесса",
        "Описание требований (use case/activity diagram)",
        "Архитектура системы с sequence-диаграммой",
        "Концептуальная модель данных",
        "State machine для статусной модели",
        "Визуальный макет в Figma/Adobe XD",
      ],
    },
    {
      id: 2,
      title: "Оптимизация процессов",
      description:
        "Проанализируйте и оптимизируйте существующие бизнес-процессы компании. Предложите решения для автоматизации рутинных задач и улучшения эффективности работы.",
      fileUrl: "/cases/case2.pdf",
      difficulty: "Средняя",
      timeLimit: "1 неделя",
      requirements: "Аналитическое мышление, опыт работы с процессами",
    },
  ]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthLoading(false);
      if (user) {
        setIsEmailVerified(user.emailVerified);
        setIsAuthenticated(user.emailVerified);
        setIsAdmin(user.emailVerified && user.email === "whoasked7sss@gmail.com");
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsEmailVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCaseClick = (caseItem) => {
    if (!isAuthenticated) return;
    setSelectedCase(caseItem);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCase(null);
    setIsEditing(false);
  };

  const handleAddCase = () => {
    setSelectedCase(null);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleEditCase = (caseId) => {
    const caseToEdit = cases.find((c) => c.id === caseId);
    if (caseToEdit) {
      setSelectedCase(caseToEdit);
      setIsEditing(true);
      setIsModalOpen(true);
    }
  };

  const handleDeleteCase = (caseId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот кейс?")) {
      setCases((prevCases) => prevCases.filter((c) => c.id !== caseId));
    }
  };

  const handleSaveCase = (caseData) => {
    if (isEditing) {
      if (selectedCase) {
        // Редактирование существующего кейса
        setCases((prevCases) =>
          prevCases.map((c) =>
            c.id === selectedCase.id ? { ...caseData, id: c.id } : c
          )
        );
      } else {
        // Создание нового кейса
        const newCase = {
          ...caseData,
          id: Math.max(...cases.map((c) => c.id)) + 1,
        };
        setCases((prevCases) => [...prevCases, newCase]);
      }
    }
  };

  if (isAuthLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="cards-container">
      <h2 className="cases-title">Кейсы</h2>
      {isAuthenticated ? (
        <>
          {isAdmin && (
            <div className="admin-controls">
              <Button className="admin-button" onClick={handleAddCase}>
                Добавить кейс
              </Button>
              <Button
                className="admin-button"
                onClick={() => setIsStatsOpen(true)}
              >
                Просмотр статистики
              </Button>
            </div>
          )}
          <div className="cards-holder">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="case-card"
                onClick={() => handleCaseClick(caseItem)}
              >
                <h3>{caseItem.title}</h3>
                <p>{caseItem.description}</p>
                <div className="case-meta">
                  <span className="difficulty">
                    Сложность: {caseItem.difficulty || "Высокая"}
                  </span>
                  <span className="time-limit">
                    Срок: {caseItem.timeLimit || "2 недели"}
                  </span>
                </div>
                <button className="details-button">Узнать больше</button>
                {isAdmin && (
                  <div className="admin-actions">
                    <button
                      className="edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCase(caseItem.id);
                      }}
                    >
                      Редактировать
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCase(caseItem.id);
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            className="upload-button"
            onClick={() => setIsUploadOpen(true)}
          >
            Загрузить ответ
          </Button>
        </>
      ) : (
        <div className="auth-message">
          <h3>
            {auth.currentUser && !isEmailVerified
              ? "Подтвердите ваш email"
              : "Для доступа к кейсам необходимо авторизоваться"}
          </h3>
          <p>
            {auth.currentUser && !isEmailVerified
              ? "Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения email"
              : "Пожалуйста, войдите в систему, чтобы просматривать и решать кейсы"}
          </p>
        </div>
      )}

      {isModalOpen && (
        <CaseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          caseData={selectedCase}
          isEditing={isEditing}
          onSave={handleSaveCase}
        />
      )}

      <UserStats isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />

      {isUploadOpen && (
        <UploadSolution cases={cases} onClose={() => setIsUploadOpen(false)} />
      )}
    </div>
  );
};

export default CaseCards;
