import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { setUserActive, setUserRole } from "@/app/actions";
import { BackIcon } from "@/components/icons";
import { NewUserForm, ResetPasswordForm } from "@/components/UserForms";
import { pageUser, ROLE_LABEL } from "@/lib/session";

// Owner (and PokitBio super admin): add staff, assign Owner/Rider, reset passwords, block
export default async function StaffPage() {
  const me = await pageUser("owner");
  const all = await db.select().from(schema.users).orderBy(asc(schema.users.role), asc(schema.users.username));
  // Owners don't see or touch the PokitBio super admin login
  const list = me.role === "superadmin" ? all : all.filter((u) => u.role !== "superadmin");

  return (
    <div className="space-y-4">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><BackIcon /> Settings</Link>
      <h1 className="text-2xl font-bold">Staff</h1>
      <div className="card space-y-1 p-4 text-sm text-slate-700">
        <p><b>Owner:</b> everything: route, customers, payments, bills, dashboard, settings and staff.</p>
        <p><b>Rider:</b> delivers on the route, takes cash, sees customers and their balance, and sees their own day. Can&apos;t see bills, reports or settings.</p>
      </div>

      <ul className="space-y-3">
        {list.map((u) => (
          <li key={u.id} className="card space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{u.name || u.username} {u.id === me.id && <span className="text-xs text-slate-600">(you)</span>}</p>
                <p className="text-sm text-slate-600">@{u.username} · {ROLE_LABEL[u.role] ?? u.role}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}>
                {u.active ? "Active" : "Blocked"}
              </span>
            </div>
            {u.id !== me.id && u.role !== "superadmin" && (
              <form action={setUserRole} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="role" value={u.role === "rider" ? "admin" : "rider"} />
                <button className="btn-outline h-10 flex-1">Make {u.role === "rider" ? "Owner" : "Rider"}</button>
              </form>
            )}
            <ResetPasswordForm id={u.id} username={u.username} />
            {u.id !== me.id && (
              <form action={setUserActive}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                <button className={u.active ? "btn-danger w-full" : "btn-outline w-full"}>
                  {u.active ? "Block this login" : "Unblock this login"}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <NewUserForm allowSuper={me.role === "superadmin"} />
    </div>
  );
}
