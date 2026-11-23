"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addPayment, deleteDelivery, saveDelivery } from "@/app/actions";
import { deliveryMessage, waLink } from "@/lib/messages";
import { ChatIcon, CheckIcon } from "./icons";

export type RouteRow = {
  id: number; name: string; address: string; society: string; phone: string;
  price: number; bottles: number; delivered: boolean; deliveredAmount: number;
  paidToday: number;
  balance: number; // balance right now (includes today's delivery and cash, if any)
  plan: "daily" | "weekly" | "monthly"; collect: boolean; startingCans: number;
};

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-US")}`;
const PLAN: Record<string, { label: string; cls: string }> = {
  daily: { label: "Daily payer", cls: "bg-amber-100 text-amber-900" },
  weekly: { label: "Weekly payer", cls: "bg-sky-100 text-sky-900" },
  monthly: { label: "Monthly payer", cls: "bg-slate-100 text-slate-700" },
};

export default function RouteList({ rows, date, business, showArea, canBackdate }: {
  rows: RouteRow[]; date: string; business: string; showArea: boolean; canBackdate: boolean;
}) {
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? rows.filter((r) => `${r.name} ${r.address} ${r.society}`.toLowerCase().includes(t)) : rows;
  }, [q, rows]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  return (
    <>
      <div className="sticky top-[64px] z-[5] -mx-4 bg-[#f1f5f9] px-4 py-2">
        <label htmlFor="route-search" className="sr-only">Search customer</label>
        <input id="route-search" className="input" type="search" placeholder="Search customer name or house…"
          value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      </div>
      <ul className="grid gap-3 lg:grid-cols-2">
        {shown.map((r) => <Row key={r.id} row={r} date={date} business={business} showArea={showArea} onDone={flash} />)}
        {shown.length === 0 && <li className="card p-6 text-center text-slate-600">No customer found for &ldquo;{q}&rdquo;.</li>}
      </ul>
      {!canBackdate && <p className="pt-2 text-center text-xs text-slate-600">Entries are saved for today.</p>}
      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-20 z-30 mx-auto max-w-md rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

function Row({ row, date, business, showArea, onDone }: {
  row: RouteRow; date: string; business: string; showArea: boolean; onDone: (m: string) => void;
}) {
  const [bottles, setBottles] = useState(row.bottles);
  const [editing, setEditing] = useState(!row.delivered);
  const amount = bottles * row.price;
  // Balance before today's delivery (today's cash already counted in row.balance)
  const baseBalance = row.balance - (row.delivered ? row.deliveredAmount : 0);
  const due = baseBalance + amount; // what the customer owes if this delivery is saved
  const [cash, setCash] = useState(row.delivered ? "" : row.plan === "daily" ? String(Math.max(0, Math.min(due, amount))) : "");
  const [pending, start] = useTransition();
  const cashNum = Number(cash) || 0;
  const after = due - cashNum;
  const delivered = row.delivered && !editing;

  const message = (paid: number, bal: number, n: number) =>
    deliveryMessage({ date, bottles: n, paid, balance: bal, business });

  const deliver = () => {
    // Open WhatsApp inside the tap (browsers block it after an await), then save
    window.open(waLink(row.phone, message(cashNum, after, bottles)), "_blank", "noopener");
    start(async () => {
      try {
        await saveDelivery({ customerId: row.id, date, std: bottles, disp: 0 });
        if (cashNum > 0) await addPayment({ customerId: row.id, amount: cashNum, method: "cash", date });
        setEditing(false);
        setCash("");
        onDone(`Saved: ${row.name} · ${bottles} bottles${cashNum ? ` · cash ${rs(cashNum)}` : ""} · balance ${rs(after)}`);
      } catch (e) {
        onDone(e instanceof Error && e.message.includes("Riders") ? e.message : "Not saved. Check internet and try again.");
      }
    });
  };
  const takeCash = () => {
    if (!cashNum) return;
    start(async () => {
      try {
        await addPayment({ customerId: row.id, amount: cashNum, method: "cash", date });
        setCash("");
        onDone(`Cash ${rs(cashNum)} from ${row.name} · balance ${rs(row.balance - cashNum)}`);
      } catch {
        onDone("Not saved. Check internet and try again.");
      }
    });
  };
  const undo = () =>
    start(async () => {
      await deleteDelivery(row.id, date);
      setEditing(true);
      onDone(`Removed delivery for ${row.name}`);
    });

  const plan = PLAN[row.plan] ?? PLAN.monthly;
  return (
    <li className="card space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/customers/${row.id}`} className="block truncate text-base font-semibold text-slate-900 hover:underline">{row.name}</Link>
          <p className="truncate text-sm text-slate-600">{showArea ? `${row.society} · ` : ""}{row.address || "—"}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${plan.cls}`}>{plan.label}</span>
            {row.collect && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-800">Collect payment</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-600">{row.balance >= 0 ? "Balance" : "Advance"}</p>
          <p className={`text-lg font-bold ${row.balance > 0 ? "text-red-700" : "text-green-700"}`}>{rs(Math.abs(row.balance))}</p>
          {row.delivered && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800"><CheckIcon /> Delivered</span>
          )}
        </div>
      </div>

      {delivered ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
            <span>{bottles} bottles · <b>{rs(row.deliveredAmount)}</b>{row.paidToday ? ` · paid ${rs(row.paidToday)}` : ""}</span>
            <div className="flex gap-2">
              <button className="btn-outline h-9 px-3" aria-label={`Send WhatsApp to ${row.name} again`}
                onClick={() => window.open(waLink(row.phone, message(row.paidToday, row.balance, bottles)), "_blank", "noopener")}>
                <ChatIcon className="size-4" />
              </button>
              <button className="btn-outline h-9 px-3" onClick={() => setEditing(true)} disabled={pending}>Edit</button>
              <button className="btn-outline h-9 px-3" onClick={undo} disabled={pending}>Undo</button>
            </div>
          </div>
          <CashBox cash={cash} setCash={setCash} chips={[{ label: "Full balance", value: row.balance }]} id={row.id} />
          <button className="btn-outline w-full" onClick={takeCash} disabled={pending || !cashNum}>Save cash {cashNum ? rs(cashNum) : ""}</button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Bottles (19L)</p>
              <p className="text-xs text-slate-600">{rs(row.price)} each{row.startingCans ? ` · has ${row.startingCans} empty` : ""}</p>
            </div>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-300">
              <button type="button" aria-label="One bottle less" className="size-11 bg-slate-50 text-xl" onClick={() => setBottles(Math.max(0, bottles - 1))}>−</button>
              <span className="w-10 text-center text-lg font-bold" aria-live="polite">{bottles}</span>
              <button type="button" aria-label="One bottle more" className="size-11 bg-slate-50 text-xl" onClick={() => setBottles(Math.min(50, bottles + 1))}>+</button>
            </div>
          </div>
          <CashBox cash={cash} setCash={setCash} id={row.id}
            chips={[{ label: "This delivery", value: amount }, ...(due > amount ? [{ label: "Full balance", value: due }] : [])]} />
          <p className="text-sm text-slate-700">
            Bill {rs(amount)}{cashNum ? ` − cash ${rs(cashNum)}` : ""} → balance <b className={after > 0 ? "text-red-700" : "text-green-700"}>{rs(after)}</b>
          </p>
          <button className="btn-primary w-full" onClick={deliver} disabled={pending || bottles === 0}>
            {pending ? "Saving…" : <><ChatIcon className="size-4" /> Deliver &amp; WhatsApp</>}
          </button>
        </>
      )}
    </li>
  );
}

function CashBox({ cash, setCash, chips, id }: {
  cash: string; setCash: (v: string) => void; chips: { label: string; value: number }[]; id: number;
}) {
  return (
    <div className="space-y-2 rounded-xl bg-brand-tint p-3">
      <label htmlFor={`cash-${id}`} className="text-sm font-semibold">Cash received (Rs)</label>
      <input id={`cash-${id}`} className="input" inputMode="numeric" placeholder="0" value={cash}
        onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} />
      <div className="flex flex-wrap gap-2">
        {chips.filter((c) => c.value > 0).map((c) => (
          <button key={c.label} type="button" onClick={() => setCash(String(c.value))}
            className={`h-9 rounded-lg border px-3 text-sm font-semibold ${Number(cash) === c.value ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-700"}`}>
            {c.label} · {rs(c.value)}
          </button>
        ))}
        {cash && <button type="button" onClick={() => setCash("")} className="h-9 rounded-lg px-3 text-sm font-semibold text-slate-600">No cash</button>}
      </div>
    </div>
  );
}
