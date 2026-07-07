import {
  LayoutDashboard,
  Users,
  IdCard,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  Truck,
  LogIn,
  Bell,
  BarChart3,
  UserCog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Module } from "@/utils/permissions";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /**
   * Restricts visibility to roles that have access to this module.
   * Omit to show to every authenticated user.
   */
  module?: Module;
  /** Bottom-aligned items (e.g. admin tools) */
  bottom?: boolean;
}

/**
 * Navigation items.
 * Visibility is enforced by the Sidebar via canAccessModule() checks.
 * Order here determines sidebar display order.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      path: "/dashboard",      icon: LayoutDashboard },
  { label: "Drivers",        path: "/drivers",         icon: Users,         module: "Drivers" },
  { label: "Licenses",       path: "/licenses",        icon: IdCard,        module: "Licenses" },
  { label: "Medical Records",path: "/medical-records", icon: HeartPulse,    module: "MedicalRecords" },
  { label: "Trainings",      path: "/trainings",       icon: GraduationCap, module: "Trainings" },
  { label: "Incidents",      path: "/incidents",       icon: ShieldAlert,   module: "Incidents" },
  { label: "Transporters",   path: "/transporters",    icon: Truck,         module: "Transporters" },
  { label: "Plant Movements",path: "/plant-movements", icon: LogIn,         module: "PlantMovements" },
  { label: "Reports",        path: "/reports",         icon: BarChart3,     module: "Reports" },
  { label: "Notifications",  path: "/notifications",   icon: Bell },
  { label: "Users",          path: "/users",           icon: UserCog,       module: "Users", bottom: true },
];
