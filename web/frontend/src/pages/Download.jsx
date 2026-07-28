import { Download as DownloadIcon, ShieldCheck, Smartphone } from "lucide-react";
import BrandLogo from "../components/ui/BrandLogo";

export default function Download() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#10b9811f,transparent_42%)] pointer-events-none" />
      <section className="relative w-full max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-zinc-900 border border-emerald-500/25 shadow-[0_0_36px_rgba(16,185,129,0.16)] p-1.5">
          <BrandLogo className="w-full h-full" />
        </div>

        <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">KharchaFlow for Android</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Take your finances with you.</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Download the KharchaFlow Android app to track expenses, budgets, and goals from your phone.
        </p>

        <a
          href="/kharchaflow.apk"
          download="KharchaFlow.apk"
          className="mt-8 w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 px-5 py-4 text-sm font-bold text-zinc-950 transition-colors shadow-[0_8px_28px_rgba(16,185,129,0.22)]"
        >
          <DownloadIcon className="w-5 h-5" />
          Download APK
        </a>

        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
            <Smartphone className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-200">Android device</p>
            <p className="text-[11px] text-zinc-500 mt-1">Install directly from your download.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-zinc-200">Safe install</p>
            <p className="text-[11px] text-zinc-500 mt-1">Allow this browser if Android asks.</p>
          </div>
        </div>

        <a href="/" className="inline-block mt-7 text-xs font-semibold text-zinc-500 hover:text-emerald-400 transition-colors">
          Back to KharchaFlow
        </a>
      </section>
    </main>
  );
}
