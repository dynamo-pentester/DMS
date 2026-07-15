import { useEffect, useState } from "react";
import { api } from "@/api/axiosInstance";

interface MedicalRecord {
  medicalRecordId: number;
  driverId: number;
  driverName: string;
  examDate: string;
  fitnessStatusName: string;
  bp: string;
  visionTestPass: boolean;
  alcoholTestPass: boolean;
  chronicIllness: boolean;
  chronicIllnessRemarks: string;
  validTill: string;
  status: string;
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedicalRecords() {
      try {
        const { data } = await api.get("/medical-records?page=1&pageSize=10");

        console.log("===== MEDICAL RECORDS =====");
        console.log(data);

        setRecords(data.items ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchMedicalRecords();
  }, []);

  if (loading) {
    return <h2 className="p-6">Loading Medical Records...</h2>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-5">Medical Records</h1>

      <table className="w-full border border-collapse">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Driver</th>
            <th className="border p-2">Exam Date</th>
            <th className="border p-2">Fitness</th>
            <th className="border p-2">Blood Pressure</th>
            <th className="border p-2">Vision Test</th>
            <th className="border p-2">Alcohol Test</th>
            <th className="border p-2">Chronic Illness</th>
            <th className="border p-2">Remarks</th>
            <th className="border p-2">Valid Till</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>

        <tbody>
          {records.length > 0 ? (
            records.map((record) => (
              <tr key={record.medicalRecordId}>
                <td className="border p-2">{record.driverName}</td>

                <td className="border p-2">
                  {new Date(record.examDate).toLocaleDateString()}
                </td>

                <td className="border p-2">
                  {record.fitnessStatusName}
                </td>

                <td className="border p-2">
                  {record.bp}
                </td>

                <td className="border p-2">
                  {record.visionTestPass ? "Pass" : "Fail"}
                </td>

                <td className="border p-2">
                  {record.alcoholTestPass ? "Pass" : "Fail"}
                </td>

                <td className="border p-2">
                  {record.chronicIllness ? "Yes" : "No"}
                </td>

                <td className="border p-2">
                  {record.chronicIllnessRemarks || "-"}
                </td>

                <td className="border p-2">
                  {new Date(record.validTill).toLocaleDateString()}
                </td>

                <td className="border p-2">
                  {record.status}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="border p-4 text-center">
                No medical records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}