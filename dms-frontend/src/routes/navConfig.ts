import {
  LayoutDashboard,
  Users,
  IdCard,
  HeartPulse,
  GraduationCap,
  ShieldAlert,
  Truck,
  Bell,
  BarChart3,
  UserCog,
  FileCheck,
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
}

/**
 * Navigation items — single source of truth for both the Sidebar and the
 * Breadcrumb (which looks up labels by path). Do not duplicate this list
 * elsewhere; import NAV_ITEMS instead.
 *
 * Order here determines sidebar display order. Sequence per client spec:
 * Dashboard, Users(admin), Driver, Training, Medical Exams, Vehicle
 * Allocation, Incidents, License, Reports, Notifications.
 * Approvals wasn't part of that list — placed alongside its closest
 * related section (Users/admin) rather than dropped. Flag if you'd
 * rather it sit elsewhere.
 *
 * Plant Movements is on hold (backend kept as a stub for future dev)
 * and has been removed from navigation/routes until it's picked back up.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",         path: "/dashboard",       icon: LayoutDashboard },
  { label: "Users",             path: "/users",           icon: UserCog,       module: "Users" },
  { label: "Approvals",         path: "/approvals",       icon: FileCheck,     module: "Approvals" },
  { label: "Drivers",           path: "/drivers",         icon: Users,         module: "Drivers" },
  { label: "Training",          path: "/trainings",       icon: GraduationCap, module: "Trainings" },
  { label: "Medical Exams",     path: "/medical-records", icon: HeartPulse,    module: "MedicalRecords" },
  { label: "Vehicle Allocation",path: "/transporters",    icon: Truck,         module: "Transporters" },
  { label: "Incidents",         path: "/incidents",       icon: ShieldAlert,   module: "Incidents" },
  { label: "License",           path: "/licenses",        icon: IdCard,        module: "Licenses" },
  { label: "Reports",           path: "/reports",         icon: BarChart3,     module: "Reports" },
  { label: "Notifications",     path: "/notifications",   icon: Bell },
];
