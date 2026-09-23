"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ReportEditor from "@/components/reports/ReportEditor";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingIndicator from "@/components/ui/LoadingIndicator";

function ReportEditorPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <ErrorBanner message="Report id must be a positive integer." />;
  }

  return <ReportEditor id={id} startInEdit={searchParams.get("edit") === "1"} />;
}

export default function ReportEditorPage() {
  return (
    <Suspense fallback={<LoadingIndicator label="Loading report…" />}>
      <ReportEditorPageInner />
    </Suspense>
  );
}
