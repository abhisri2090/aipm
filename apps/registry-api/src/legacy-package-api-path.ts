export function rewriteLegacyPackageApiPath(url: string): string {
  const q = url.indexOf("?");
  const pathname = q === -1 ? url : url.slice(0, q);
  const search = q === -1 ? "" : url.slice(q);
  const rewritten = pathname
    .replace(/^\/v1\/packages(?=\/|$)/, "/v1/skills")
    .replace(/^\/v1\/admin\/packages(?=\/|$)/, "/v1/admin/skills")
    .replace(/^(\/v1\/orgs\/[^/]+)\/packages(?=\/|$)/, "$1/skills");
  return `${rewritten}${search}`;
}
