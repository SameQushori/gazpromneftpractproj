// Кэш для хранения сгенерированных PDF
const pdfCache = new Map();

// Время жизни кэша (24 часа)
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Очистка старых записей кэша
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of pdfCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      pdfCache.delete(key);
    }
  }
};

// Запускаем очистку кэша каждый час
setInterval(cleanupCache, 60 * 60 * 1000);

export const getCachedPDF = (caseId) => {
  const cached = pdfCache.get(caseId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

export const setCachedPDF = (caseId, pdfData) => {
  pdfCache.set(caseId, {
    data: pdfData,
    timestamp: Date.now(),
  });
};

export const clearCache = () => {
  pdfCache.clear();
};
