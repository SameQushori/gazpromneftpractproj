import { useState, useEffect, useRef } from "react";
import { auth } from "../../firebase";
import { trackCaseDownload } from "../../utils/userStats";
import { getCachedPDF, setCachedPDF } from "../../utils/pdfCache";
import { checkRateLimit } from "../../utils/rateLimiter";
import jsPDF from "jspdf";
import "./styles.css";

// Импортируем шрифты
import robotoRegular from "../../assets/fonts/Roboto-Regular.ttf";
import robotoBold from "../../assets/fonts/Roboto-Bold.ttf";

// Защита от XSS-атак/Инъекциями/Переполнению буфера :

// Функция для санитизации текста
const sanitizeText = (text) => {
  if (!text) return "";
  // Удаляем потенциально опасные символы и ограничиваем длину
  return String(text)
    .replace(/[<>]/g, "") // Удаляем HTML-теги
    .slice(0, 10000); // Ограничиваем длину текста
};

// Максимальный размер PDF в байтах (10MB)
const MAX_PDF_SIZE = 10 * 1024 * 1024;

const CaseModal = ({
  isOpen,
  onClose,
  caseData,
  isEditing = false,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    functions: [""],
    platform: "",
    technologies: "",
    goals: [""],
    artifacts: [""],
    difficulty: "Высокая",
    timeLimit: "2 недели",
  });

  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (caseData) {
      // Санитизируем все текстовые поля
      setFormData({
        title: sanitizeText(caseData.title),
        description: sanitizeText(caseData.description),
        functions: (caseData.functions || [""]).map(sanitizeText),
        platform: sanitizeText(caseData.platform),
        technologies: sanitizeText(caseData.technologies),
        goals: (caseData.goals || [""]).map(sanitizeText),
        artifacts: (caseData.artifacts || [""]).map(sanitizeText),
        difficulty: sanitizeText(caseData.difficulty) || "Высокая",
        timeLimit: sanitizeText(caseData.timeLimit) || "2 недели",
      });
    }
  }, [caseData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizeText(value),
    }));
  };

  const handleArrayInputChange = (index, value, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) =>
        i === index ? sanitizeText(value) : item
      ),
    }));
  };

  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
    onClose();
  };

  const generatePDF = async () => {
    if (!caseData) {
      setError("Данные кейса отсутствуют");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Проверяем авторизацию
      if (!auth.currentUser) {
        throw new Error("Необходима авторизация");
      }

      // Проверяем rate limit
      if (!checkRateLimit(auth.currentUser.uid)) {
        throw new Error("Слишком много запросов. Пожалуйста, подождите.");
      }

      // Формируем название файла
      const caseNumber = caseData.id.toString().padStart(2, "0"); // Добавляем ведущий ноль для однозначных чисел
      const safeFileName = `case_${caseNumber}`;

      // Проверяем кэш
      const cachedPDF = getCachedPDF(caseData.id);
      if (cachedPDF) {
        // Создаем Blob из кэшированных данных
        const blob = new Blob([cachedPDF], { type: "application/pdf" });

        // Проверяем размер файла
        if (blob.size > MAX_PDF_SIZE) {
          throw new Error("Размер PDF файла превышает допустимый лимит");
        }

        // Создаем ссылку для скачивания
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${safeFileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await trackCaseDownload(auth.currentUser.uid, caseData.id);
        return;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        putOnlyUsedFonts: true,
        compress: true,
      });

      // Добавляем шрифты
      pdf.addFont(robotoRegular, "Roboto", "normal");
      pdf.addFont(robotoBold, "Roboto", "bold");

      // Настройка шрифтов
      pdf.setFont("Roboto", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(29, 48, 88);

      // Безопасное получение и обработка заголовка
      const title = sanitizeText(caseData.title);
      if (!title) {
        throw new Error("Название кейса отсутствует");
      }

      const titleWidth =
        (pdf.getStringUnitWidth(title) * 24) / pdf.internal.scaleFactor;
      const titleX = (pdf.internal.pageSize.getWidth() - titleWidth) / 2;
      pdf.text(title, titleX, 30);

      // Настройка для основного текста
      pdf.setFont("Roboto", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0); // Черный цвет для основного текста

      let yPosition = 45; // Начальная позиция Y
      const lineHeight = 7; // Высота строки
      const margin = 20; // Отступы слева и справа
      const pageWidth = pdf.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const bottomMargin = 20; // Отступ снизу страницы

      // Функция для проверки необходимости новой страницы
      const checkNewPage = (y, height) => {
        if (y + height > pageHeight - bottomMargin) {
          pdf.addPage();
          return 20; // Возвращаем начальную позицию Y для новой страницы
        }
        return y;
      };

      // Функция для добавления текста с переносом строк и автоматическим добавлением страниц
      const addWrappedText = (text, y) => {
        const lines = pdf.splitTextToSize(text, maxWidth);
        const textHeight = lines.length * lineHeight;

        y = checkNewPage(y, textHeight);

        pdf.text(lines, margin, y);
        return y + textHeight;
      };

      // Функция для добавления заголовка секции
      const addSectionTitle = (title, y) => {
        y = checkNewPage(y, lineHeight * 2);

        pdf.setFont("Roboto", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(96, 165, 250); // Синий цвет для заголовков
        y = addWrappedText(title, y);
        pdf.setFont("Roboto", "normal");
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        return y + lineHeight;
      };

      // Добавление описания
      yPosition = addSectionTitle("Описание", yPosition);
      yPosition = addWrappedText(caseData.description, yPosition) + lineHeight;

      // Добавление функций
      if (caseData.functions && caseData.functions.length > 0) {
        yPosition = addSectionTitle("Основные функции", yPosition);
        caseData.functions.forEach((func) => {
          yPosition = addWrappedText(`• ${func}`, yPosition);
        });
        yPosition += lineHeight;
      }

      // Добавление платформы
      if (caseData.platform) {
        yPosition = addSectionTitle("Платформа", yPosition);
        yPosition = addWrappedText(caseData.platform, yPosition) + lineHeight;
      }

      // Добавление технологий
      if (caseData.technologies) {
        yPosition = addSectionTitle("Технологии", yPosition);
        yPosition =
          addWrappedText(caseData.technologies, yPosition) + lineHeight;
      }

      // Добавление целей
      if (caseData.goals && caseData.goals.length > 0) {
        yPosition = addSectionTitle("Цели", yPosition);
        caseData.goals.forEach((goal) => {
          yPosition = addWrappedText(`• ${goal}`, yPosition);
        });
        yPosition += lineHeight;
      }

      // Добавление артефактов
      if (caseData.artifacts && caseData.artifacts.length > 0) {
        yPosition = addSectionTitle("Артефакты", yPosition);
        caseData.artifacts.forEach((artifact) => {
          yPosition = addWrappedText(`• ${artifact}`, yPosition);
        });
        yPosition += lineHeight;
      }

      // Добавление сложности и срока
      if (caseData.difficulty || caseData.timeLimit) {
        yPosition = addSectionTitle("Дополнительная информация", yPosition);
        if (caseData.difficulty) {
          yPosition = addWrappedText(
            `Сложность: ${caseData.difficulty}`,
            yPosition
          );
        }
        if (caseData.timeLimit) {
          yPosition = addWrappedText(`Срок: ${caseData.timeLimit}`, yPosition);
        }
      }

      // Добавление футера на каждой странице
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const footerText = `© Газпром нефть - Страница ${i} из ${pageCount}`;
        pdf.setFontSize(10);
        pdf.setTextColor(128, 128, 128);
        pdf.text(footerText, margin, pageHeight - 10);
      }

      // Получаем PDF как ArrayBuffer
      const pdfData = pdf.output("arraybuffer");

      // Проверяем размер файла
      if (pdfData.byteLength > MAX_PDF_SIZE) {
        throw new Error("Размер PDF файла превышает допустимый лимит");
      }

      // Сохраняем в кэш
      setCachedPDF(caseData.id, pdfData);

      // Безопасное сохранение файла
      const blob = new Blob([pdfData], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await trackCaseDownload(auth.currentUser.uid, caseData.id);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(error.message || "Ошибка при генерации PDF файла");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!auth.currentUser) {
      setError("Необходимо авторизоваться для скачивания");
      return;
    }

    if (!caseData) {
      setError("Данные кейса отсутствуют");
      return;
    }

    await generatePDF();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="case-modal">
        <div className="modal-header">
          <h2>
            {isEditing
              ? "Редактировать кейс"
              : caseData
              ? "Детали кейса"
              : "Новый кейс"}
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content-scroll" ref={contentRef}>
            {error && <div className="error-message">{error}</div>}
            <div className="case-description">
              <h3>Название кейса</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="modal-input"
                  required
                />
              ) : (
                <p>{caseData?.title}</p>
              )}
            </div>

            <div className="case-description">
              <h3>Описание</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="modal-textarea"
                  required
                />
              ) : (
                <p>{caseData?.description}</p>
              )}
            </div>

            {(isEditing ||
              (caseData?.functions && caseData.functions.length > 0)) && (
              <div className="case-details">
                <h3>Основные функции</h3>
                {isEditing ? (
                  <div className="array-inputs">
                    {formData.functions.map((func, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={func}
                          onChange={(e) =>
                            handleArrayInputChange(
                              index,
                              e.target.value,
                              "functions"
                            )
                          }
                          className="modal-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(index, "functions")}
                          className="remove-button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem("functions")}
                      className="add-button"
                    >
                      + Добавить функцию
                    </button>
                  </div>
                ) : (
                  <ul>
                    {caseData?.functions?.map((func, index) => (
                      <li key={index}>{func}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(isEditing || caseData?.platform) && (
              <div className="case-details">
                <h3>Платформа</h3>
                {isEditing ? (
                  <input
                    type="text"
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  />
                ) : (
                  <p>{caseData?.platform}</p>
                )}
              </div>
            )}

            {(isEditing || caseData?.technologies) && (
              <div className="case-details">
                <h3>Технологии</h3>
                {isEditing ? (
                  <input
                    type="text"
                    name="technologies"
                    value={formData.technologies}
                    onChange={handleInputChange}
                    className="modal-input"
                    required
                  />
                ) : (
                  <p>{caseData?.technologies}</p>
                )}
              </div>
            )}

            {(isEditing || (caseData?.goals && caseData.goals.length > 0)) && (
              <div className="case-details">
                <h3>Цели</h3>
                {isEditing ? (
                  <div className="array-inputs">
                    {formData.goals.map((goal, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) =>
                            handleArrayInputChange(
                              index,
                              e.target.value,
                              "goals"
                            )
                          }
                          className="modal-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(index, "goals")}
                          className="remove-button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem("goals")}
                      className="add-button"
                    >
                      + Добавить цель
                    </button>
                  </div>
                ) : (
                  <ul>
                    {caseData?.goals?.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(isEditing ||
              (caseData?.artifacts && caseData.artifacts.length > 0)) && (
              <div className="case-details">
                <h3>Артефакты</h3>
                {isEditing ? (
                  <div className="array-inputs">
                    {formData.artifacts.map((artifact, index) => (
                      <div key={index} className="array-input-row">
                        <input
                          type="text"
                          value={artifact}
                          onChange={(e) =>
                            handleArrayInputChange(
                              index,
                              e.target.value,
                              "artifacts"
                            )
                          }
                          className="modal-input"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(index, "artifacts")}
                          className="remove-button"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem("artifacts")}
                      className="add-button"
                    >
                      + Добавить артефакт
                    </button>
                  </div>
                ) : (
                  <ul>
                    {caseData?.artifacts?.map((artifact, index) => (
                      <li key={index}>{artifact}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {(isEditing || caseData?.difficulty) && (
              <div className="case-details">
                <h3>Сложность</h3>
                {isEditing ? (
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option value="Низкая">Низкая</option>
                    <option value="Средняя">Средняя</option>
                    <option value="Высокая">Высокая</option>
                  </select>
                ) : (
                  <p>{caseData?.difficulty}</p>
                )}
              </div>
            )}

            {(isEditing || caseData?.timeLimit) && (
              <div className="case-details">
                <h3>Срок</h3>
                {isEditing ? (
                  <select
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option value="1 неделя">1 неделя</option>
                    <option value="2 недели">2 недели</option>
                    <option value="3 недели">3 недели</option>
                    <option value="1 месяц">1 месяц</option>
                  </select>
                ) : (
                  <p>{caseData?.timeLimit}</p>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isEditing ? (
              <button type="submit" className="download-button">
                Сохранить
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload();
                }}
                className="download-button"
                disabled={isGenerating}
              >
                {isGenerating ? "Генерация PDF..." : "Скачать кейс"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseModal;
