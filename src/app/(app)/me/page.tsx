import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { logout } from "@/app/actions";
import { ChangePasswordForm } from "@/components/UserForms";
import { pkToday, shortDate } from "@/lib/dates";
import { rs } from "@/lib/format";
import { pageUser, ROLE_LABEL } from "@/lib/session";

// Rider's own day: bottles delivered and cash collected by this login today
export default async function MyDayPage() {
  const me = await pageUser();
  const today = pkToday();
  const [dels, pays] = await Promise.all([
    db.select({ d: schema.deliveries, name: schema.customers.name, society: schema.customers.society })
      .from(schema.deliveries).innerJoin(schema.customers, eq(schema.customers.id, schema.deliveries.customerId))
      .where(and(eq(schema.deliveries.date, today), eq(schema.deliveries.createdBy, me.username)))
      .orderBy(desc(schema.deliveries.id)),
    db.select({ p: schema.payments, name: schema.customers.name })
      .from(schema.payments).innerJoin(schema.customers, eq(schema.customers.id, schema.payments.customerId))
      .where(and(eq(schema.payments.date, today), eq(schema.payments.createdBy, me.username)))
      .orderBy(desc(schema.payments.id)),
  ]);
  const bottles = dels.reduce((n, x) => n + x.d.std + x.d.disp, 0);
  const cash = pays.reduce((n, x) => n + x.p.amount, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My day · {shortDate(today)}</h1>
      <p className="text-sm text-slate-600">{me.name || me.username} · {ROLE_LABEL[me.role] ?? me.role}</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="card p-3"><p className="text-xs text-slate-600">Homes</p><p className="text-xl font-bold">{dels.length}</p></div>
        <div className="card p-3"><p className="text-xs text-slate-600">Bottles</p><p className="text-xl font-bold">{bottles}</p></div>
        <div className="card p-3"><p className="text-xs text-slate-600">Cash with me</p><p className="text-xl font-bold text-green-700">{rs(cash)}</p></div>
      </div>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Cash collected</h2>
        {pays.length === 0 ? <p className="text-sm text-slate-600">No cash yet today.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {pays.map(({ p, name }) => (
              <li key={p.id} className="flex justify-between py-2"><span>{name}</span><b className="text-green-700">{rs(p.amount)}</b></li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Deliveries</h2>
        {dels.length === 0 ? <p className="text-sm text-slate-600">No deliveries yet today.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {dels.map(({ d, name, society }) => (
              <li key={d.id} className="flex justify-between py-2"><span>{name} <span className="text-slate-600">· {society}</span></span><span>{d.std + d.disp} bottles</span></li>
            ))}
          </ul>
        )}
      </section>

      <ChangePasswordForm />
      <form action={logout}>
        <button className="btn-outline w-full">Log out ({me.username})</button>
      </form>
    </div>
  );
}
