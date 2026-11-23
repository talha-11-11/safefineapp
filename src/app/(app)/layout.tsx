import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { GearIcon } from "@/components/icons";
import { getSettings } from "@/lib/data";
import { isOwner, pageUser, ROLE_LABEL } from "@/lib/session";
import { ensureDailyBackup } from "@/lib/backup";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, s] = await Promise.all([pageUser(), getSettings()]);
  // First visit of the day saves a start-of-day copy of all data (for "go back to yesterday")
  await ensureDailyBackup().catch((e) => console.error("Daily backup failed:", e));
  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-10 bg-brand text-white">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 lg:max-w-5xl">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image src="/logo.png" alt="" width={40} height={40} className="rounded-full bg-white" priority />
            <span className="min-w-0">
              <span className="block truncate text-lg font-bold leading-tight">{s.businessName}</span>
              <span className="block truncate text-xs text-brand-light">
                {[user.name || user.username, ROLE_LABEL[user.role] ?? user.role].filter((v, i, a) => a.indexOf(v) === i).join(" · ")}
              </span>
            </span>
          </Link>
          <Link href={isOwner(user) ? "/settings" : "/me"} aria-label={isOwner(user) ? "Settings" : "My account"} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-brand-dark">
            <GearIcon />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pt-4 lg:max-w-5xl">{children}</main>
      <BottomNav owner={isOwner(user)} />
    </div>
  );
}
