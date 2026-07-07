import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getTraining, createTraining, updateTraining } from "../services/trainingService";
import { useLookupStore } from "../store/userStore";
import { toInputDate } from "../utils/dateFormat";

export default function TrainingForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trainingTypes = useLookupStore((s) => s.trainingTypes);

  const [form, setForm] = useState({
    driverId: searchParams.get("driverId") || "",
    trainingTypeId: "",
    dateCompleted: "",
    validUpto: "",
    trainerName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getTraining(id).then((res) => {
        const t = res.data;
        setForm({
          driverId: t.driverId,
          trainingTypeId: "",
          dateCompleted: toInputDate(t.dateCompleted),
          validUpto: toInputDate(t.validUpto),
          trainerName: t.trainerName || "",
        });
      });
    }
  }, [id, isEdit]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        driverId: Number(form.driverId),
        trainingTypeId: Number(form.trainingTypeId),
      };
      if (isEdit) {
        delete payload.driverId;
        await updateTraining(id, payload);
      } else {
        await createTraining(payload);
      }
      navigate("/trainings");
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isEdit ? "Edit Training" : "New Training"}</h1>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        {!isEdit && (
          <label>
            Driver ID
            <input type="number" value={form.driverId} onChange={update("driverId")} required />
          </label>
        )}
        <label>
          Training Type
          <select value={form.trainingTypeId} onChange={update("trainingTypeId")} required>
            <option value="">-- Select --</option>
            {trainingTypes.map((t) => (
              <option key={t.trainingTypeId} value={t.trainingTypeId}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date Completed
          <input type="date" value={form.dateCompleted} onChange={update("dateCompleted")} required />
        </label>
        <label>
          Valid Upto
          <input type="date" value={form.validUpto} onChange={update("validUpto")} required />
        </label>
        <label>
          Trainer Name
          <input value={form.trainerName} onChange={update("trainerName")} />
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
