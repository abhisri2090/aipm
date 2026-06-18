import { CliLoginPanel } from "../../../components/cli-login-panel";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Authorize AIPM CLI",
  description: "Authorize the AIPM CLI for private package installs.",
  path: "/cli/login",
});

export default function CliLoginPage() {
  return <CliLoginPanel />;
}
