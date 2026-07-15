import { useState } from "react";
import toast from "react-hot-toast";
import { DriverForm } from "./DriverForm";
import { LicenseStepForm } from "./LicenseStepForm";
import { driverService } from "@/services/driverService";

interface DriverCreationWizardProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DriverCreationWizard({ onSuccess, onCancel }: DriverCreationWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [driverData, setDriverData] = useState<any>(null);
  const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
  const [licenseData, setLicenseData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Called when Step 1 (Driver Form) is submitted
  const handleDriverSubmit = async (data: any, photo?: File | null) => {
    setDriverData(data);
    if (photo !== undefined) {
      setDriverPhoto(photo);
    }
    setStep(2);
  };

  // Called when Step 2 (License Form) is submitted (Full save)
  const handleLicenseSubmit = async (licenseFormValues: any, document?: File | null) => {
    setSubmitting(true);
    try {
      // Build combined payload matching CreateDriverWithLicenseRequest
      const payload = {
        ...driverData,
        licenseNo: licenseFormValues.licenseNo,
        licenseIssueDate: licenseFormValues.issueDate,
        licenseValidTill: licenseFormValues.validTill,
        vehicleTypeId: licenseFormValues.vehicleTypeId,
        endorsementIds: licenseFormValues.endorsementIds,
      };

      await driverService.createWithLicense(payload, driverPhoto, document);
      toast.success("Driver and license created successfully.");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save driver and license.");
    } finally {
      setSubmitting(false);
    }
  };

  // Called if user skips Step 2 (Save Driver only)
  const handleSkipAndSave = async () => {
    setSubmitting(true);
    try {
      // Build combined payload with just driver fields
      const payload = {
        ...driverData,
      };
      await driverService.createWithLicense(payload, driverPhoto, null);
      toast.success("Driver profile created successfully.");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create driver.");
    } finally {
      setSubmitting(false);
    }
  };

  // Called when returning to Step 1
  const handleBackToDriver = (currentLicenseValues: any) => {
    setLicenseData(currentLicenseValues);
    setStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Wizard Header & Stepper Progress */}
      <div className="flex flex-col items-center justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row dark:border-slate-800/60">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Add New Driver Wizard
          </h3>
          <p className="text-xs text-slate-400">
            Create driver profile and license details in a structured workflow
          </p>
        </div>

        {/* Stepper Steps visual */}
        <div className="flex items-center gap-2">
          {/* Step 1 indicator */}
          <div className="flex items-center gap-1.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 1 
                ? "bg-blue-600 text-white dark:bg-blue-500" 
                : "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
            }`}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? "text-slate-850 dark:text-white" : "text-slate-400"}`}>
              Driver Details
            </span>
          </div>

          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />

          {/* Step 2 indicator */}
          <div className="flex items-center gap-1.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              step === 2 
                ? "bg-blue-600 text-white dark:bg-blue-500" 
                : "bg-slate-100 text-slate-400 dark:bg-slate-900"
            }`}>
              2
            </span>
            <span className={`text-xs font-semibold ${step === 2 ? "text-slate-850 dark:text-white" : "text-slate-400"}`}>
              License Details
            </span>
          </div>
        </div>
      </div>

      {/* Render Steps */}
      {step === 1 ? (
        <div className="transition-all duration-300">
          <DriverForm
            driver={driverData} // pass populated values if they went back
            onSubmit={handleDriverSubmit}
            onCancel={onCancel}
            loading={submitting}
          />
        </div>
      ) : (
        <div className="space-y-6 transition-all duration-300">
          <div className="flex justify-between items-center rounded-xl bg-amber-50/50 p-4 border border-amber-100 dark:bg-amber-950/10 dark:border-amber-900/30">
            <div className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              <strong>Optional step:</strong> You can add licensing details now, or skip this step and save the driver profile directly. All information is processed securely inside a database transaction.
            </div>
            <button
              type="button"
              onClick={handleSkipAndSave}
              disabled={submitting}
              className="ml-4 shrink-0 text-xs font-bold text-amber-700 bg-amber-100/60 hover:bg-amber-100 rounded-lg px-3 py-1.5 dark:text-amber-400 dark:bg-amber-950/60"
            >
              Skip & Save Driver Only
            </button>
          </div>

          <LicenseStepForm
            defaultValues={licenseData}
            onSubmit={handleLicenseSubmit}
            onBack={handleBackToDriver}
            loading={submitting}
          />
        </div>
      )}
    </div>
  );
}
export default DriverCreationWizard;
