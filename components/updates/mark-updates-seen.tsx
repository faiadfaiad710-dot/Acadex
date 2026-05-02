"use client";

import { useEffect } from "react";
import { markNotificationsSeenAction } from "@/lib/actions/auth";

export function MarkUpdatesSeen() {
  useEffect(() => {
    markNotificationsSeenAction()
      .then(() => window.dispatchEvent(new Event("acadex-notifications-seen")))
      .catch(() => undefined);
  }, []);

  return null;
}
