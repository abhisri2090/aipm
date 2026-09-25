import Link from "next/link";
import { tokenizeGuideInline } from "../lib/guide-inline";

export function GuideInline({ text }: { text: string }) {
  return (
    <>
      {tokenizeGuideInline(text).map((token, index) => {
        if (token.kind === "code") return <code key={index}>{token.value}</code>;
        if (token.kind === "link") {
          if (token.href.startsWith("/") || token.href.startsWith("#")) {
            return (
              <Link href={token.href} key={index}>
                {token.label}
              </Link>
            );
          }
          return (
            <a href={token.href} key={index} rel="noreferrer" target="_blank">
              {token.label}
            </a>
          );
        }
        return token.value;
      })}
    </>
  );
}
