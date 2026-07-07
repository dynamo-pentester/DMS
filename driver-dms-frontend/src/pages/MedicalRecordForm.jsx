import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getMedicalRecord, createMedicalRecord, updateMedicalRecord } from "../services/medicalService";
import { useLookupStore } from "../store/userStore";
import { toInputDate } from "../utils/dateFormat";

export default function MedicalRecordForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fitnessStatuses = useLookupStore((s) => s.fitnessStatuses);

  const [form, setForm] = useState({
    driverId: searchParams.get("driverId") || "",
    examDate: "",
    fitnessStatusId: "",
    bp: "",
    visionTestPass: true,
    alcoholTestPass: true,
    chronicIllness: false,
    chronicIllnessRemarks: "",
    validTill: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getMedicalRecord(id).then((res) => {
        const m = res.data;
        setForm({
          driverId: m.driverId,
          examDate: toInputDate(m.examDate),
          fitnessStatusId: "",
          bp: m.bp || "",
          visionTestPass: m.visionTestPass,
          alcoholTestPass: m.alcoholTestPass,
          chronicIllness: m.chronicIllness,
          chronicIllnessRemarks: m.chronicIllnessRemarks || "",
          validTill: toInputDate(m.validTill),
        });
      });
    }
  }, [id, isEdit]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const updateCheck = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        driverId: Number(form.driverId),
        fitnessStatusId: Number(form.fitnessStatusId),
      };
      if (isEdit) {
        delete payload.driverId;
        await updateMedicalRecord(id, payload);
      } else {
        await createMedicalRecord(payload);
      }
      navigate("/medical-records");
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isEdit ? "Edit Medical Record" : "New Medical Record"}</h1>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        {!isEdit && (
          <label>
            Driver ID
            <input type="number" value={form.driverId} onChange={update("driverId")} required />
          </label>
        )}
        <label>
          Exam Date
          <input type="date" value={form.examDate} onChange={update("examDate")} required />
        </label>
        <label>
          Fitness Status
          <select value={form.fitnessStatusId} onChange={update("fitnessStatusId")} required>
            <option value="">-- Select --</option>
            {fitnessStatuses.map((f) => (
              <option key={f.fitnessStatusId} value={f.fitnessStatusId}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          BP
          <input value={form.bp} onChange={update("bp")} placeholder="e.g. 120/80" />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.visionTestPass} onChange={updateCheck("visionTestPass")} />
          Vision Test Pass
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.alcoholTestPass}
            onChange={updateCheck("alcoholTestPass")}
          />
          Alcohol Test Pass
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.chronicIllness} onChange={updateCheck("chronicIllness")} />
          Chronic Illness
        </label>
        {form.chronicIllness && (
          <label>
            Chronic Illness Remarks
            <input value={form.chronicIllnessRemarks} onChange={update("chronicIllnessRemarks")} />
          </label>
        )}
        <label>
          Valid Till
          <input type="date" value={form.validTill} onChange={update("validTill")} required />
        </label>

        <div className="form-actions">
          <button className="btn-secondary" type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
