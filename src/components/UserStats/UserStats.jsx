import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import "./styles.css";

const UserStats = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(usersQuery);
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Нет данных";
    const date = timestamp.toDate();
    return date.toLocaleString("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const handleDownloadCSV = () => {
    const headers = [
      "Email",
      "Дата регистрации",
      "Скачивал кейсы",
      "Отправлял работу",
      "Последняя работа",
      "Последняя активность",
    ];
    const csvData = users.map((user) => [
      user.email,
      formatDateTime(user.createdAt),
      user.downloadedCases?.length > 0 ? "Да" : "Нет",
      user.lastSubmittedWork ? "Да" : "Нет",
      user.lastSubmittedWork
        ? `${user.lastSubmittedWork.caseTitle} (${user.lastSubmittedWork.githubUrl})`
        : "Нет",
      formatDateTime(user.lastActivity),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `user_stats_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="stats-modal-overlay">
      <div className="stats-modal">
        <div className="stats-modal-header">
          <h2>Статистика пользователей</h2>
          <div className="stats-header-actions">
            <button className="export-button" onClick={handleDownloadCSV}>
              Экспорт в CSV
            </button>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="stats-modal-content">
          {loading ? (
            <div className="loading">Загрузка данных...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="stats-table-container">
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Дата регистрации</th>
                    <th>Скачивал кейсы</th>
                    <th>Отправлял работу</th>
                    <th>Последняя работа</th>
                    <th>Последняя активность</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{formatDateTime(user.createdAt)}</td>
                      <td>{user.downloadedCases?.length > 0 ? "Да" : "Нет"}</td>
                      <td>{user.lastSubmittedWork ? "Да" : "Нет"}</td>
                      <td>
                        {user.lastSubmittedWork ? (
                          <div>
                            <div>
                              <strong>Кейс:</strong>{" "}
                              {user.lastSubmittedWork.caseTitle}
                            </div>
                            <div>
                              <a
                                href={user.lastSubmittedWork.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {user.lastSubmittedWork.githubUrl}
                              </a>
                            </div>
                            <div className="submission-date">
                              Отправлено:{" "}
                              {formatDateTime(
                                user.lastSubmittedWork.submittedAt
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="no-data">Нет данных</span>
                        )}
                      </td>
                      <td>{formatDateTime(user.lastActivity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStats;
