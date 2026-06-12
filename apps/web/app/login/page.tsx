import { LoginPanel } from "../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publisher Login",
  description: "Sign in to AIPM with GitHub or email verification code to publish AI skill packages.",
  path: "/login",
});

export default function LoginPage() {
  return <LoginPanel />;
}
