/**
 * Builds a FormData instance from a plain request payload, for the Create endpoints
 * that now accept multipart/form-data (entity fields + an optional file in a single
 * request). Model binding on the API side is case-insensitive, so key casing here
 * doesn't need to match the C# DTO property names.
 *
 * - undefined/null/"" values are skipped so optional fields don't get sent as the
 *   literal string "undefined"/"null".
 * - Arrays (e.g. endorsementIds) are appended as repeated entries under the same
 *   key, which ASP.NET Core model binding maps onto a List<T>.
 * - Booleans/numbers are stringified since FormData only holds strings/Blobs.
 */
export function buildFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          formData.append(key, String(item));
        }
      });
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export default buildFormData;
