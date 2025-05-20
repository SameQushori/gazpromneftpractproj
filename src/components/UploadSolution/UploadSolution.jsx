import { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { trackWorkSubmission } from "../../utils/userStats";
import "./styles.css";

const UploadSolution = ({ cases, onClose }) => {
  const [githubUrl, setGithubUrl] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cases && cases.length > 0) {
      setSelectedCaseId(cases[0].id.toString());
    }
  }, [cases]);

  const validateGithubUrl = (url) => {
    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w-]+$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("Cases:", cases);
    console.log("Selected Case ID:", selectedCaseId);

    if (!cases || cases.length === 0) {
      setError("Нет доступных кейсов");
      return;
    }

    if (!selectedCaseId) {
      setError("Пожалуйста, выберите кейс");
      return;
    }

    if (!validateGithubUrl(githubUrl)) {
      setError("Пожалуйста, введите корректную ссылку на GitHub репозиторий");
      return;
    }

    setIsSubmitting(true);

    try {
      if (auth.currentUser) {
        const selectedCase = cases.find(
          (c) => c.id.toString() === selectedCaseId
        );
        console.log("Selected Case:", selectedCase);

        if (!selectedCase) {
          console.error("Case not found for ID:", selectedCaseId);
          setError("Выбранный кейс не найден");
          return;
        }

        await trackWorkSubmission(
          auth.currentUser.uid,
          selectedCaseId,
          githubUrl,
          selectedCase.title
        );
        setSuccess("Ссылка успешно отправлена!");
        setTimeout(() => {
          setSuccess("");
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting work:", error);
      setError("Произошла ошибка при отправке решения");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-solution-modal">
      <div className="upload-solution-content">
        <h2>Загрузить решение</h2>
        <p className="upload-description">
          Вставьте ссылку на публичный GitHub-репозиторий с вашим проектом и
          выберите соответствующий кейс.
          <br />
          <br />
          ⚠️ Внимание: При повторной загрузке решения для одного кейса будет
          сохранен только последний результат.
        </p>
        <form onSubmit={handleSubmit}>
          <select
            className="case-select"
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            required
          >
            {cases &&
              cases.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.title}
                </option>
              ))}
          </select>
          <input
            type="url"
            placeholder="https://github.com/username/repository"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="github-input"
            required
          />
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="button-group">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadSolution;
