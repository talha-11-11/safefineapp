import Link from "next/link";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import RouteList, { type RouteRow } from "@/components/RouteList";
import { balances, getSettings, pricesFor, societies } from "@/lib/data";
import { addDays, isValidDate, pkToday, shortDate } from "@/lib/dates";
import { rs } from "@/lib/format";
import { isOwner, pageUser } from "@/lib/session";

const ALL = "__all";

export default async function RoutePage({ searchParams }: { searchParams: Promise<{ s?: string; date?: string }> }) {
  const me = await pageUser();
  const owner = isOwner(me);
  const sp = await searchParams;
  const today = pkToday();
  // Riders always work on today; the owner can enter past days
  const date = owner && sp.date && isValidDate(sp.date) && sp.date <= today ? sp.date : today;
  const allSocieties = await societies();
  const society = sp.s === ALL ? ALL : sp.s && allSocieties.includes(sp.s) ? sp.s : allSocieties[0];

  const s = await getSettings();
  const [list, dayDeliveries, allActive, bal, paidToday, lastPay] = await Promise.all([
    db.select().from(schema.customers)
      .where(society === ALL ? eq(schema.customers.active, true) : and(eq(schema.customers.active, true), eq(schema.customers.society, society)))
      .orderBy(asc(schema.customers.society), asc(schema.customers.address), asc(schema.customers.name)),
    db.select().from(schema.deliveries).where(eq(schema.deliveries.date, date)),
    db.select({ id: schema.customers.id, society: schema.customers.society })
      .from(schema.customers).where(eq(schema.customers.active, true)),
    balances(),
    db.select({ customerId: schema.payments.customerId, n: sql<string>`sum(${schema.payments.amount})` })
      .from(schema.payments).where(eq(schema.payments.date, date)).groupBy(schema.payments.customerId),
    db.select({ customerId: schema.payments.customerId, last: sql<string>`max(${schema.payments.date})` })
      .from(schema.payments).groupBy(schema.payments.customerId),
  ]);
  const byCustomer = new Map(dayDeliveries.map((d) => [d.customerId, d]));
  const paid = new Map(paidToday.map((p) => [p.customerId, Number(p.n)]));
  const lastPaid = new Map(lastPay.map((p) => [p.customerId, p.last]));
  const bottles = dayDeliveries.reduce((n, d) => n + d.std + d.disp, 0);
  const amount = dayDeliveries.reduce((n, d) => n + d.amount, 0);
  const cashToday = paidToday.reduce((n, p) => n + Number(p.n), 0);
  const counts = new Map<string, number>();
  for (const c of allActive) counts.set(c.society, (counts.get(c.society) ?? 0) + 1);

  // "Collect payment" hint by payment plan
  const collectDue = (plan: string, balance: number, last: string | undefined) => {
    if (balance <= 0) return false;
    if (plan === "daily") return true;
    const days = plan === "weekly" ? 7 : 30;
    return !last || last <= addDays(today, -days);
  };

  const rows: RouteRow[] = list.map((c) => {
    const d = byCustomer.get(c.id);
    const balance = bal.get(c.id) ?? 0;
    return {
      id: c.id, name: c.name, address: c.address, society: c.society, phone: c.phone,
      price: pricesFor(c, s).std,
      bottles: d ? d.std + d.disp : c.defaultStd,
      delivered: !!d, deliveredAmount: d?.amount ?? 0,
      paidToday: paid.get(c.id) ?? 0,
      balance,
      plan: (c.paymentPlan as RouteRow["plan"]) ?? "monthly",
      collect: collectDue(c.paymentPlan, balance, lastPaid.get(c.id)),
      startingCans: c.startingCans,
    };
  });
  const qs = (extra: Record<string, string>) =>
    "?" + new URLSearchParams({ ...(date !== today ? { date } : {}), ...extra }).toString();
  const tabs = [{ key: ALL, label: "All areas", n: allActive.length }, ...allSocieties.map((n) => ({ key: n, label: n, n: counts.get(n) ?? 0 }))];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-brand p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-brand-light">{date === today ? "Today" : "Back entry"} · {shortDate(date)}</p>
            <h1 className="text-2xl font-bold">Route</h1>
          </div>
          {owner && (
            <form className="flex items-center gap-2">
              {society && <input type="hidden" name="s" value={society} />}
              <label htmlFor="date" className="sr-only">Date</label>
              <input id="date" type="date" name="date" defaultValue={date} max={today}
                className="h-11 rounded-xl bg-white px-2 text-sm text-slate-900" />
              <button className="h-11 rounded-xl bg-brand-dark px-3 text-sm font-semibold">Go</button>
            </form>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Homes" value={`${dayDeliveries.length}/${allActive.length}`} />
          <Stat label="Bottles" value={String(bottles)} />
          <Stat label={owner ? "Sales" : "Cash today"} value={rs(owner ? amount : cashToday)} />
        </div>
      </section>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Areas">
        {tabs.map((t) => (
          <Link key={t.key} href={qs({ s: t.key })} aria-current={t.key === society ? "page" : undefined}
            className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${t.key === society ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {t.label} · {t.n}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="text-slate-600">No customers here yet.</p>
          {owner && <Link href="/customers/new" className="btn-primary mt-3">Add customer</Link>}
        </div>
      ) : (
        <RouteList key={`${date}-${society}`} rows={rows} date={date} business={s.businessName} showArea={society === ALL} canBackdate={owner} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-dark px-3 py-2">
      <p className="text-xs text-brand-light">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
