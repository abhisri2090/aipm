import { notFound } from "next/navigation";

export const MAX_DIRECTORY_PAGE = 1000;

export function directoryPageNumber(value: string | undefined): number {
  if (value === undefined) return 1;
  if (!/^[1-9]\d*$/.test(value)) notFound();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > MAX_DIRECTORY_PAGE) notFound();
  return number;
}

export function directoryPagePath(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export async function loadCursorDirectoryPage<T>(
  pageNumber: number,
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>,
): Promise<{ items: T[]; nextCursor: string | null }> {
  let cursor: string | null = null;
  const seen = new Set<string>();
  for (let current = 1; current <= pageNumber; current += 1) {
    const page = await fetchPage(cursor);
    if (current === pageNumber) {
      if (current > 1 && page.items.length === 0) notFound();
      return page;
    }
    if (!page.nextCursor) notFound();
    if (seen.has(page.nextCursor)) throw new Error("Directory cursor did not advance");
    seen.add(page.nextCursor);
    cursor = page.nextCursor;
  }
  notFound();
}
