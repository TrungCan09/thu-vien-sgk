const booksApiBaseUrl = import.meta.env.VITE_BOOKS_API_BASE_URL?.replace(/\/+$/u, "") ?? "";

export function getBookUrl(id: string, options: { download?: boolean } = {}) {
  const url = `${booksApiBaseUrl}/api/books/${encodeURIComponent(id)}`;
  return options.download ? `${url}?download=1` : url;
}
