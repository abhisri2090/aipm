export function linkifyPlainText(text: string): Array<string | { href: string; label: string }> {
  const pattern = /(https?:\/\/[^\s<>"']+)/gi;
  const parts: Array<string | { href: string; label: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    const href = match[0].replace(/[),.;!?]+$/g, "");
    const trailing = match[0].slice(href.length);
    parts.push({ href, label: href });
    if (trailing) parts.push(trailing);
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : [text];
}
