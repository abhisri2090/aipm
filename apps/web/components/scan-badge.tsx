import { scanBadgeLabel, type ScanStatus } from "../lib/registry";
import cards from "../app/cards.module.css";

export function ScanBadge({ status }: { status: ScanStatus | undefined }) {
  const label = scanBadgeLabel(status);
  const pillClass = status === "flagged" ? cards.pillFlagged : cards.pill;
  return (
    <span className={pillClass} title="Automated check for secrets, prompt-injection patterns, and suspicious network or filesystem actions. Does not guarantee the package or prompt is safe.">
      {label}
    </span>
  );
}
