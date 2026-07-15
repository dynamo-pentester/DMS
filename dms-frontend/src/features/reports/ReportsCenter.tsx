import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Filter, RotateCcw, Loader2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import LicenseDriverSelect from "@/components/common/LicenseDriverSelect";
import type { ReportType } from "@/types/report";
import { api } from "@/api/axiosInstance";

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

const REPORT_CARDS: ReportCard[] = [
  { id: "DriverCompliance", title: "Driver Compliance Summary", description: "Overview of license, medical, and training compliance per driver.", icon: "📊", color: "text-blue-700", gradientFrom: "from-blue-500", gradientTo: "to-indigo-600" },
  { id: "LicenseExpiry", title: "License Expiry Report", description: "List of all expiring and expired driving licenses with renewal urgency.", icon: "🪪", color: "text-amber-700", gradientFrom: "from-amber-400", gradientTo: "to-orange-500" },
  { id: "MedicalExpiry", title: "Medical Expiry Report", description: "Fitness certification expiry status for all registered drivers.", icon: "🏥", color: "text-rose-700", gradientFrom: "from-rose-500", gradientTo: "to-pink-600" },
  { id: "TrainingExpiry", title: "Training Expiry Report", description: "Training program completion status and renewal requirements.", icon: "📋", color: "text-violet-700", gradientFrom: "from-violet-500", gradientTo: "to-purple-600" },
  { id: "IncidentSummary", title: "Incident Summary Report", description: "Statistical breakdown of incidents by type, severity, and fault attribution.", icon: "⚠️", color: "text-orange-700", gradientFrom: "from-orange-400", gradientTo: "to-red-500" },
  { id: "TransporterPerformance", title: "Transporter Performance", description: "Incident rate, compliance score, and driver count per transporter.", icon: "🚛", color: "text-sky-700", gradientFrom: "from-sky-400", gradientTo: "to-cyan-600" },
];

export function ReportsCenter() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [licenseId, setLicenseId] = useState<string>("");
  const [driverId, setDriverId] = useState<string>("");
  const [plantId, setPlantId] = useState<string>("");
  const [downloadingId, setDownloadingId] = useState<ReportType | null>(null);

  const handleDownload = async (report: ReportCard) => {
    try {
      setDownloadingId(report.id);

      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (driverId) params.driverId = driverId;
      if (plantId) params.plantId = plantId;

      // Use the shared Axios instance — the request interceptor automatically
      // attaches "Authorization: Bearer <token>" from the Zustand auth store,
      // which is the same JWT that every other API call in this app uses.
      const response = await api.get(
        `/reports/${report.id.toLowerCase()}`,
        { params, responseType: "blob" }
      );

      const blob: Blob = response.data;
      const contentType = String(response.headers["content-type"] || "");
      const ext =
        contentType.includes("excel") || contentType.includes("spreadsheet")
          ? ".xlsx"
          : contentType.includes("csv")
            ? ".csv"
            : ".pdf";
      const filename = `${report.id}_${dateFrom || "all"}_${dateTo || "all"}${ext}`;

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);

      toast.success(`${report.title} downloaded`);
    } catch {
      toast.error("Report download failed. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setLicenseId("");
    setDriverId("");
    setPlantId("");
  };

  const hasFilters = dateFrom || dateTo || licenseId || plantId;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        description="Generate and download compliance, incident, and movement reports. Apply date and driver filters before downloading."
      />

      {/* Global Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Report Filters</h3>
          {hasFilters && (
            <button onClick={resetFilters} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700">
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">From Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">To Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
          </div>
          <div>
            <LicenseDriverSelect
              label="License ID"
              value={licenseId}
              onChange={(newLicenseId, license) => {
                setLicenseId(newLicenseId);
                setDriverId(license?.driverId ? String(license.driverId) : "");
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Plant ID</label>
            <input type="number" value={plantId} onChange={e => setPlantId(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_CARDS.map((report) => {
          const isDownloading = downloadingId === report.id;
          return (
            <div key={report.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Top gradient stripe */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${report.gradientFrom} ${report.gradientTo}`} />

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 text-3xl leading-none">{report.icon}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{report.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{report.description}</p>

                <button onClick={() => handleDownload(report)} disabled={isDownloading}
                  className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${report.gradientFrom} ${report.gradientTo} px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-opacity`}>
                  {isDownloading ? (
                    <><Loader2 size={15} className="animate-spin" /> Generating...</>
                  ) : (
                    <><Download size={15} /> Download Report</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ReportsCenter;
