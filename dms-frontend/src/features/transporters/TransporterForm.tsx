import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Loader2 } from "lucide-react";
import type { Transporter } from "@/types/transporter";

const transporterFormSchema = zod.object({
  name: zod.string().min(2, "Transporter name must be at least 2 characters"),
  contactPerson: zod.string().min(2, "Contact person name must be at least 2 characters").optional().or(zod.literal("")),
  mobile: zod.string().regex(/^\d{10}$/, "Mobile must be a valid 10-digit number").optional().or(zod.literal("")),
  address: zod.string().optional().or(zod.literal("")),
  agreementValidTill: zod.string().min(1, "Agreement expiry date is required"),
  isActive: zod.boolean().default(true),
});

type TransporterFormValues = zod.infer<typeof transporterFormSchema>;

interface TransporterFormProps {
  transporter?: Transporter | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TransporterForm({
  transporter,
  onSubmit,
  onCancel,
  loading = false,
}: TransporterFormProps) {
  const isEdit = !!transporter;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransporterFormValues>({
    resolver: zodResolver(transporterFormSchema),
    defaultValues: {
      name: transporter?.name || "",
      contactPerson: transporter?.contactPerson || "",
      mobile: transporter?.mobile || "",
      address: transporter?.address || "",
      agreementValidTill: transporter?.agreementValidTill ? transporter.agreementValidTill.split("T")[0] : "",
      isActive: transporter ? transporter.isActive : true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Transporter Agency Name *
        </label>
        <input
          type="text"
          disabled={loading}
          {...register("name")}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
        {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Contact Person
          </label>
          <input
            type="text"
            disabled={loading}
            {...register("contactPerson")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.contactPerson && <p className="mt-1 text-xs text-rose-600">{errors.contactPerson.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Mobile Number
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Agreement Expiry Date *
          </label>
          <input
            type="date"
            disabled={loading}
            {...register("agreementValidTill")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
          {errors.agreementValidTill && <p className="mt-1 text-xs text-rose-600">{errors.agreementValidTill.message}</p>}
        </div>

        {isEdit && (
          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-350 cursor-pointer">
              <input
                type="checkbox"
                disabled={loading}
                {...register("isActive")}
                className="rounded text-blue-600 focus:ring-blue-500/20"
              />
              Agency Status Active
            </label>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Registered Address
        </label>
        <textarea
          rows={3}
          disabled={loading}
          {...register("address")}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
      </div>

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
          {isEdit ? "Save Changes" : "Register Agency"}
        </button>
      </div>
    </form>
  );
}
export default TransporterForm;
