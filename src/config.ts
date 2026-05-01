const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim() || '';
const normalizedApiBase = rawApiBase.replace(/\/+$/, '');
export const API_BASE_URL = normalizedApiBase;
