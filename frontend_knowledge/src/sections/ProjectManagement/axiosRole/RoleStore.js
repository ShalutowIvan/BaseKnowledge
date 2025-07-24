import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode'; // Библиотека для декодирования JWT

// Создаем хранилище для аутентификации
const useRoleStore = create((set) => ({
  role: null, // Изначально роль не установлена
  // token: null, // Сам токен (опционально)
  
  // Функция для установки токена и извлечения роли
  setRole: (token) => {
    try {
      // Декодируем JWT токен
      const decoded = jwtDecode(token);
      
      // Предполагаем, что роль хранится в поле 'role' payload JWT
      // В реальном приложении уточните структуру вашего токена
      const userRole = decoded.role;
      
      // Обновляем состояние
      set({ 
        role: userRole,
        // token: token 
      });
    } catch (error) {
      console.error('Ошибка декодирования токена:', error);
      // set({ role: null, token: null });
      set({ role: null });
    }
  },
  
  // Функция для очистки состояния при выходе
  clearAuth: () => set({ role: null }),
}));

export { useRoleStore };