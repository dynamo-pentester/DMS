import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { NAV_ITEMS } from "@/routes/navConfig";

function titleCase(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumb() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const navMatch = NAV_ITEMS.find((item) => item.path === pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      <Link to="/dashboard" className="flex items-center hover:text-primary-600">
        <Home size={14} />
      </Link>
      {segments.map((seg, idx) => {
        const path = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const label = idx === 0 && navMatch ? navMatch.label : titleCase(seg);
        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            ) : (
              <Link to={path} className="hover:text-primary-600">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
