import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { lookupService } from "@/services/lookupService";
import InlineFileSelect from "@/components/common/InlineFileSelect";
import type { LookupItem } from "@/types/common";

const licenseStepSchema = zod.object({
  licenseNo: zod.string().min(5, "License number must be at least 5 characters"),
  vehicleTypeId: zod.coerce.number().min(1, "Vehicle type is required"),
  issueDate: zod.string().min(1, "Issue date is required"),
  validTill: zod.string().min(1, "Expiry date is required"),
  endorsementIds: zod.array(zod.coerce.number()).optional().default([]),
}).refine((data) => {
  if (data.issueDate && data.validTill) {
    return new Date(data.validTill) > new Date(data.issueDate);
  }
  return true;
}, {
  message: "Expiry date must be after issue date",
  path: ["validTill"],
});

type LicenseStepValues = zod.infer<typeof licenseStepSchema>;

interface LicenseStepFormProps {
  defaultValues?: Partial<LicenseStepValues>;
  onSubmit: (data: LicenseStepValues, document?: File | null) => void;
  onBack: (currentValues: Partial<LicenseStepValues>) => void;
  loading?: boolean;
}

export function LicenseStepForm({ defaultValues, onSubmit, onBack, loading = false }: LicenseStepFormProps) {
  const [vehicleTypes, setVehicleTypes] = useState<LookupItem[]>([]);
  const [endorsementList, setEndorsementList] = useState<LookupItem[]>([]);
  const [fetchingLookups, setFetchingLookups] = useState(true);
  const [document, setDocument] = useState<File | null>(null);

  useEffect(() => {
    async function loadLookups() {
      try {
        const [vTypes, ends] = await Promise.all([
          lookupService.getVehicleTypes(),
          lookupService.getEndorsements(),
        ]);
        setVehicleTypes(vTypes);
        setEndorsementList(ends);
      } catch (err) {
        console.error("Error loading lookups:", err);
      } finally {
        setFetchingLookups(false);
      }
    }
    loadLookups();
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LicenseStepValues>({
    resolver: zodResolver(licenseStepSchema),
    defaultValues: {
      licenseNo: defaultValues?.licenseNo || "",
      vehicleTypeId: defaultValues?.vehicleTypeId || undefined,
      issueDate: defaultValues?.issueDate || "",
      validTill: defaultValues?.validTill || "",
      endorsementIds: defaultValues?.endorsementIds || [],
    },
  });

  const handleFormSubmit = (values: LicenseStepValues) => {
    onSubmit(values, document);
  };

  const handleBackClick = () => {
    const currentValues = getValues();
    onBack(currentValues);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* License Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            License Number *
          </label>
          <input
            type="text"
            disabled={loading}
            {...register("licenseNo")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.licenseNo && <p className="mt-1 text-xs text-rose-600">{errors.licenseNo.message}</p>}
        </div>

        {/* Vehicle Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Vehicle Type *
          </label>
          <select
            disabled={loading || fetchingLookups}
            {...register("vehicleTypeId")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select Vehicle Type</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>
                {vt.name}
              </option>
            ))}
          </select>
          {errors.vehicleTypeId && <p className="mt-1 text-xs text-rose-600">{errors.vehicleTypeId.message}</p>}
        </div>

        {/* Issue Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Issue Date *
          </label>
          <input
            type="date"
            disabled={loading}
            {...register("issueDate")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.issueDate && <p className="mt-1 text-xs text-rose-600">{errors.issueDate.message}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Valid Till *
          </label>
          <input
            type="date"
            disabled={loading}
            {...register("validTill")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.validTill && <p className="mt-1 text-xs text-rose-600">{errors.validTill.message}</p>}
        </div>
      </div>

      {/* Endorsements (Checkboxes) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Endorsements
        </label>
        {fetchingLookups ? (
          <p className="text-xs text-slate-400">Loading endorsements...</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl border border-slate-100 p-3 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-900/20">
            {endorsementList.map((end) => (
              <label key={end.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  value={end.id}
                  disabled={loading}
                  {...register("endorsementIds")}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
                />
                {end.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Scanned Licence Upload */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
          Scanned License Document
        </label>
        <InlineFileSelect
          label="License Document"
          variant="document"
          accept="application/pdf,image/jpeg,image/png"
          allowedExtensions={[".pdf", ".jpg", ".jpeg", ".png"]}
          maxSizeMb={10}
          hint="PDF, JPG or PNG up to 10 MB"
          value={document}
          onChange={setDocument}
          disabled={loading}
        />
      </div>

      {/* Footer / Stepper controls */}
      <div className="flex justify-between items-center border-t border-slate-100 pt-4 dark:border-slate-800/60">
        <button
          type="button"
          onClick={handleBackClick}
          disabled={loading}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800"
        >
          Back to Driver Details
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-650"
        >
          Save Driver & License
        </button>
      </div>
    </form>
  );
}
export default LicenseStepForm;
