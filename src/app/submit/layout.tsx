import type { ReactNode } from "react";
import { SubmitTabs } from "@/components/submit/SubmitTabs";

// Submit holds both flows as two tabs at the top (D-121 (5)): Submit a build (/submit) and Request a face
// (/submit/request). The tab bar stays mounted between them, so its pill slides from one to the other.
export default function SubmitLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SubmitTabs />
      {children}
    </>
  );
}
