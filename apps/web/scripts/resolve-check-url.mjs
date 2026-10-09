/** Build a local verify URL without stuffing `?query` into the pathname. */
export function resolveCheckUrl(base, path) {
  const origin = new URL(base);
  const target = new URL(path, "https://verify.invalid");
  const prefix = origin.pathname.replace(/\/+$/, "");
  const pathname = `${prefix}${target.pathname}`.replace(/\/{2,}/g, "/") || "/";
  const url = new URL(origin.href);
  url.pathname = pathname;
  url.search = target.search;
  url.hash = target.hash;
  return url;
}
