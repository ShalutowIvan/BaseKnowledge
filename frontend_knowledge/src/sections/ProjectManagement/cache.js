// простой глобальный кеш в памяти
export const projectCache = new Map();

// helpers
export const getCachedProject = (id) => projectCache.get(id); 
export const setCachedProject = (id, data) => projectCache.set(id, data);
export const clearCachedProject = (id) => projectCache.delete(id);
export const clearAllProjects = () => projectCache.clear();
