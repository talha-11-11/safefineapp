import LoginForm from "@/components/LoginForm";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const s = await getSettings().catch(() => null);
  return <LoginForm businessName={s?.businessName ?? "Water delivery"} />;
}
