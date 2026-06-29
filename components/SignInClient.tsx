"use client";

import { ArrowRight, LockKeyhole, UserPlus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { createAccount, signInAccount } from "@/lib/auth";

type Mode = "signin" | "signup";

export function SignInClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await createAccount({ email, password, name });

        if (result.needsEmailConfirmation) {
          setMessage("Check your email to confirm your account, then come back and sign in.");
          return;
        }
      } else {
        await signInAccount({ email, password });
      }

      router.push("/practice");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.92fr]">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700">
          <LockKeyhole className="h-4 w-4 text-indigo-600" />
          Sign in to save your progress
        </div>
        <div>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Your MBE prep, saved to your account.
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-950/66">
            Practice questions, weak areas, flashcards, outlines, and podcast notes stay tied to your Supabase account.
          </p>
        </div>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
          {["Adaptive questions", "Flashcard progress", "Listening notes"].map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white/62 p-4 text-sm font-semibold text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>

      <GlassCard strong className="space-y-6">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/mbe-prep-logo.png"
            alt="MBE Prep logo"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-3xl object-cover shadow-lg shadow-slate-900/15"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700/70">MBE Prep</p>
            <h2 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/60 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
            }}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === "signin" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white/80"}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${mode === "signup" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-white/80"}`}
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-950/62">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-950/62">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signup" ? "Create a password" : "Your password"}
              minLength={6}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white/78 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-indigo-700"
          >
            {mode === "signin" ? <LockKeyhole className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {submitting ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="text-sm leading-6 text-slate-950/55">
          Your account is handled by Supabase Auth. Study progress is still saved in this browser under your Supabase user id until cloud progress sync is added.
        </p>
      </GlassCard>
    </div>
  );
}
