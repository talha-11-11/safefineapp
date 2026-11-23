import Image from "next/image";
import Link from "next/link";
import InstallButton from "@/components/InstallButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Install the app" };

export default function InstallPage() {
  const apk = process.env.ANDROID_APK_URL || "";
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-brand px-4 py-8">
      <div className="card w-full max-w-sm space-y-4 text-center">
        <Image src="/icon-192.png" alt="" width={72} height={72} className="mx-auto rounded-2xl" />
        <h1 className="text-xl font-bold">Install Safe &amp; Fine</h1>
        <p className="text-sm text-slate-600">Phone aur laptop dono par app ki tarah chalta hai.</p>

        <InstallButton />

        {apk && (
          <a href={apk} className="btn-outline w-full" download>
            Download Android APK
          </a>
        )}

        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-left text-sm text-slate-700">
          <p><b>Android:</b> Chrome mein ⋮ → <i>Install app</i>{apk ? " ya upar APK download karein" : ""}.</p>
          <p><b>iPhone:</b> Safari mein Share → <i>Add to Home Screen</i>.</p>
          <p><b>Laptop:</b> Chrome / Edge mein address bar ke right par install icon dabayein.</p>
        </div>

        <Link href="/login" className="block text-sm font-semibold text-brand underline-offset-4 hover:underline">
          Go to login
        </Link>
      </div>
    </main>
  );
}
