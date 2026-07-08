import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/api/axiosInstance";
import {
  Users,
  GraduationCap,
  LogIn,
  Bell,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  X,
  Search,
  FileUp,
  Download,
  Eye,
  CheckSquare,
  Square,
  ArrowUpDown,
  ShieldCheck,
  FileText,
  UserCheck,
  Briefcase,
  Truck,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// Interface for dashboard metrics
interface DashboardData {
  totalDrivers: number;
  activeDrivers: number;
  expiringLicenses: number;
  onSiteCount: number;
  upcomingExpiries: any[];
  recentNotifications: any[];
  recentActivities: any[];
  managersCount: number;
  vehiclesAssignedCount: number;
}

// Custom Premium Badge component
function CompactBadge({ text, status }: { text: string; status: string }) {
  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status.toLowerCase()) {
    case "approved":
    case "active":
    case "valid":
    case "completed":
    case "available":
    case "pass":
      styles = "bg-emerald-50 text-emerald-700 border-emerald-250/30";
      break;
    case "assigned":
    case "on-duty":
    case "low":
      styles = "bg-blue-50 text-blue-700 border-blue-200/30";
      break;
    case "pending":
    case "warning":
    case "expiring":
    case "medium":
      styles = "bg-amber-50 text-amber-700 border-amber-250/30";
      break;
    case "rejected":
    case "expired":
    case "critical":
    case "high":
    case "failed":
      styles = "bg-rose-50 text-rose-700 border-rose-250/30";
      break;
    case "inactive":
    case "suspended":
      styles = "bg-slate-100 text-slate-600 border-slate-300/30";
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ${styles}`}>
      {text}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.roles?.[0] || "";
  const isAdmin = role === "System Administrator";
  const isManager = role === "Manager";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    totalDrivers: 0,
    activeDrivers: 0,
    expiringLicenses: 0,
    onSiteCount: 0,
    upcomingExpiries: [],
    recentNotifications: [],
    recentActivities: [],
    managersCount: 0,
    vehiclesAssignedCount: 0,
  });

  // Modal control states
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Lookups and reference listings from live database
  const [rawDrivers, setRawDrivers] = useState<any[]>([]);
  const [transporters, setTransporters] = useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [fitnessStatuses, setFitnessStatuses] = useState<any[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<any[]>([]);

  // State definitions for modal form inputs
  const [formCreateDriver, setFormCreateDriver] = useState({
    fullName: "",
    fatherName: "",
    dateOfBirth: "",
    mobile: "",
    address: "",
    bloodGroupId: "",
    aadhaarNo: "",
    emergencyContactName: "",
    emergencyContactRelation: "",
    emergencyContactPhone: "",
  });

  const [formAssignManager, setFormAssignManager] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Manager",
  });

  const [formUploadDocs, setFormUploadDocs] = useState({
    docType: "License",
    driverId: "",
    licenseNo: "",
    issueDate: "",
    validTill: "",
    vehicleTypeId: "",
    fitnessStatusId: "",
    bp: "",
    visionTestPass: true,
    alcoholTestPass: true,
    chronicIllness: false,
    chronicIllnessRemarks: "",
  });

  const [formAssignDriver, setFormAssignDriver] = useState({
    driverId: "",
    transporterId: "",
  });

  const [formSchedTraining, setFormSchedTraining] = useState({
    driverId: "",
    trainingTypeId: "",
    dateCompleted: "",
    validUpto: "",
    trainerName: "",
  });

  // Search, sorting and filtering state for Admin Pending Approvals
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSortKey, setAdminSortKey] = useState("submittedDate");
  const [adminSortDir, setAdminSortDir] = useState<"asc" | "desc">("desc");

  // Search, sorting and filtering state for Manager Team List
  const [managerSearch, setManagerSearch] = useState("");
  const [managerFilterStatus, setManagerFilterStatus] = useState("All");
  const [managerSortKey, setManagerSortKey] = useState("driver");
  const [managerSortDir, setManagerSortDir] = useState<"asc" | "desc">("asc");

  // Sorting handlers
  const handleAdminSort = (key: string) => {
    if (adminSortKey === key) {
      setAdminSortDir(adminSortDir === "asc" ? "desc" : "asc");
    } else {
      setAdminSortKey(key);
      setAdminSortDir("asc");
    }
  };

  const handleManagerSort = (key: string) => {
    if (managerSortKey === key) {
      setManagerSortDir(managerSortDir === "asc" ? "desc" : "asc");
    } else {
      setManagerSortKey(key);
      setManagerSortDir("asc");
    }
  };

  // Admin Pending Approvals — sourced from real backend expiry/compliance items
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  // Manager-specific state
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [managerTransporter, setManagerTransporter] = useState<any | null>(null);
  const [managerTrainings, setManagerTrainings] = useState<any[]>([]);
  const [managerExpiries, setManagerExpiries] = useState<any[]>([]);
  const [managerActivities, setManagerActivities] = useState<any[]>([]);

  // Manager Tasks (UI-only checklist, no backend endpoint)
  const [managerTasks, setManagerTasks] = useState([
    { id: 1, text: "Verify safety pre-logs for today's active vehicles", priority: "High", dueTime: "10:30 AM", completed: false },
    { id: 2, text: "Review expiring license/medical notifications", priority: "Critical", dueTime: "12:00 PM", completed: false },
    { id: 3, text: "Sign-off driver shift logsheet summary", priority: "Medium", dueTime: "03:30 PM", completed: true },
    { id: 4, text: "Conduct safety checklist verification for gate entry", priority: "Low", dueTime: "05:00 PM", completed: false }
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [
          driversRes,
          licensesRes,
          medicalRes,
          trainingsRes,
          incidentsRes,
          movementsRes,
          notificationsRes,
          usersRes,
          transportersRes,
          bloodGroupsRes,
          vehicleTypesRes,
          fitnessStatusesRes,
          trainingTypesRes,
        ] = await Promise.all([
          api.get("/drivers", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/licenses", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/medical-records", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/trainings", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/incidents", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/plant-movements", { params: { pageSize: 1000 } }).catch(() => ({ data: { items: [], totalCount: 0 } })),
          api.get("/notifications", { params: { page: 1, pageSize: 10 } }).catch(() => ({ data: { items: [] } })),
          // Note: /users endpoint is admin-only; avoid 403 request on startup for non-admin
          isAdmin ? api.get("/users", { params: { page: 1, pageSize: 200 } }).catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } }),
          api.get("/transporters", { params: { page: 1, pageSize: 1000 } }).catch(() => ({ data: { items: [] } })),
          api.get("/lookups/blood-groups").catch(() => ({ data: [] })),
          api.get("/lookups/vehicle-types").catch(() => ({ data: [] })),
          api.get("/lookups/fitness-statuses").catch(() => ({ data: [] })),
          api.get("/lookups/training-types").catch(() => ({ data: [] })),
        ]);

        const drivers: any[] = driversRes.data.items || [];
        const allTransporters: any[] = transportersRes.data.items || transportersRes.data || [];
        setRawDrivers(drivers);
        setTransporters(allTransporters);
        setBloodGroups(bloodGroupsRes.data || []);
        setVehicleTypes(vehicleTypesRes.data || []);
        setFitnessStatuses(fitnessStatusesRes.data || []);
        setTrainingTypes(trainingTypesRes.data || []);

        const licenses: any[] = licensesRes.data.items || [];
        const medicals: any[] = medicalRes.data.items || [];
        const trainings: any[] = trainingsRes.data.items || [];
        const incidents: any[] = incidentsRes.data.items || [];
        const movements: any[] = movementsRes.data.items || [];
        const notifications: any[] = notificationsRes.data.items || [];
        const users: any[] = usersRes.data.items || [];

        const totalDrivers = driversRes.data.totalCount || drivers.length;
        const activeDrivers = drivers.filter((d: any) => d.currentStatusName === "Active").length;
        const expiringLicenses = licenses.filter((l: any) => l.status === "Expiring" || l.status === "Expired").length;
        const onSiteCount = movements.filter((m: any) => m.isOnSite === true || m.dateOfExit === null || m.dateOfExit === undefined).length;

        const managersCount = users.filter((u: any) =>
          Array.isArray(u.roles) && u.roles.includes("Manager")
        ).length;

        // ---- Admin: Build pending approvals from real compliance data ----
        const approvals: any[] = [];
        let approvalId = 1;
        licenses.filter((l: any) => l.status === "Expired" || l.status === "Expiring").forEach((l: any) => {
          approvals.push({
            id: approvalId++,
            employee: l.driverName,
            requestType: `License ${l.status === "Expired" ? "Renewal" : "Expiry Review"} — ${l.vehicleTypeName || "Vehicle"}`,
            submittedDate: l.validTill,
            priority: l.status === "Expired" ? "Critical" : "High",
            status: "Pending",
            details: `License No: ${l.licenseNo}. Valid till: ${l.validTill ? new Date(l.validTill).toLocaleDateString() : "N/A"}. Status: ${l.status}.`,
          });
        });
        medicals.filter((m: any) => m.status === "Expired" || m.status === "Expiring").forEach((m: any) => {
          approvals.push({
            id: approvalId++,
            employee: m.driverName,
            requestType: `Medical Fitness ${m.status === "Expired" ? "Renewal" : "Review"} — ${m.fitnessStatusName || "Fitness Check"}`,
            submittedDate: m.validTill,
            priority: m.status === "Expired" ? "Critical" : "Medium",
            status: "Pending",
            details: `Medical expires: ${m.validTill ? new Date(m.validTill).toLocaleDateString() : "N/A"}. BP: ${m.bp || "N/A"}.`,
          });
        });
        trainings.filter((t: any) => t.status === "Expired" || t.status === "Expiring").forEach((t: any) => {
          approvals.push({
            id: approvalId++,
            employee: t.driverName,
            requestType: `Training ${t.status === "Expired" ? "Renewal" : "Review"} — ${t.trainingTypeName}`,
            submittedDate: t.validUpto,
            priority: t.status === "Expired" ? "High" : "Low",
            status: "Pending",
            details: `Training: ${t.trainingTypeName}. Valid upto: ${t.validUpto ? new Date(t.validUpto).toLocaleDateString() : "N/A"}.`,
          });
        });
        const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        approvals.sort((a, b) => {
          const pa = priorityOrder[a.priority] ?? 4;
          const pb = priorityOrder[b.priority] ?? 4;
          if (pa !== pb) return pa - pb;
          return new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime();
        });
        setPendingApprovals(approvals);

        // ---- Admin: Upcoming Expiries + Activity + Notifications ----
        const expiries: any[] = [];
        licenses.filter((l: any) => l.status !== "Valid").forEach((l: any) => {
          expiries.push({ id: `lic-${l.licenseId}`, type: "License", name: l.driverName, detail: `Lic #${l.licenseNo}`, status: l.status, date: l.validTill });
        });
        medicals.filter((m: any) => m.status !== "Valid").forEach((m: any) => {
          expiries.push({ id: `med-${m.medicalRecordId}`, type: "Medical", name: m.driverName, detail: `Fitness check`, status: m.status, date: m.validTill });
        });
        trainings.filter((t: any) => t.status !== "Valid").forEach((t: any) => {
          expiries.push({ id: `tr-${t.trainingId}`, type: "Training", name: t.driverName, detail: t.trainingTypeName, status: t.status, date: t.validUpto });
        });
        expiries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const recentActivities: any[] = [];
        movements.slice(0, 3).forEach((m: any) => {
          recentActivities.push({
            id: `act-mov-${m.movementId}`,
            title: "Plant Movement Logged",
            desc: `${m.driverName} entered gate ${m.gateNumberName || "Main"} in vehicle ${m.vehicleNo}`,
            time: m.dateOfEntry,
          });
        });
        incidents.slice(0, 2).forEach((i: any) => {
          recentActivities.push({
            id: `act-inc-${i.incidentId}`,
            title: "Safety Incident Reported",
            desc: `Driver ${i.driverName} involved in ${i.incidentTypeName}`,
            time: i.incidentDate,
          });
        });
        recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        setData({
          totalDrivers,
          activeDrivers,
          expiringLicenses,
          onSiteCount,
          upcomingExpiries: expiries.slice(0, 5),
          recentNotifications: notifications.slice(0, 5),
          recentActivities: recentActivities.slice(0, 5),
          managersCount,
          vehiclesAssignedCount: onSiteCount,
        });

        // ---- Manager: Find manager's transporter via ContactPerson name match ----
        if (isManager && user) {
          const managerName = user.fullName?.toLowerCase() || "";
          // Try to match transporter by ContactPerson name
          let myTransporter = allTransporters.find(
            (t: any) => t.contactPerson?.toLowerCase() === managerName
          );
          // Fallback: first active transporter
          if (!myTransporter) {
            myTransporter = allTransporters.find((t: any) => t.isActive) || allTransporters[0] || null;
          }
          setManagerTransporter(myTransporter);

          if (myTransporter) {
            // Fetch assignment history for this transporter
            const assignmentsRes = await api
              .get(`/transporters/${myTransporter.transporterId}/drivers`)
              .catch(() => ({ data: [] }));

            const assignments: any[] = assignmentsRes.data || [];
            // Only current assignments (isCurrent = true)
            const currentAssignments = assignments.filter((a: any) => a.isCurrent);
            const assignedDriverIds = new Set(currentAssignments.map((a: any) => a.driverId));

            // Filter full driver list to only assigned ones
            const myDrivers = drivers.filter((d: any) => assignedDriverIds.has(d.driverId));

            // Build per-driver cross-reference lookups
            const licByDrv: Record<number, any> = {};
            licenses.filter((l: any) => assignedDriverIds.has(l.driverId)).forEach((l: any) => {
              if (!licByDrv[l.driverId] || new Date(l.validTill) > new Date(licByDrv[l.driverId].validTill)) {
                licByDrv[l.driverId] = l;
              }
            });
            const movByDrv: Record<number, any> = {};
            movements
              .filter((m: any) => assignedDriverIds.has(m.driverId))
              .filter((m: any) => m.isOnSite === true || m.dateOfExit === null || m.dateOfExit === undefined)
              .forEach((m: any) => { movByDrv[m.driverId] = m; });

            const teamList = myDrivers.map((d: any) => {
              const lic = licByDrv[d.driverId];
              const mov = movByDrv[d.driverId];
              let availability = "Available";
              if (d.currentStatusName === "Inactive" || d.currentStatusName === "Suspended") {
                availability = "Suspended";
              } else if (mov) {
                availability = "On-Duty";
              }
              return {
                id: d.driverId,
                driver: d.fullName,
                mobile: d.mobile || "—",
                licenseStatus: lic ? lic.status : "No License",
                licenseNo: lic ? lic.licenseNo : "—",
                licenseExpiry: lic ? lic.validTill : null,
                assignedVehicle: mov ? mov.vehicleNo : "—",
                todayTask: mov
                  ? `Gate ${mov.gateNumberName || "Entry"} — ${mov.purposeTypeName || "On site"}`
                  : "Not on site today",
                availability,
                status: d.currentStatusName || "Active",
              };
            });
            setMyTeam(teamList);

            // Manager-scoped compliance data
            const myLicenses = licenses.filter((l: any) => assignedDriverIds.has(l.driverId));
            const myMedicals = medicals.filter((m: any) => assignedDriverIds.has(m.driverId));
            const myTrainings = trainings.filter((t: any) => assignedDriverIds.has(t.driverId));
            const myMovements = movements.filter((m: any) => assignedDriverIds.has(m.driverId));
            setManagerTrainings(myTrainings);

            // Manager expiry alerts (only their drivers)
            const mgrExpiries: any[] = [];
            myLicenses.filter((l: any) => l.status !== "Valid").forEach((l: any) => {
              mgrExpiries.push({ id: `lic-${l.licenseId}`, type: "License", name: l.driverName, detail: `Lic #${l.licenseNo}`, status: l.status, date: l.validTill });
            });
            myMedicals.filter((m: any) => m.status !== "Valid").forEach((m: any) => {
              mgrExpiries.push({ id: `med-${m.medicalRecordId}`, type: "Medical", name: m.driverName, detail: `Fitness check`, status: m.status, date: m.validTill });
            });
            myTrainings.filter((t: any) => t.status !== "Valid").forEach((t: any) => {
              mgrExpiries.push({ id: `tr-${t.trainingId}`, type: "Training", name: t.driverName, detail: t.trainingTypeName, status: t.status, date: t.validUpto });
            });
            mgrExpiries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setManagerExpiries(mgrExpiries);

            // Manager activity feed (only their drivers' movements + incidents)
            const mgrActivities: any[] = [];
            myMovements.slice(0, 4).forEach((m: any) => {
              mgrActivities.push({
                id: `act-mov-${m.movementId}`,
                title: "Plant Movement",
                desc: `${m.driverName} — Gate ${m.gateNumberName || "Entry"}, ${m.vehicleNo}`,
                time: m.dateOfEntry,
              });
            });
            incidents
              .filter((i: any) => assignedDriverIds.has(i.driverId))
              .slice(0, 2)
              .forEach((i: any) => {
                mgrActivities.push({
                  id: `act-inc-${i.incidentId}`,
                  title: "Incident Reported",
                  desc: `${i.driverName} — ${i.incidentTypeName}`,
                  time: i.incidentDate,
                });
              });
            mgrActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setManagerActivities(mgrActivities);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeModal === "createDriver") {
        const payload = {
          fullName: formCreateDriver.fullName,
          fatherName: formCreateDriver.fatherName || null,
          dateOfBirth: new Date(formCreateDriver.dateOfBirth).toISOString(),
          mobile: formCreateDriver.mobile,
          address: formCreateDriver.address || null,
          bloodGroupId: formCreateDriver.bloodGroupId ? parseInt(formCreateDriver.bloodGroupId) : null,
          aadhaarNo: formCreateDriver.aadhaarNo || null,
          emergencyContactName: formCreateDriver.emergencyContactName || null,
          emergencyContactRelation: formCreateDriver.emergencyContactRelation || null,
          emergencyContactPhone: formCreateDriver.emergencyContactPhone || null,
        };
        await api.post("/drivers", payload);
        toast.success("Driver profile created successfully!");
      } else if (activeModal === "assignManager") {
        const payload = {
          fullName: formAssignManager.fullName,
          email: formAssignManager.email,
          password: formAssignManager.password,
          role: "Manager",
        };
        await api.post("/auth/register", payload);
        toast.success("Transporter Manager account registered successfully!");
      } else if (activeModal === "uploadDocs") {
        if (formUploadDocs.docType === "License") {
          const payload = {
            driverId: parseInt(formUploadDocs.driverId),
            licenseNo: formUploadDocs.licenseNo,
            issueDate: new Date(formUploadDocs.issueDate).toISOString(),
            validTill: new Date(formUploadDocs.validTill).toISOString(),
            vehicleTypeId: parseInt(formUploadDocs.vehicleTypeId),
            endorsementIds: [],
          };
          await api.post("/licenses", payload);
          toast.success("License document uploaded and registered!");
        } else {
          const payload = {
            driverId: parseInt(formUploadDocs.driverId),
            examDate: new Date(formUploadDocs.issueDate).toISOString(),
            fitnessStatusId: parseInt(formUploadDocs.fitnessStatusId),
            bp: formUploadDocs.bp || null,
            visionTestPass: formUploadDocs.visionTestPass,
            alcoholTestPass: formUploadDocs.alcoholTestPass,
            chronicIllness: formUploadDocs.chronicIllness,
            chronicIllnessRemarks: formUploadDocs.chronicIllnessRemarks || null,
            validTill: new Date(formUploadDocs.validTill).toISOString(),
          };
          await api.post("/medical-records", payload);
          toast.success("Medical fitness assessment uploaded and registered!");
        }
      } else if (activeModal === "assignDriver") {
        const payload = {
          driverId: parseInt(formAssignDriver.driverId),
        };
        await api.post(`/transporters/${formAssignDriver.transporterId}/drivers`, payload);
        toast.success("Driver assigned to fleet transporter successfully!");
      } else if (activeModal === "schedTraining") {
        const payload = {
          driverId: parseInt(formSchedTraining.driverId),
          trainingTypeId: parseInt(formSchedTraining.trainingTypeId),
          dateCompleted: new Date(formSchedTraining.dateCompleted).toISOString(),
          validUpto: new Date(formSchedTraining.validUpto).toISOString(),
          trainerName: formSchedTraining.trainerName || null,
        };
        await api.post("/trainings", payload);
        toast.success("Crew driver training course certification scheduled!");
      }
      setActiveModal(null);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to process database action.");
    }
  };

  // Admin Pending Approvals Sorting and Filtering
  const filteredApprovals = useMemo(() => {
    return pendingApprovals
      .filter((app) =>
        app.employee.toLowerCase().includes(adminSearch.toLowerCase()) ||
        app.requestType.toLowerCase().includes(adminSearch.toLowerCase())
      )
      .sort((a: any, b: any) => {
        const valA = a[adminSortKey];
        const valB = b[adminSortKey];
        if (typeof valA === "string") {
          return adminSortDir === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return adminSortDir === "asc" ? valA - valB : valB - valA;
      });
  }, [pendingApprovals, adminSearch, adminSortKey, adminSortDir]);

  // Manager Team List Sorting and Filtering
  const filteredTeam = useMemo(() => {
    return myTeam
      .filter((member) => {
        const matchesSearch =
          member.driver.toLowerCase().includes(managerSearch.toLowerCase()) ||
          member.assignedVehicle.toLowerCase().includes(managerSearch.toLowerCase()) ||
          member.todayTask.toLowerCase().includes(managerSearch.toLowerCase());
        const matchesFilter =
          managerFilterStatus === "All" || member.licenseStatus === managerFilterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a: any, b: any) => {
        const valA = a[managerSortKey];
        const valB = b[managerSortKey];
        return managerSortDir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });
  }, [myTeam, managerSearch, managerFilterStatus, managerSortKey, managerSortDir]);

  // Toggle tasks
  const handleToggleTask = (taskId: number) => {
    setManagerTasks(
      managerTasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    toast.success("Task status updated");
  };

  // Process approval requests
  const handleRequestAction = (id: number, action: "Approve" | "Reject") => {
    setPendingApprovals(
      pendingApprovals.map((app) =>
        app.id === id ? { ...app, status: action === "Approve" ? "Approved" : "Rejected" } : app
      )
    );
    toast.success(`Request ${action === "Approve" ? "Approved" : "Rejected"} successfully`);
  };

  const pendingApprovalsCount = pendingApprovals.filter((a) => a.status === "Pending").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-96 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse lg:col-span-2" />
          <div className="h-96 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm animate-pulse" />
        </div>
      </div>
    );
  }

  // Common Header Section
  const welcomeMessage = user ? `Welcome back, ${user.fullName.split(" ")[0]}` : "Welcome back";
  const userSubtitle = isAdmin
    ? "Central system workspace. Monitor compliance certifications, process actions, and manage operations."
    : isManager
    ? "Manage driver details, fleet assignments, safety checklists, and training tasks for your transporter group."
    : "Compliance tracking console. Verify license validity and active site rosters.";

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{welcomeMessage}</h1>
        <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">{userSubtitle}</p>
      </div>

      {/* -------------------- ADMIN DASHBOARD VIEW -------------------- */}
      {isAdmin && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Drivers</p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.totalDrivers}</h3>
              <p className="mt-1 text-xs text-slate-500">Compliance registered</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Drivers</p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><TrendingUp size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.activeDrivers}</h3>
              <p className="mt-1 text-xs text-slate-500">Verified for duty</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Managers</p>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><UserCheck size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.managersCount}</h3>
              <p className="mt-1 text-xs text-slate-500">Fleet coordinators</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pending Approvals</p>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><Briefcase size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{pendingApprovalsCount}</h3>
              <p className="mt-1 text-xs text-slate-500">Awaiting validation</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Expiring Licenses</p>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600"><AlertTriangle size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.expiringLicenses}</h3>
              <p className="mt-1 text-xs text-slate-500">Renewal requested</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Vehicles Assigned</p>
                <div className="rounded-lg bg-slate-100 p-2 text-slate-650"><LogIn size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.vehiclesAssignedCount}</h3>
              <p className="mt-1 text-xs text-slate-500">Allocated roster</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Quick actions workspace</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
              {[
                { label: "Create Driver", icon: Plus, modal: "createDriver" },
                { label: "Assign Manager", icon: UserCheck, modal: "assignManager" },
                { label: "Upload Documents", icon: FileUp, modal: "uploadDocs" },
                { label: "Approve Requests", icon: ShieldCheck, modal: "approveReqs" },
                { label: "Export Data", icon: Download, action: () => toast.success("Compliance roster data exported (CSV)") },
                { label: "Generate Report", icon: FileText, modal: "genReport" },
                { label: "Add Vehicle", icon: Truck, modal: "addVehicle" },
                { label: "Manage Users", icon: Settings, action: () => navigate("/users") },
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={act.action ? act.action : () => setActiveModal(act.modal || null)}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 text-center hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-150"
                >
                  <act.icon className="text-slate-550 group-hover:text-blue-600 mb-2" size={18} />
                  <span className="text-xs font-medium text-slate-700">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table & Expiries Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Pending Approvals Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Pending Approvals</h4>
                  <p className="text-xs text-slate-500">Verify and validate credentials request queues</p>
                </div>
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search requests..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleAdminSort("employee")}>
                        <div className="flex items-center gap-1">
                          Employee
                          {adminSortKey === "employee" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleAdminSort("requestType")}>
                        <div className="flex items-center gap-1">
                          Request Type
                          {adminSortKey === "requestType" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleAdminSort("submittedDate")}>
                        <div className="flex items-center gap-1">
                          Submitted Date
                          {adminSortKey === "submittedDate" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleAdminSort("priority")}>
                        <div className="flex items-center gap-1">
                          Priority
                          {adminSortKey === "priority" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleAdminSort("status")}>
                        <div className="flex items-center gap-1">
                          Status
                          {adminSortKey === "status" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApprovals.length > 0 ? (
                      filteredApprovals.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{req.employee}</td>
                          <td className="p-3">{req.requestType}</td>
                          <td className="p-3 text-slate-550">{req.submittedDate}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center text-[10px] font-semibold ${
                              req.priority === "Critical" ? "text-rose-600" : req.priority === "High" ? "text-amber-600" : "text-slate-500"
                            }`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <CompactBadge text={req.status} status={req.status} />
                          </td>
                          <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActiveModal("viewRequest");
                              }}
                              className="text-slate-400 hover:text-slate-900"
                              title="View details"
                            >
                              <Eye size={14} />
                            </button>
                            {req.status === "Pending" && (
                              <>
                                <button
                                  onClick={() => handleRequestAction(req.id, "Approve")}
                                  className="text-emerald-500 hover:text-emerald-700 font-semibold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRequestAction(req.id, "Reject")}
                                  className="text-rose-500 hover:text-rose-700 font-semibold"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Upcoming Expirations */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Upcoming Expirations</h4>
                <p className="text-xs text-slate-500">Licenses and records expiring soon</p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                {data.upcomingExpiries.length > 0 ? (
                  data.upcomingExpiries.map((exp) => (
                    <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{exp.name}</div>
                        <div className="text-slate-450 text-[11px] mt-0.5">{exp.type} — {exp.detail}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-450">Expires: {format(new Date(exp.date), "dd MMM yyyy")}</span>
                        <CompactBadge text={exp.status} status={exp.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">All driver records are currently valid.</div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline and Notifications Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: Recent Activity Timeline */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Recent Activity Log</h4>
                <p className="text-xs text-slate-500">Live operational events stream</p>
              </div>

              <div className="relative pl-6 border-l border-slate-150 space-y-6 ml-2 py-2">
                {data.recentActivities.map((act) => (
                  <div key={act.id} className="relative group">
                    {/* Circle Node */}
                    <div className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-350 ring-2 ring-slate-150 transition-colors group-hover:bg-blue-600 group-hover:ring-blue-100" />
                    <div>
                      <h5 className="font-semibold text-xs text-slate-800">{act.title}</h5>
                      <p className="text-slate-500 text-xs mt-0.5">{act.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(act.time), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Notifications Panel */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Recent Alerts</h4>
                  <p className="text-xs text-slate-500">System warnings requiring notification</p>
                </div>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-150">
                  {data.recentNotifications.length}
                </span>
              </div>

              <div className="space-y-3">
                {data.recentNotifications.length > 0 ? (
                  data.recentNotifications.map((notif) => (
                    <div key={notif.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3 bg-white">
                      <div className="mt-0.5 text-blue-600 rounded-lg bg-blue-50 p-1.5"><Bell size={13} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 block mt-1.5">{format(new Date(notif.createdAt), "dd MMM yyyy, hh:mm a")}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">No alerts today.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------- MANAGER DASHBOARD VIEW -------------------- */}
      {isManager && (
        <>
          {/* Transporter Context Banner */}
          {managerTransporter && (
            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
              <Truck size={16} className="text-blue-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold text-slate-800">{managerTransporter.name}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-500 text-xs">Contact: {managerTransporter.contactPerson || "—"}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-500 text-xs">{managerTransporter.currentDriverCount ?? myTeam.length} drivers assigned</span>
              </div>
            </div>
          )}
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">My Drivers</p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{myTeam.length}</h3>
              <p className="mt-1 text-xs text-slate-500">Assigned transporter team</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Available Drivers</p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><TrendingUp size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {myTeam.filter((m) => m.availability === "Available").length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">On standby availability</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Pending Tasks</p>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600"><CheckSquare size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {managerTasks.filter((t) => !t.completed).length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Today's checklists remaining</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Today's Assignments</p>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><LogIn size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {myTeam.filter((m) => m.availability === "On-Duty").length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Active roster operations</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Upcoming Renewals</p>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600"><AlertTriangle size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {managerExpiries.length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Compliance renewals required</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Completed Trainings</p>
                <div className="rounded-lg bg-slate-150 p-2 text-slate-700"><GraduationCap size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">
                {managerTrainings.filter((t: any) => t.status === "Valid" || t.status === "Completed").length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Certified crew trainings</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Manager Actions</h4>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {[
                { label: "Assign Driver", icon: Users, modal: "assignDriver" },
                { label: "Schedule Training", icon: GraduationCap, modal: "schedTraining" },
                { label: "Upload Documents", icon: FileUp, modal: "uploadDocs" },
                { label: "Review Requests", icon: ShieldCheck, modal: "reviewReqs" },
                { label: "Generate Report", icon: FileText, modal: "genReport" },
              ].map((act, i) => (
                <button
                  key={i}
                  onClick={() => setActiveModal(act.modal)}
                  className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-4 text-center hover:border-blue-200 hover:bg-blue-50/20 transition-all duration-150"
                >
                  <act.icon className="text-slate-550 group-hover:text-blue-600 mb-2" size={18} />
                  <span className="text-xs font-medium text-slate-700">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Team Table & Tasks Row */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left: My Team Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">My Team Status</h4>
                  <p className="text-xs text-slate-500">Monitor driver credentials and active allocations</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Filter Dropdown */}
                  <select
                    value={managerFilterStatus}
                    onChange={(e) => setManagerFilterStatus(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-700 focus:border-blue-400 focus:bg-white focus:outline-none"
                  >
                    <option value="All">All Licenses</option>
                    <option value="Valid">Valid</option>
                    <option value="Expiring">Expiring</option>
                    <option value="Expired">Expired</option>
                  </select>

                  {/* Search Bar */}
                  <div className="relative max-w-xs">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search team..."
                      value={managerSearch}
                      onChange={(e) => setManagerSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleManagerSort("driver")}>
                        <div className="flex items-center gap-1">
                          Driver
                          {managerSortKey === "driver" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleManagerSort("licenseStatus")}>
                        <div className="flex items-center gap-1">
                          License Status
                          {managerSortKey === "licenseStatus" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleManagerSort("assignedVehicle")}>
                        <div className="flex items-center gap-1">
                          Assigned Vehicle
                          {managerSortKey === "assignedVehicle" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleManagerSort("todayTask")}>
                        <div className="flex items-center gap-1">
                          Today's Task
                          {managerSortKey === "todayTask" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 cursor-pointer select-none hover:text-slate-800" onClick={() => handleManagerSort("availability")}>
                        <div className="flex items-center gap-1">
                          Availability
                          {managerSortKey === "availability" && (
                            <ArrowUpDown size={12} className="text-blue-500" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeam.length > 0 ? (
                      filteredTeam.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{member.driver}</td>
                          <td className="p-3">
                            <CompactBadge text={member.licenseStatus} status={member.licenseStatus} />
                          </td>
                          <td className="p-3 font-mono text-slate-600">{member.assignedVehicle}</td>
                          <td className="p-3">{member.todayTask}</td>
                          <td className="p-3">
                            <CompactBadge text={member.availability} status={member.availability} />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedRequest({
                                  employee: member.driver,
                                  requestType: `Fleet Driver Verification — ${member.assignedVehicle}`,
                                  submittedDate: "Active",
                                  priority: "Medium",
                                  status: member.availability,
                                  details: `Full profile and active rosters overview for ${member.driver}. Standard task log: ${member.todayTask}.`
                                });
                                setActiveModal("viewRequest");
                              }}
                              className="text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Verify
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No team members match this query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Today's Tasks Checklist */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Today's Checklists</h4>
                <p className="text-xs text-slate-500">Tasks requiring manager confirmation today</p>
              </div>

              <div className="space-y-3">
                {managerTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      task.completed ? "border-slate-100 bg-slate-50/50 text-slate-400" : "border-slate-150 hover:border-blue-200 hover:bg-blue-50/10"
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0 text-slate-400">
                      {task.completed ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-normal ${task.completed ? "line-through" : "text-slate-800"}`}>
                        {task.text}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`inline-flex items-center text-[10px] font-semibold ${
                          task.priority === "Critical" ? "text-rose-600" : task.priority === "High" ? "text-amber-600" : "text-slate-450"
                        }`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-slate-400">• Due by {task.dueTime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Manager Expiries & Log */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Driver Activity */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Recent Driver Activity</h4>
                <p className="text-xs text-slate-500">Timeline logs specifically for your assigned fleet</p>
              </div>

              <div className="relative pl-6 border-l border-slate-150 space-y-6 ml-2 py-2">
                {managerActivities.length > 0 ? (
                  managerActivities.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[30px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-350 ring-2 ring-slate-150 group-hover:bg-blue-600" />
                      <div>
                        <h5 className="font-semibold text-xs text-slate-800">{act.title}</h5>
                        <p className="text-slate-550 text-xs mt-0.5">{act.desc}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{format(new Date(act.time), "dd MMM yyyy, hh:mm a")}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">No driver activity logs for your fleet yet.</div>
                )}
              </div>
            </div>

            {/* Upcoming Renewals warning checklist list */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Compliance Expiry Renewals</h4>
                <p className="text-xs text-slate-500">Review expiring items before they lapse</p>
              </div>

              <div className="divide-y divide-slate-150">
                {managerExpiries.length > 0 ? (
                  managerExpiries.slice(0, 6).map((exp) => (
                    <div key={exp.id} className="py-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{exp.name}</div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{exp.type} — {exp.detail}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[10px] text-slate-400">Expiry: {format(new Date(exp.date), "dd MMM yyyy")}</span>
                        <CompactBadge text={exp.status} status={exp.status} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">All fleet compliance records are currently valid. ✓</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------- OTHER ROLES STANDARDS VIEW -------------------- */}
      {!isAdmin && !isManager && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Drivers</p>
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.totalDrivers}</h3>
              <p className="mt-1 text-xs text-slate-500">Compliance registered</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Active Drivers</p>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><TrendingUp size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.activeDrivers}</h3>
              <p className="mt-1 text-xs text-slate-500">Verified for duty</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">On-Site Today</p>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><LogIn size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.onSiteCount}</h3>
              <p className="mt-1 text-xs text-slate-500">Active gate movements</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Upcoming Expiries</p>
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600"><AlertTriangle size={16} /></div>
              </div>
              <h3 className="mt-4 text-3xl font-bold text-slate-900">{data.expiringLicenses}</h3>
              <p className="mt-1 text-xs text-slate-500">Renewal flagged</p>
            </div>
          </div>

          {/* Side-by-side Tables */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Drivers Registry List */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Drivers Registry</h4>
                  <p className="text-xs text-slate-500">Roster profile records overview</p>
                </div>
                <button
                  onClick={() => navigate("/drivers")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-3">Driver Code</th>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">Transporter</th>
                      <th className="p-3">Availability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTeam.slice(0, 5).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-semibold text-slate-600">DRV-{d.id}</td>
                        <td className="p-3 font-semibold text-slate-800">{d.driver}</td>
                        <td className="p-3 text-slate-550">{d.assignedVehicle !== "—" ? "Direct Assignment" : "—"}</td>
                        <td className="p-3">
                          <CompactBadge text={d.availability} status={d.availability} />
                        </td>
                      </tr>
                    ))}
                    {myTeam.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">No driver profiles registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compliance Licenses Status List */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Compliance Licenses</h4>
                  <p className="text-xs text-slate-500">Certification validation checklists status</p>
                </div>
                <button
                  onClick={() => navigate("/licenses")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="p-3">Driver Name</th>
                      <th className="p-3">License Status</th>
                      <th className="p-3">Today Task allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTeam.slice(0, 5).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-800">{d.driver}</td>
                        <td className="p-3">
                          <CompactBadge text={d.licenseStatus} status={d.licenseStatus} />
                        </td>
                        <td className="p-3 text-slate-550">{d.todayTask}</td>
                      </tr>
                    ))}
                    {myTeam.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-400">No driver licenses registered.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------- MODAL WORKSPACE DRAWERS -------------------- */}
      {activeModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {activeModal === "createDriver" && "Create Driver Profile"}
                {activeModal === "assignManager" && "Assign Coordinator"}
                {activeModal === "uploadDocs" && "Upload Document Registry"}
                {activeModal === "approveReqs" && "Approve Requests Queue"}
                {activeModal === "genReport" && "Generate Operational Report"}
                {activeModal === "addVehicle" && "Register Fleet Vehicle"}
                {activeModal === "assignDriver" && "Assign Crew Driver"}
                {activeModal === "schedTraining" && "Schedule Certification Training"}
                {activeModal === "reviewReqs" && "Review Fleet Requests"}
                {activeModal === "viewRequest" && "Approval Request Details"}
              </h3>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedRequest(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* View Request Specific Details */}
            {activeModal === "viewRequest" && selectedRequest && (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">Employee / Driver</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{selectedRequest.employee}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wider">Request Type</p>
                    <p className="text-slate-800 mt-1">{selectedRequest.requestType}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wider">Date Submitted</p>
                    <p className="text-slate-800 mt-1">{selectedRequest.submittedDate}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wider">Priority</p>
                    <p className="text-slate-800 mt-1 font-semibold">{selectedRequest.priority}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      <CompactBadge text={selectedRequest.status} status={selectedRequest.status} />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">Full Details & Notes</p>
                  <p className="text-slate-700 bg-slate-50 rounded-lg p-3 mt-1.5 leading-relaxed">{selectedRequest.details}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      setSelectedRequest(null);
                    }}
                    className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {selectedRequest.status === "Pending" && (
                    <>
                      <button
                        onClick={() => {
                          handleRequestAction(selectedRequest.id, "Reject");
                          setActiveModal(null);
                        }}
                        className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 shadow-sm"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          handleRequestAction(selectedRequest.id, "Approve");
                          setActiveModal(null);
                        }}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 shadow-sm"
                      >
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Standard actions forms/placeholders */}
            {activeModal !== "viewRequest" && (
              <form
                onSubmit={handleFormSubmit}
                className="space-y-4 text-xs"
              >
                {activeModal === "createDriver" && (
                  <>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Full Legal Name</label>
                      <input
                        required
                        type="text"
                        value={formCreateDriver.fullName}
                        onChange={(e) => setFormCreateDriver({ ...formCreateDriver, fullName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. Samuel Green"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Father's Name (Optional)</label>
                      <input
                        type="text"
                        value={formCreateDriver.fatherName}
                        onChange={(e) => setFormCreateDriver({ ...formCreateDriver, fatherName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. Arthur Green"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Date of Birth</label>
                        <input
                          required
                          type="date"
                          value={formCreateDriver.dateOfBirth}
                          onChange={(e) => setFormCreateDriver({ ...formCreateDriver, dateOfBirth: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Mobile Contact</label>
                        <input
                          required
                          type="tel"
                          value={formCreateDriver.mobile}
                          onChange={(e) => setFormCreateDriver({ ...formCreateDriver, mobile: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                          placeholder="e.g. 0400000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={formCreateDriver.address}
                        onChange={(e) => setFormCreateDriver({ ...formCreateDriver, address: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. 12 High St, Sydney"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Blood Group</label>
                        <select
                          value={formCreateDriver.bloodGroupId}
                          onChange={(e) => setFormCreateDriver({ ...formCreateDriver, bloodGroupId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select Blood Group</option>
                          {bloodGroups.map((bg) => (
                            <option key={bg.bloodGroupId} value={bg.bloodGroupId}>{bg.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Aadhaar Card No.</label>
                        <input
                          type="text"
                          value={formCreateDriver.aadhaarNo}
                          onChange={(e) => setFormCreateDriver({ ...formCreateDriver, aadhaarNo: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                          placeholder="12 digit Aadhaar number"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeModal === "assignManager" && (
                  <>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Coordinator Full Name</label>
                      <input
                        required
                        type="text"
                        value={formAssignManager.fullName}
                        onChange={(e) => setFormAssignManager({ ...formAssignManager, fullName: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="e.g. Arthur Holmwood"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                      <input
                        required
                        type="email"
                        value={formAssignManager.email}
                        onChange={(e) => setFormAssignManager({ ...formAssignManager, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="manager@transporter.com"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Access Password</label>
                      <input
                        required
                        type="password"
                        value={formAssignManager.password}
                        onChange={(e) => setFormAssignManager({ ...formAssignManager, password: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </>
                )}

                {activeModal === "uploadDocs" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Document Type</label>
                        <select
                          value={formUploadDocs.docType}
                          onChange={(e) => setFormUploadDocs({ ...formUploadDocs, docType: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="License">Driving License Record</option>
                          <option value="Medical">Medical Fitness Report</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Select Driver</label>
                        <select
                          required
                          value={formUploadDocs.driverId}
                          onChange={(e) => setFormUploadDocs({ ...formUploadDocs, driverId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select Driver</option>
                          {(isManager && myTeam.length > 0 ? myTeam.map((d) => (
                            <option key={d.id} value={d.id}>{d.driver}</option>
                          )) : rawDrivers.map((d) => (
                            <option key={d.driverId} value={d.driverId}>{d.fullName}</option>
                          )))}
                        </select>
                      </div>
                    </div>

                    {formUploadDocs.docType === "License" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">License Number</label>
                            <input
                              required
                              type="text"
                              value={formUploadDocs.licenseNo}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, licenseNo: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                              placeholder="e.g. LIC-99882"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Vehicle Classification</label>
                            <select
                              required
                              value={formUploadDocs.vehicleTypeId}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, vehicleTypeId: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            >
                              <option value="">Select vehicle type</option>
                              {vehicleTypes.map((v) => (
                                <option key={v.vehicleTypeId} value={v.vehicleTypeId}>{v.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Issue Date</label>
                            <input
                              required
                              type="date"
                              value={formUploadDocs.issueDate}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, issueDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Expiry Date</label>
                            <input
                              required
                              type="date"
                              value={formUploadDocs.validTill}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, validTill: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Assessment Date</label>
                            <input
                              required
                              type="date"
                              value={formUploadDocs.issueDate}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, issueDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Fitness Evaluation</label>
                            <select
                              required
                              value={formUploadDocs.fitnessStatusId}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, fitnessStatusId: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            >
                              <option value="">Select status</option>
                              {fitnessStatuses.map((fs) => (
                                <option key={fs.fitnessStatusId} value={fs.fitnessStatusId}>{fs.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Blood Pressure (BP)</label>
                            <input
                              type="text"
                              value={formUploadDocs.bp}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, bp: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                              placeholder="e.g. 120/80"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Valid Till Date</label>
                            <input
                              required
                              type="date"
                              value={formUploadDocs.validTill}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, validTill: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={formUploadDocs.visionTestPass}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, visionTestPass: e.target.checked })}
                            />
                            <span>Vision Pass</span>
                          </label>
                          <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={formUploadDocs.alcoholTestPass}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, alcoholTestPass: e.target.checked })}
                            />
                            <span>Alcohol Pass</span>
                          </label>
                          <label className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-100 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={formUploadDocs.chronicIllness}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, chronicIllness: e.target.checked })}
                            />
                            <span>Chronic Illness</span>
                          </label>
                        </div>
                        {formUploadDocs.chronicIllness && (
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Illness Remarks</label>
                            <input
                              type="text"
                              value={formUploadDocs.chronicIllnessRemarks}
                              onChange={(e) => setFormUploadDocs({ ...formUploadDocs, chronicIllnessRemarks: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                              placeholder="Describe conditions..."
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {activeModal === "genReport" && (
                  <>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Report Category</label>
                      <select className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none">
                        <option>Drivers Compliance Roster</option>
                        <option>Safety Incidents Severity Breakdown</option>
                        <option>Upcoming Expirations Checklist</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Roster Range</label>
                      <select className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none">
                        <option>Current Month</option>
                        <option>Last Quarter</option>
                        <option>Complete History</option>
                      </select>
                    </div>
                  </>
                )}

                {activeModal === "addVehicle" && (
                  <>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Vehicle License Plate</label>
                      <input required type="text" className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none" placeholder="e.g. TRK-4452" />
                    </div>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Subcontractor Allocation</label>
                      <select className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none">
                        {transporters.map((t) => (
                          <option key={t.transporterId} value={t.transporterId}>{t.name}</option>
                        ))}
                        {transporters.length === 0 && <option>No active transporters</option>}
                      </select>
                    </div>
                  </>
                )}

                {activeModal === "assignDriver" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Select Driver</label>
                        <select
                          required
                          value={formAssignDriver.driverId}
                          onChange={(e) => setFormAssignDriver({ ...formAssignDriver, driverId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select Driver</option>
                          {rawDrivers.map((d) => (
                            <option key={d.driverId} value={d.driverId}>{d.fullName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Select Fleet Transporter</label>
                        {isManager && managerTransporter ? (
                          <>
                            <input
                              type="text"
                              readOnly
                              value={managerTransporter.name}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-slate-600 cursor-not-allowed"
                            />
                            <input type="hidden" value={managerTransporter.transporterId} />
                          </>
                        ) : (
                          <select
                            required
                            value={formAssignDriver.transporterId}
                            onChange={(e) => setFormAssignDriver({ ...formAssignDriver, transporterId: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                          >
                            <option value="">Select Transporter</option>
                            {transporters.map((t) => (
                              <option key={t.transporterId} value={t.transporterId}>{t.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeModal === "schedTraining" && (
                  <>
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Select Driver</label>
                      <select
                        required
                        value={formSchedTraining.driverId}
                        onChange={(e) => setFormSchedTraining({ ...formSchedTraining, driverId: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">Select Driver</option>
                        {isManager && myTeam.length > 0 ? (
                          myTeam.map((d) => (
                            <option key={d.id} value={d.id}>{d.driver}</option>
                          ))
                        ) : (
                          rawDrivers.map((d) => (
                            <option key={d.driverId} value={d.driverId}>{d.fullName}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Certification Course</label>
                        <select
                          required
                          value={formSchedTraining.trainingTypeId}
                          onChange={(e) => setFormSchedTraining({ ...formSchedTraining, trainingTypeId: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        >
                          <option value="">Select Training</option>
                          {trainingTypes.map((tt) => (
                            <option key={tt.trainingTypeId} value={tt.trainingTypeId}>{tt.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Trainer Name</label>
                        <input
                          type="text"
                          value={formSchedTraining.trainerName}
                          onChange={(e) => setFormSchedTraining({ ...formSchedTraining, trainerName: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                          placeholder="e.g. John Doe"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Date Completed</label>
                        <input
                          required
                          type="date"
                          value={formSchedTraining.dateCompleted}
                          onChange={(e) => setFormSchedTraining({ ...formSchedTraining, dateCompleted: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Valid Upto</label>
                        <input
                          required
                          type="date"
                          value={formSchedTraining.validUpto}
                          onChange={(e) => setFormSchedTraining({ ...formSchedTraining, validUpto: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 p-2.5 focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeModal === "reviewReqs" && (
                  <div className="text-center py-6 text-slate-500">
                    <p className="font-semibold text-slate-800">No requests pending review</p>
                    <p className="mt-1">All driver request queues under your supervision have been resolved.</p>
                  </div>
                )}

                {activeModal === "approveReqs" && (
                  <div className="text-center py-6 text-slate-500">
                    <p className="font-semibold text-slate-800">Please review approvals in the dashboard queue below</p>
                    <p className="mt-1">Detailed requests can be processed item-by-item in the list.</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  {activeModal !== "reviewReqs" && activeModal !== "approveReqs" && (
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 shadow-sm"
                    >
                      Process Action
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default DashboardPage;