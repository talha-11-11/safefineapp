"use client";

import { useActionState } from "react";
import { saveCustomer } from "@/app/actions";
import type { Customer } from "@/db/schema";

export default function CustomerForm({ customer, societies, defaults }: {
  customer?: Customer; societies: string[]; defaults: { priceStd: number; priceDisp: number };
}) {
  const [state, action, pending] = useActionState(saveCustomer, undefined);
  const c = customer;
  return (
    <form action={action} className="card space-y-4 p-4">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Name" name="name" defaultValue={c?.name} required />
      <Field label="WhatsApp number" name="phone" defaultValue={c ? `0${c.phone.slice(2)}` : ""} placeholder="0300-1234567" inputMode="tel" required />
      <div>
        <label htmlFor="society" className="label">Society</label>
        <input id="society" name="society" list="society-list" defaultValue={c?.society} required className="input" />
        <datalist id="society-list">{societies.map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <Field label="House / street" name="address" defaultValue={c?.address} placeholder="A-Block, House 112" />
      <fieldset>
        <legend className="label">How does this customer pay?</legend>
        <div className="grid grid-cols-3 gap-2">
          {[["daily", "Daily payer"], ["weekly", "Weekly payer"], ["monthly", "Monthly payer"]].map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-2 py-3 text-center text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white">
              <input type="radio" name="paymentPlan" value={v} defaultChecked={(c?.paymentPlan ?? "monthly") === v} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-600">Daily: pays at each delivery. Weekly and monthly: the route shows &ldquo;Collect payment&rdquo; when it&apos;s time.</p>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Usual bottles per delivery" name="defaultStd" type="number" min={0} defaultValue={c?.defaultStd ?? 1} />
        <Field label="Empty bottles given at start" name="startingCans" type="number" min={0} defaultValue={c?.startingCans ?? 0} />
      </div>
      <details className="rounded-xl bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Special rate &amp; old balance</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={`Bottle rate (default ${defaults.priceStd})`} name="priceStd" type="number" min={0} defaultValue={c?.priceStd ?? ""} />
          <Field label="Old balance when added (Rs)" name="openingBalance" type="number" defaultValue={c?.openingBalance ?? 0} />
        </div>
      </details>
      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea id="notes" name="notes" defaultValue={c?.notes} rows={2} className="input h-auto py-2" />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="size-5" /> Active (shows on route)
      </label>
      {state?.error && <p className="text-sm font-medium text-red-700" role="alert">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? "Saving…" : "Save customer"}</button>
    </form>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} className="input" {...rest} />
    </div>
  );
}
