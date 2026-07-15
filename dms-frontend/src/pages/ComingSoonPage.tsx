import { Construction } from "lucide-react";
import { PageState } from "@/components/common/PageState";

export function ComingSoonPage({ moduleName }: { moduleName: string }) {
  return (
    <PageState
      icon={Construction}
      title={`${moduleName} is coming up next`}
      description="This module is built in a following step, once the foundation (auth, layout, routing) is confirmed."
    />
  );
}
