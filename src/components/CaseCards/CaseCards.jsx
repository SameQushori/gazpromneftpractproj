import { useState, useEffect } from "react";
import "./styles.css";
import Button from "../Button/Button";
import { auth, db } from "../../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import CaseModal from "../CaseModal/CaseModal";
import UserStats from "../UserStats/UserStats";
import UploadSolution from "../UploadSolution/UploadSolution";

const CaseCards = () => {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Загрузка кейсов из Firebase
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const casesCollection = collection(db, "cases");
      const casesSnapshot = await getDocs(casesCollection);
      const casesList = casesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCases(casesList);
      setError(null);
    } catch (err) {
      setError("Ошибка при загрузке кейсов");
      console.error("Error fetching cases:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

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

  const handleDeleteCase = async (caseId) => {
    if (window.confirm("Вы уверены, что хотите удалить этот кейс?")) {
      try {
        await deleteDoc(doc(db, "cases", caseId));
        await fetchCases();
      } catch (err) {
        setError("Ошибка при удалении кейса");
        console.error("Error deleting case:", err);
      }
    }
  };

  const handleSaveCase = async (caseData) => {
    try {
      if (isEditing && selectedCase) {
        // Редактирование существующего кейса
        await updateDoc(doc(db, "cases", selectedCase.id), caseData);
      } else {
        // Создание нового кейса
        await addDoc(collection(db, "cases"), caseData);
      }
      await fetchCases();
      handleCloseModal();
    } catch (err) {
      setError("Ошибка при сохранении кейса");
      console.error("Error saving case:", err);
    }
  };

  if (isAuthLoading || isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="cards-container">
      <h2 className="cases-title">Кейсы</h2>
      {error && <div className="error-message">{error}</div>}
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
