import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Loader2 } from "lucide-react";
import { lookupService } from "@/services/lookupService";
import type { LookupItem } from "@/types/common";
import type { Driver } from "@/types/driver";

const driverFormSchema = zod.object({
  fullName: zod.string().min(3, "Full name must be at least 3 characters"),
  fatherName: zod.string().optional(),
  dateOfBirth: zod.string().refine((val) => {
    const age = new Date().getFullYear() - new Date(val).getFullYear();
    return age >= 18;
  }, "Driver must be at least 18 years old"),
  mobile: zod.string().regex(/^\d{10}$/, "Mobile must be a valid 10-digit number"),
  address: zod.string().optional(),
  bloodGroupId: zod.coerce.number().optional(),
  aadhaarNo: zod.string().regex(/^\d{12}$/, "Aadhaar must be a 12-digit number").optional().or(zod.literal("")),
  emergencyContactName: zod.string().optional(),
  emergencyContactRelation: zod.string().optional(),
  emergencyContactPhone: zod.string().regex(/^\d{10}$/, "Phone must be a valid 10-digit number").optional().or(zod.literal("")),
  remarks: zod.string().optional(),
});

type DriverFormValues = zod.infer<typeof driverFormSchema>;

interface DriverFormProps {
  driver?: Driver | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DriverForm({ driver, onSubmit, onCancel, loading = false }: DriverFormProps) {
  const [bloodGroups, setBloodGroups] = useState<LookupItem[]>([]);
  const [fetchingLookups, setFetchingLookups] = useState(true);

  useEffect(() => {
    async function loadLookups() {
      try {
        const groups = await lookupService.getBloodGroups();
        setBloodGroups(groups);
      } catch (err) {
        console.error("Error loading blood group lookups:", err);
      } finally {
        setFetchingLookups(false);
      }
    }
    loadLookups();
  }, []);

  const isEdit = !!driver;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      fullName: driver?.fullName || "",
      fatherName: driver?.fatherName || "",
      dateOfBirth: driver?.dateOfBirth ? driver.dateOfBirth.split("T")[0] : "",
      mobile: driver?.mobile || "",
      address: driver?.address || "",
      bloodGroupId: undefined, // lookup matching can be resolved on form mount
      aadhaarNo: driver?.aadhaarLast4 ? "" : "", // Note: Aadhaar is write-only on create for security
      emergencyContactName: driver?.emergencyContactName || "",
      emergencyContactRelation: driver?.emergencyContactRelation || "",
      emergencyContactPhone: driver?.emergencyContactPhone || "",
      remarks: driver?.remarks || "",
    },
  });

  const handleFormSubmit = (values: DriverFormValues) => {
    // Exclude fields based on create vs update payload requirements
    const payload = { ...values };
    if (isEdit) {
      delete (payload as any).aadhaarNo; // Update driver has no Aadhaar parameter
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Full Name *
          </label>
          <input
            type="text"
            disabled={loading}
            {...register("fullName")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>}
        </div>

        {/* Father Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Father's Name
          </label>
          <input
            type="text"
            disabled={loading}
            {...register("fatherName")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* DOB */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Date of Birth *
          </label>
          <input
            type="date"
            disabled={loading}
            {...register("dateOfBirth")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.dateOfBirth && <p className="mt-1 text-xs text-rose-600">{errors.dateOfBirth.message}</p>}
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Mobile Number *
          </label>
          <input
            type="text"
            maxLength={10}
            disabled={loading}
            {...register("mobile")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.mobile && <p className="mt-1 text-xs text-rose-600">{errors.mobile.message}</p>}
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Blood Group
          </label>
          <select
            disabled={loading || fetchingLookups}
            {...register("bloodGroupId")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select Blood Group</option>
            {bloodGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name}
              </option>
            ))}
          </select>
        </div>

        {/* Aadhaar (Create Only) */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aadhaar Number (12 digits)
            </label>
            <input
              type="text"
              maxLength={12}
              disabled={loading}
              {...register("aadhaarNo")}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            {errors.aadhaarNo && <p className="mt-1 text-xs text-rose-600">{errors.aadhaarNo.message}</p>}
          </div>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Current Address
        </label>
        <textarea
          rows={2}
          disabled={loading}
          {...register("address")}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Emergency Contact Details
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Contact Name */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400">Name</label>
            <input
              type="text"
              disabled={loading}
              {...register("emergencyContactName")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Relation */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400">Relation</label>
            <input
              type="text"
              disabled={loading}
              {...register("emergencyContactRelation")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400">Phone</label>
            <input
              type="text"
              maxLength={10}
              disabled={loading}
              {...register("emergencyContactPhone")}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
            {errors.emergencyContactPhone && <p className="mt-1 text-xs text-rose-600">{errors.emergencyContactPhone.message}</p>}
          </div>
        </div>
      </div>

      {/* Remarks (Edit only) */}
      {isEdit && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Compliance Remarks
          </label>
          <textarea
            rows={2}
            disabled={loading}
            {...register("remarks")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
      )}

      {/* Form Action buttons */}
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-650"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Save Changes" : "Create Driver"}
        </button>
      </div>
    </form>
  );
}
export default DriverForm;
