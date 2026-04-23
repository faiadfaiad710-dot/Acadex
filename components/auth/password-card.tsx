"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { updatePasswordRequirementAction } from "@/lib/actions/auth";
import { Panel } from "@/components/ui/panel";
import { useAppConfig } from "@/providers/app-providers";

export function PasswordCard({ mustChangePassword }: { mustChangePassword?: boolean }) {
  const router = useRouter();
  const { dictionary } = useAppConfig();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Panel className="max-w-xl">
      <h2 className="font-heading text-xl font-semibold text-text">{dictionary.profile}</h2>
      <p className="mt-2 text-sm text-subtle">
        {mustChangePassword ? dictionary.changePasswordNotice : "Keep your account secure with a strong password."}
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          const formData = new FormData(event.currentTarget);
          const newPassword = String(formData.get("newPassword"));

          startTransition(async () => {
            const firebaseAuth = getFirebaseAuth();
            const current = firebaseAuth.currentUser;
            if (!current) {
              setMessage("Please sign in again before updating your password.");
              return;
            }

            try {
              await updatePassword(current, newPassword);
              await updatePasswordRequirementAction(newPassword);
              setMessage("Password updated successfully.");
              router.refresh();
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Unable to update password.");
            }
          });
        }}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-text">{dictionary.newPassword}</label>
          <input
            name="newPassword"
            type="password"
            required
            minLength={6}
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-accent"
          />
        </div>
        {message ? <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-subtle">{message}</p> : null}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Updating..." : dictionary.saveChanges}
        </button>
      </form>
    </Panel>
  );
}
