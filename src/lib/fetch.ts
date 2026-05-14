const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36";

export const fetchWithUA = (url: string, signal?: AbortSignal) => fetch(url, { headers: { "User-Agent": UA }, signal });
