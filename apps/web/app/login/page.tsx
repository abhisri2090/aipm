import { LoginPanel } from "../../components/dashboard-ui";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Publisher Login",
  description: "Sign in to AIPM with GitHub to publish AI skill packages.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginPanel />;
}
