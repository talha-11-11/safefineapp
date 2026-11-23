"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "@/app/actions";
import { ChatIcon } from "@/components/icons";

export default function LoginForm({ businessName }: { businessName: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand px-6 py-8">
      <form action={action} className="card w-full max-w-sm space-y-5 p-6">
        <div className="flex flex-col items-center gap-3">
          <Image src="/logo.png" alt="" width={96} height={96} priority />
          <h1 className="text-center text-xl font-bold">{businessName}</h1>
        </div>
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input id="username" name="username" required autoFocus className="input" autoCapitalize="none" autoCorrect="off" autoComplete="username" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" name="password" type="password" required className="input" autoComplete="current-password" />
        </div>
        {state?.error && <p className="text-sm font-medium text-red-700" role="alert">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>{pending ? "Checking…" : "Log in"}</button>
      </form>
      <a href="/install" className="mt-4 inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-white underline underline-offset-4 hover:bg-brand-dark">
        Install app on phone / laptop
      </a>
      <footer className="mt-4 flex w-full max-w-sm flex-col items-center gap-2 text-center text-white">
        <p className="text-xs font-medium text-brand-light">Powered by</p>
        <Image src="/pokitbio.png" alt="PokitBio" width={180} height={65} className="rounded-xl" />
        <a href="https://wa.me/923396886174" target="_blank" rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white hover:bg-brand-dark">
          <ChatIcon className="size-4" /> WhatsApp: +92 339 6886174
        </a>
        <a href="https://pokitbio.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-white underline-offset-4 hover:bg-brand-dark hover:underline">
          pokitbio.com
        </a>
      </footer>
    </main>
  );
}
