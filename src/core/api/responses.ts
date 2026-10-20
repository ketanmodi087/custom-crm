export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const jsonOk = <T>(data: T, init?: ResponseInit) =>
  Response.json(data, {
    status: init?.status ?? 200,
    ...init,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...init?.headers,
    },
  });

export const jsonError = (
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) =>
  Response.json(
    { error: { code, message, details } } satisfies ApiErrorBody,
    { status },
  );

export const getPagination = (searchParams: URLSearchParams) => {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? "20") || 20),
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
};

export const getSearch = (searchParams: URLSearchParams) =>
  (searchParams.get("q") ?? "").trim();
