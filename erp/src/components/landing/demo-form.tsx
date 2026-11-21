"use client";

import { useState } from "react";

const EMAIL = "jlsusvilla01@gmail.com";

/**
 * No backend: the form opens the visitor's email app with everything filled in.
 */
export function DemoForm() {
  const [sent, setSent] = useState(false);
  const field =
    "block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4c63ff] focus:outline-none focus:ring-4 focus:ring-[#4c63ff]/15";

  return (
    <form
      className="reveal rounded-3xl bg-white p-6 text-slate-900 shadow-2xl shadow-black/30 sm:p-7"
      style={{ transitionDelay: "150ms" }}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const v = (k: string) => String(fd.get(k) ?? "").trim();
        const body = [
          `Name: ${v("name")}`,
          `Company: ${v("company")}`,
          `Email: ${v("email")}`,
          `Mobile: ${v("mobile")}`,
          `Active projects: ${v("projects")}`,
          "",
          v("message"),
        ].join("\n");
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`ConstructAI demo — ${v("company") || v("name")}`)}&body=${encodeURIComponent(body)}`;
        setSent(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Your name</span>
          <input name="name" required className={field} placeholder="Engr. Juan Dela Cruz" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Company</span>
          <input name="company" className={field} placeholder="Dela Cruz Builders" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Email</span>
          <input name="email" type="email" className={field} placeholder="you@company.ph" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Mobile</span>
          <input name="mobile" inputMode="tel" className={field} placeholder="0917 123 4567" />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Active projects</span>
          <select name="projects" className={field} defaultValue="1–3">
            <option>1–3</option>
            <option>4–10</option>
            <option>11–25</option>
            <option>More than 25</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Anything we should know? (optional)</span>
          <textarea name="message" rows={2} className={field} placeholder="Residential and commercial jobs in Iloilo and Bacolod…" />
        </label>
      </div>
      <button className="mt-5 w-full rounded-xl bg-[#2f4ff5] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2f4ff5]/30 transition hover:bg-[#2442e0]">
        Request a demo →
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">
        {sent ? "Your email app should open with the details filled in — just press send." : "Opens your email app with the details filled in."}
      </p>
    </form>
  );
}
