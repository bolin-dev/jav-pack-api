export const fetchWithUA = (input: RequestInfo | URL, init?: RequestInit<RequestInitCfProperties>) => {
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers instanceof Headers ? Object.fromEntries(init.headers) : (init?.headers ?? {})),
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36",
    },
  });
};
