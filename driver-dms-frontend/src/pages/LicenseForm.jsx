import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getLicense, createLicense, updateLicense } from "../services/licenseService";
import { useLookupStore } from "../store/userStore";
import { toInputDate } from "../utils/dateFormat";

export default function LicenseForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleTypes = useLookupStore((s) => s.vehicleTypes);
  const endorsements = useLookupStore((s) => s.endorsements);

  const [form, setForm] = useState({
    driverId: searchParams.get("driverId") || "",
    licenseNo: "",
    issueDate: "",
    validTill: "",
    vehicleTypeId: "",
    endorsementIds: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getLicense(id).then((res) => {
        const l = res.data;
        setForm({
          driverId: l.driverId,
          licenseNo: l.licenseNo,
          issueDate: toInputDate(l.issueDate),
          validTill: toInputDate(l.validTill),
          vehicleTypeId: "", // resolved by name only in LicenseDto; re-select on edit
          endorsementIds: [],
        });
      });
    }
  }, [id, isEdit]);

  const toggleEndorsement = (endorsementId) => {
    setForm((f) => ({
      ...f,
      endorsementIds: f.endorsementIds.includes(endorsementId)
        ? f.endorsementIds.filter((e) => e !== endorsementId)
        : [...f.endorsementIds, endorsementId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        driverId: Number(form.driverId),
        vehicleTypeId: Number(form.vehicleTypeId),
      };
      if (isEdit) {
        delete payload.driverId; // UpdateLicenseRequest has no driverId
        await updateLicense(id, payload);
      } else {
        await createLicense(payload);
      }
      navigate("/licenses");
    } catch (err) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isEdit ? "Edit License" : "New License"}</h1>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        {!isEdit && (
          <label>
            Driver ID
            <input
              type="number"
              value={form.driverId}
              onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
              required
            />
          </label>
        )}
        <label>
          License No
          <input
            value={form.licenseNo}
            onChange={(e) => setForm((f) => ({ ...f, licenseNo: e.target.value }))}
            required
          />
        </label>
        <label>
          Issue Date
          <input
            type="date"
            value={form.issueDate}
            onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))}
            required
          />
        </label>
        <label>
          Valid Till
          <input
            type="date"
            value={form.validTill}
            onChange={(e) => setForm((f) => ({ ...f, validTill: e.target.value }))}
            required
          />
        </label>
        <label>
          Vehicle Type
          <select
            value={form.vehicleTypeId}
            onChange={(e) => setForm((f) => ({ ...f, vehicleTypeId: e.target.value }))}
            required
          >
            <option value="">-- Select --</option>
            {vehicleTypes.map((v) => (
              <option key={v.vehicleTypeId} value={v.vehicleTypeId}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Endorsements</legend>
          {endorsements.map((e) => (
            <label key={e.endorsementId} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.endorsementIds.includes(e.endorsementId)}
                onChange={() => toggleEndorsement(e.endorsementId)}
              />
              {e.name}
            </label>
          ))}
        </fieldset>

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
