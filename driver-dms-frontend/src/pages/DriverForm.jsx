import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDriver, createDriver, updateDriver } from "../services/driverService";
import { useLookupStore } from "../store/userStore";
import { toInputDate } from "../utils/dateFormat";

const EMPTY_FORM = {
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
  remarks: "",
};

export default function DriverForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const bloodGroups = useLookupStore((s) => s.bloodGroups);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getDriver(id).then((res) => {
        const d = res.data;
        setForm({
          fullName: d.fullName || "",
          fatherName: d.fatherName || "",
          dateOfBirth: toInputDate(d.dateOfBirth),
          mobile: d.mobile || "",
          address: d.address || "",
          bloodGroupId: "", // DriverDto returns bloodGroupName only; re-select on edit
          aadhaarNo: "",
          emergencyContactName: d.emergencyContactName || "",
          emergencyContactRelation: d.emergencyContactRelation || "",
          emergencyContactPhone: d.emergencyContactPhone || "",
          remarks: d.remarks || "",
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
  bloodGroupId: form.bloodGroupId ? Number(form.bloodGroupId) : null,
  dateOfBirth: new Date(form.dateOfBirth).toISOString(),
  aadhaarNo: form.aadhaarNo ? form.aadhaarNo.trim() : null,
};
      if (isEdit) {
        delete payload.aadhaarNo; // UpdateDriverRequest has no AadhaarNo field
        await updateDriver(id, payload);
        navigate(`/drivers/${id}`);
      } else {
        const res = await createDriver(payload);
        navigate(`/drivers/${res.data.driverId}`);
      }
    } catch (err) {
      const data = err.response?.data;
      let message = data?.error || "Save failed.";
      if (data?.errors) {
        message = Object.values(data.errors).flat().join(", ");
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{isEdit ? "Edit Driver" : "New Driver"}</h1>
      <form className="entity-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label>
          Full Name
          <input value={form.fullName} onChange={update("fullName")} required />
        </label>
        <label>
          Father's Name
          <input value={form.fatherName} onChange={update("fatherName")} />
        </label>
        <label>
          Date of Birth
          <input type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} required />
        </label>
        <label>
          Mobile
          <input value={form.mobile} onChange={update("mobile")} required />
        </label>
        <label>
          Address
          <input value={form.address} onChange={update("address")} />
        </label>
        <label>
          Blood Group
          <select value={form.bloodGroupId} onChange={update("bloodGroupId")}>
            <option value="">-- Select --</option>
            {bloodGroups.map((b) => (
              <option key={b.bloodGroupId} value={b.bloodGroupId}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {!isEdit && (
          <label>
            Aadhaar No.
            <input value={form.aadhaarNo} onChange={update("aadhaarNo")} />
          </label>
        )}
        <label>
          Emergency Contact Name
          <input value={form.emergencyContactName} onChange={update("emergencyContactName")} />
        </label>
        <label>
          Emergency Contact Relation
          <input
            value={form.emergencyContactRelation}
            onChange={update("emergencyContactRelation")}
          />
        </label>
        <label>
          Emergency Contact Phone
          <input value={form.emergencyContactPhone} onChange={update("emergencyContactPhone")} />
        </label>
        {isEdit && (
          <label>
            Remarks
            <textarea value={form.remarks} onChange={update("remarks")} />
          </label>
        )}

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
