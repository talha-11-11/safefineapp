import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { addPaymentForm, deletePayment } from "@/app/actions";
import { BackIcon, ChatIcon } from "@/components/icons";
import { customerBalance, getSettings, pricesFor } from "@/lib/data";
import { monthLabel, monthOf, monthStart, nextMonthStart, pkToday, shortDate } from "@/lib/dates";
import { cansText, displayPhone, PLAN_LABEL, rs } from "@/lib/format";
import { paymentLines, waLink } from "@/lib/messages";
import { isOwner, pageUser } from "@/lib/session";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const me = await pageUser();
  const owner = isOwner(me);
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
  if (!c) notFound();

  const today = pkToday();
  const m = monthOf(today);
  const s = await getSettings();
  const [balance, monthDeliveries, recentPayments, billRows] = await Promise.all([
    customerBalance(id),
    db.select().from(schema.deliveries)
      .where(and(eq(schema.deliveries.customerId, id), gte(schema.deliveries.date, monthStart(m)), lt(schema.deliveries.date, nextMonthStart(m))))
      .orderBy(desc(schema.deliveries.date)),
    db.select().from(schema.payments).where(eq(schema.payments.customerId, id)).orderBy(desc(schema.payments.date), desc(schema.payments.id)).limit(10),
    db.select().from(schema.bills).where(eq(schema.bills.customerId, id)).orderBy(desc(schema.bills.month)).limit(6),
  ]);
  const p = pricesFor(c, s);
  const mStd = monthDeliveries.reduce((n, d) => n + d.std, 0);
  const mDisp = monthDeliveries.reduce((n, d) => n + d.disp, 0);
  const mAmt = monthDeliveries.reduce((n, d) => n + d.amount, 0);

  // Balance reminder from the owner's / rider's own WhatsApp
  const pay = paymentLines(s);
  const shareText = [
    `Assalam o Alaikum ${c.name}!`,
    balance > 0 ? `Aap ka baqaya: ${rs(balance)}` : "Aap ka hisaab clear hai.",
    `${monthLabel(m)}: ${mStd + mDisp} bottle = ${rs(mAmt)}`,
    ...(balance > 0 && pay.length ? pay : []),
    `Shukriya, ${s.businessName}`,
  ].join("\n");
  const shareLink = waLink(c.phone, shareText);

  return (
    <div className="space-y-4">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm font-semibold text-brand"><BackIcon /> Customers</Link>

      <section className="card space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{c.name}</h1>
            <p className="text-slate-600">{c.society}{c.address ? ` · ${c.address}` : ""}</p>
            <p className="text-slate-600">{displayPhone(c.phone)}</p>
          </div>
          {owner && <Link href={`/customers/${c.id}/edit`} className="btn-outline">Edit</Link>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-3 ${balance > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-xs font-medium text-slate-600">{balance >= 0 ? "Owes" : "Advance"}</p>
            <p className={`text-xl font-bold ${balance > 0 ? "text-red-700" : "text-green-700"}`}>{rs(Math.abs(balance))}</p>
          </div>
          <div className="rounded-xl bg-brand-tint p-3">
            <p className="text-xs font-medium text-slate-600">{monthLabel(m)}</p>
            <p className="text-xl font-bold text-brand-ink">{rs(mAmt)}</p>
            <p className="text-xs text-slate-600">{cansText(mStd, mDisp)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          <b>{PLAN_LABEL[c.paymentPlan] ?? "Monthly payer"}</b> · Usual: {c.defaultStd} bottles · Rate: Rs {p.std}{c.priceStd != null && " (special)"}
          {c.startingCans > 0 && <> · {c.startingCans} empty bottles given</>}
        </p>
        <a href={shareLink} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
          <ChatIcon /> Send balance on WhatsApp
        </a>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Receive payment</h2>
        <form action={addPaymentForm} className="space-y-3">
          <input type="hidden" name="customerId" value={c.id} />
          <input type="hidden" name="redirect" value={`/customers/${c.id}`} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="amount" className="label">Amount (Rs)</label>
              <input id="amount" name="amount" type="number" min={1} required defaultValue={balance > 0 ? balance : ""} className="input" />
            </div>
            <div>
              <label htmlFor="method" className="label">Method</label>
              <select id="method" name="method" className="input">
                <option value="cash">Cash</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="bank">Bank</option>
              </select>
            </div>
          </div>
          <button className="btn-primary w-full">Save payment</button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Deliveries this month</h2>
        {monthDeliveries.length === 0 ? <p className="text-sm text-slate-600">None yet.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {monthDeliveries.map((d) => (
              <li key={d.id} className="flex justify-between py-2">
                <span>{shortDate(d.date)} · {cansText(d.std, d.disp)}</span>
                <span className="font-medium">{rs(d.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Recent payments</h2>
        {recentPayments.length === 0 ? <p className="text-sm text-slate-600">No payments yet.</p> : (
          <ul className="divide-y divide-slate-100 text-sm">
            {recentPayments.map((pm) => (
              <li key={pm.id} className="flex items-center justify-between gap-2 py-2">
                <span>{shortDate(pm.date)} · {pm.method}{pm.createdBy ? ` · ${pm.createdBy}` : ""}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium text-green-700">{rs(pm.amount)}</span>
                  {owner && (
                    <form action={deletePayment}>
                      <input type="hidden" name="id" value={pm.id} />
                      <button className="h-9 rounded-lg px-2 text-xs font-semibold text-red-700 hover:bg-red-50" aria-label={`Delete payment of ${rs(pm.amount)}`}>Delete</button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {owner && billRows.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">Bills</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {billRows.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span>{monthLabel(b.month)}{b.sentAt ? " · sent" : ""}</span>
                <a className="font-semibold text-brand hover:underline" href={`/api/bills/${b.id}/pdf`} target="_blank">{rs(b.totalDue)} · PDF</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
