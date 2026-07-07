import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { PageState } from "@/components/common/PageState";

export function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <PageState
      icon={ShieldAlert}
      tone="error"
      title="You don't have access to this page"
      description="Your role doesn't include permission to view this section. Contact a System Administrator if you think this is a mistake."
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
