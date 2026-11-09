import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// ─── Shared hook for the case-tab sub-pages ───────────────────────────────────
// Fetches the real case from the backend using the :caseId route parameter and
// the JWT from localStorage. Renders exactly what the database returns — if a
// field is empty, the UI shows it empty (no fabricated text).

const getAuthToken = () =>
  localStorage.getItem('case_lens_token') || localStorage.getItem('token');

export const asText = (value) => {
  if (value == null) return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join('\n');
  }
  return String(value).trim();
};

// Renders the raw database value as text. If the field is empty/missing the
// result is intentionally EMPTY — the UI shows exactly what the DB has.
export const orUnavailable = (label, value) => asText(value);

export default function useCaseData() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const token = getAuthToken();
    if (!token || !caseId) {
      setLoading(false);
      return;
    }
    axios
      .get(`/api/workspace/case/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (alive && response.data?.success && response.data?.data) {
          setCaseData(response.data.data);
        }
      })
      .catch(() => {
        /* keep fallbacks visible */
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

  return { caseId, caseData, loading };
}
