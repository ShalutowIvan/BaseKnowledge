// Глобальное состояние для управления обновлением токенов
let isRefreshing = false;
let refreshPromise = null;

// Получить текущее состояние обновления
const getRefreshState = () => ({
  isRefreshing,
  refreshPromise
});

// Установить новое состояние обновления
const setRefreshState = (refreshing, promise = null) => {
  isRefreshing = refreshing;
  refreshPromise = promise;
};

export {getRefreshState, setRefreshState}