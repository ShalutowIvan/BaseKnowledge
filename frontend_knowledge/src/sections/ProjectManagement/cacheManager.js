

class ProjectCache {
  constructor() {
    this.cache = new Map();    
  }

  get(project_id) {
    const cacheKey = `project_${project_id}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {return null};

    // Проверяем TTL (5 минут)
    const isExpired = Date.now() - cached.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    console.log('📁 Используем кеш проекта', project_id);
    return cached.data;
  }

  set(project_id, data) {
    const cacheKey = `project_${project_id}`;
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Сохранили в кеш проекта', project_id);
  }

  delete(project_id) {
    const cacheKey = `project_${project_id}`;
    this.cache.delete(cacheKey);
    console.log('🧹 Очистили кеш проекта', project_id);
  }

  clear() {
    console.log('Очистили кеш проекта через полную очистку!!!');
    this.cache.clear();
  }

  // Для дебаггинга
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Глобальный экземпляр только для проектов
export const projectCache = new ProjectCache();