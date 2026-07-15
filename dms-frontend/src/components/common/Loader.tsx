import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Loader({ size = 32, className = "", label = "Loading data..." }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 size={size} className="animate-spin text-primary-600 dark:text-primary-400" />
      {label && (
        <span className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  );
}
export default Loader;
