"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { motion } from "framer-motion";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signInWithTokenAction } from "@/lib/actions/auth";
import { useAppConfig } from "@/providers/app-providers";
import { credentialToEmail } from "@/lib/auth/phone";

export function LoginForm() {
  const router = useRouter();
  const { dictionary } = useAppConfig();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card w-full max-w-md rounded-[32px] border border-border/70 p-8 shadow-card"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        const loginId = String(formData.get("loginId"));
        const password = String(formData.get("password"));

        startTransition(async () => {
          try {
            const firebaseAuth = getFirebaseAuth();
            const email = credentialToEmail(loginId);
            if (!email) throw new Error("Enter a valid phone number or email.");
            const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
            const token = await credential.user.getIdToken(true);
            await signInWithTokenAction(token);
            window.sessionStorage.setItem("acadex-intro", String(Date.now()));
            router.push("/dashboard");
          } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Unable to sign in");
          }
        });
      }}
    >
      <div>
        <p className="font-heading text-3xl font-bold text-text">{dictionary.loginTitle}</p>
        <p className="mt-2 text-sm text-subtle">{dictionary.loginSubtitle}</p>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-text">Phone number or admin email</label>
          <input
            name="loginId"
            type="text"
            placeholder="01XXXXXXXXX or admin@email.com"
            required
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-text">{dictionary.password}</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-accent"
          />
        </div>
        {error ? <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Signing in..." : dictionary.signIn}
        </button>
      </div>
    </motion.form>
  );
}
