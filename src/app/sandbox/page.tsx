"use client";

import { SessionProvider } from "@/features/session/components/SessionProvider";
import { SandboxDashboard } from "@/features/sandbox/components/SandboxDashboard";

export default function SandboxPage() {
  return (
    <SessionProvider>
      <SandboxDashboard />
    </SessionProvider>
  );
}
