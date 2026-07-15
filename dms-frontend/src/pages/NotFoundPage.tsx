import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import { PageState } from "@/components/common/PageState";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <PageState
      icon={FileQuestion}
      title="Page not found"
      description="The page you're looking for doesn't exist or may have moved."
      action={
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-700"
        >
          Back to dashboard
        </button>
      }
    />
  );
}
