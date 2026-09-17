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
