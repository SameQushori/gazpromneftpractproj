// Ограничение количества запросов
const MAX_REQUESTS = 10; // Максимальное количество запросов
const TIME_WINDOW = 60 * 1000; // Временное окно (1 минута)

// Хранилище для отслеживания запросов
const requestStore = new Map();

export const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRequests = requestStore.get(userId) || [];

  // Удаляем старые запросы
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < TIME_WINDOW
  );

  // Проверяем лимит
  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }

  // Добавляем новый запрос
  recentRequests.push(now);
  requestStore.set(userId, recentRequests);

  return true;
};

// Очистка старых запросов
setInterval(() => {
  const now = Date.now();
  for (const [userId, requests] of requestStore.entries()) {
    const recentRequests = requests.filter(
      (timestamp) => now - timestamp < TIME_WINDOW
    );
    if (recentRequests.length === 0) {
      requestStore.delete(userId);
    } else {
      requestStore.set(userId, recentRequests);
    }
  }
}, TIME_WINDOW);
