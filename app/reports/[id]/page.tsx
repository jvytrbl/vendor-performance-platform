"use client";

import { useParams } from "next/navigation";
import ReportEditor from "@/components/reports/ReportEditor";

export default function ReportEditorPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return <p className="text-sm text-danger">Report id must be a positive integer.</p>;
  }

  return <ReportEditor id={id} />;
}
