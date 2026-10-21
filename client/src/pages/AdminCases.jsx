import React, { useState, useEffect } from 'react';

// Use relative URL if using Vite proxy, with localhost fallback
const API_BASE_URL = '/api/admin/cases';

export default function AdminCases() {
  const initialFormState = {
    caseTitle: '',
    citation: '',
    courtName: '',
    judgeNames: '',
    decisionDate: '',
    caseType: 'Criminal',
    summary: '',
    fullText: '',
    keywords: '',
    verdict: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all cases on component mount
  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(API_BASE_URL);
      const data = await res.json();
      if (data.success) {
        setCases(data.data || []);
      } else {
        setErrorMessage(data.message || 'Failed to fetch cases.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      // Fallback direct request in case proxy is not running
      try {
        const fallbackRes = await fetch('http://localhost:5000/api/admin/cases');
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          setCases(fallbackData.data || []);
          return;
        }
      } catch (e) {
        setErrorMessage('Could not connect to backend server. Make sure it is running on port 5000.');
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Prepare payload (convert comma-separated keywords to array)
    const payload = {
      ...formData,
      keywords: formData.keywords
        ? formData.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : [],
    };

    try {
      let res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Fallback if proxy error
      if (!res.ok && res.status === 404) {
        res = await fetch('http://localhost:5000/api/admin/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('Case added successfully to the repository!');
        setFormData(initialFormState);
        fetchCases();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.message || 'Failed to add case. Please check inputs.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('Server connection error. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filter cases by title, court, citation, or keywords
  const filteredCases = cases.filter((c) => {
    const query = searchTerm.toLowerCase();
    const titleMatch = c.caseTitle?.toLowerCase().includes(query);
    const citationMatch = c.citation?.toLowerCase().includes(query);
    const courtMatch = c.courtName?.toLowerCase().includes(query);
    const keywordMatch = c.keywords?.some((k) => k.toLowerCase().includes(query));
    return titleMatch || citationMatch || courtMatch || keywordMatch;
  });

  return (
    <div style={styles.pageContainer}>
      {/* Page Header */}
      <header style={styles.header}>
        <div style={styles.headerBadge}>Admin Portal</div>
        <h1 style={styles.headerTitle}>Legal Case Management</h1>
        <p style={styles.headerSubtitle}>
          Case Lens AI &mdash; Register, catalog, and index legal precedents and court decisions.
        </p>
      </header>

      {/* Alert Banners */}
      {successMessage && (
        <div style={styles.alertSuccess}>
          <span style={styles.alertIcon}>✅</span>
          <span>{successMessage}</span>
          <button style={styles.alertCloseBtn} onClick={() => setSuccessMessage('')}>&times;</button>
        </div>
      )}

      {errorMessage && (
        <div style={styles.alertError}>
          <span style={styles.alertIcon}>⚠️</span>
          <span>{errorMessage}</span>
          <button style={styles.alertCloseBtn} onClick={() => setErrorMessage('')}>&times;</button>
        </div>
      )}

      {/* Case Input Form Card */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>➕ Add New Legal Case</h2>
          <span style={styles.cardSubtitle}>Fill in all details to index case into database</span>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Case Title */}
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>
                Case Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="caseTitle"
                value={formData.caseTitle}
                onChange={handleChange}
                placeholder="e.g. Federation of Pakistan vs. Gulzar Ahmed"
                required
                style={styles.input}
              />
            </div>

            {/* Citation */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Citation</label>
              <input
                type="text"
                name="citation"
                value={formData.citation}
                onChange={handleChange}
                placeholder="e.g. PLD 2024 SC 182"
                style={styles.input}
              />
            </div>

            {/* Court Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Court Name <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="courtName"
                value={formData.courtName}
                onChange={handleChange}
                placeholder="e.g. Supreme Court of Pakistan"
                required
                style={styles.input}
              />
            </div>

            {/* Judge Names */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Bench / Judge Names</label>
              <input
                type="text"
                name="judgeNames"
                value={formData.judgeNames}
                onChange={handleChange}
                placeholder="e.g. Hon. Justice Qazi Faez Isa, Hon. Justice Mansoor Ali Shah"
                style={styles.input}
              />
            </div>

            {/* Decision Date */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Decision Date</label>
              <input
                type="date"
                name="decisionDate"
                value={formData.decisionDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            {/* Case Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Case Type / Jurisdiction</label>
              <select
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Criminal">Criminal</option>
                <option value="Civil">Civil</option>
                <option value="Constitutional">Constitutional</option>
                <option value="Corporate">Corporate / Commercial</option>
                <option value="Family">Family Law</option>
                <option value="Tax">Tax / Revenue</option>
                <option value="Intellectual Property">Intellectual Property</option>
                <option value="Labor">Labor & Service</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Verdict */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Verdict / Outcome</label>
              <input
                type="text"
                name="verdict"
                value={formData.verdict}
                onChange={handleChange}
                placeholder="e.g. Allowed / Acquitted / Dismissed"
                style={styles.input}
              />
            </div>

            {/* Keywords */}
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>
                Keywords <span style={styles.helperText}>(Comma-separated, indexed for text search)</span>
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                placeholder="e.g. Bail, CrPC 498, Mala Fide, Fundamental Rights, Article 184(3)"
                style={styles.input}
              />
            </div>

            {/* Summary */}
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>
                Case Summary <span style={styles.required}>*</span>
              </label>
              <textarea
                name="summary"
                rows="3"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Brief summary of facts, legal principles, and findings..."
                required
                style={styles.textarea}
              />
            </div>

            {/* Full Text */}
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Full Judgment Text (Optional)</label>
              <textarea
                name="fullText"
                rows="4"
                value={formData.fullText}
                onChange={handleChange}
                placeholder="Complete judgment text or extracts..."
                style={styles.textarea}
              />
            </div>
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setFormData(initialFormState)}
              style={styles.resetBtn}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.submitBtnDisabled : styles.submitBtn}
            >
              {loading ? 'Submitting & Indexing...' : '💾 Add Legal Case'}
            </button>
          </div>
        </form>
      </section>

      {/* Cases List Table Section */}
      <section style={styles.card}>
        <div style={styles.tableHeaderSection}>
          <div>
            <h2 style={styles.cardTitle}>
              📋 Repository Cases
              <span style={styles.countBadge}>{cases.length}</span>
            </h2>
            <p style={styles.cardSubtitle}>All indexed judicial decisions currently available</p>
          </div>

          <div style={styles.tableControls}>
            <input
              type="text"
              placeholder="🔍 Search title, citation, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <button onClick={fetchCases} style={styles.refreshBtn} title="Refresh list">
              🔄 Refresh
            </button>
          </div>
        </div>

        {fetchLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading cases from MongoDB...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚖️</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>No Cases Found</h3>
            <p style={{ margin: 0, color: '#64748b' }}>
              {searchTerm ? 'No cases match your search query.' : 'No cases have been added yet. Use the form above to add your first case.'}
            </p>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Title &amp; Citation</th>
                  <th style={styles.th}>Court &amp; Bench</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Decision Date</th>
                  <th style={styles.th}>Verdict</th>
                  <th style={styles.th}>Keywords</th>
                  <th style={styles.th}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.caseTitleText}>{c.caseTitle}</div>
                      {c.citation && <div style={styles.citationBadge}>{c.citation}</div>}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{c.courtName}</div>
                      {c.judgeNames && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {c.judgeNames}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={getCaseTypeBadgeStyle(c.caseType)}>{c.caseType || 'General'}</span>
                    </td>
                    <td style={styles.td}>
                      {c.decisionDate
                        ? new Date(c.decisionDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td style={styles.td}>
                      {c.verdict ? (
                        <span style={styles.verdictBadge}>{c.verdict}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.keywordsContainer}>
                        {c.keywords && c.keywords.length > 0
                          ? c.keywords.map((kw, i) => (
                              <span key={i} style={styles.keywordTag}>
                                {kw}
                              </span>
                            ))
                          : '—'}
                      </div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: '280px' }}>
                      <div style={styles.summaryText} title={c.summary}>
                        {c.summary}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// Styling Helper
function getCaseTypeBadgeStyle(type) {
  const base = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
  };

  switch (type) {
    case 'Criminal':
      return { ...base, backgroundColor: '#fee2e2', color: '#991b1b' };
    case 'Constitutional':
      return { ...base, backgroundColor: '#fef3c7', color: '#92400e' };
    case 'Civil':
      return { ...base, backgroundColor: '#dbeafe', color: '#1e40af' };
    case 'Corporate':
      return { ...base, backgroundColor: '#e0e7ff', color: '#3730a3' };
    case 'Tax':
      return { ...base, backgroundColor: '#dcfce7', color: '#166534' };
    default:
      return { ...base, backgroundColor: '#f1f5f9', color: '#475569' };
  }
}

// Modern Inline Styles
const styles = {
  pageContainer: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px 48px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '24px',
    textAlign: 'center',
  },
  headerBadge: {
    display: 'inline-block',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '999px',
    marginBottom: '8px',
  },
  headerTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  headerSubtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  alertIcon: {
    fontSize: '1.2rem',
  },
  alertCloseBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    fontSize: '1.3rem',
    lineHeight: '1',
    cursor: 'pointer',
    color: 'inherit',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    padding: '24px',
    marginBottom: '28px',
  },
  cardHeader: {
    marginBottom: '20px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardSubtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#334155',
  },
  required: {
    color: '#ef4444',
  },
  helperText: {
    fontSize: '0.75rem',
    fontWeight: '400',
    color: '#64748b',
  },
  input: {
    padding: '9px 12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '9px 12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  textarea: {
    padding: '9px 12px',
    fontSize: '0.9rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  resetBtn: {
    padding: '10px 18px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 22px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
  },
  submitBtnDisabled: {
    padding: '10px 22px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    cursor: 'not-allowed',
  },
  tableHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '12px',
  },
  countBadge: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '999px',
  },
  tableControls: {
    display: 'flex',
    gap: '8px',
  },
  searchInput: {
    padding: '7px 12px',
    fontSize: '0.85rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    width: '240px',
  },
  refreshBtn: {
    padding: '7px 12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.85rem',
  },
  tableHeaderRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '10px 12px',
    fontWeight: '600',
    color: '#475569',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px',
    verticalAlign: 'top',
  },
  caseTitleText: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  citationBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    color: '#0284c7',
    backgroundColor: '#f0f9ff',
    padding: '1px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  verdictBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  keywordsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    maxWidth: '180px',
  },
  keywordTag: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  summaryText: {
    color: '#475569',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    lineHeight: '1.4',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '40px 16px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #0284c7',
    borderRadius: '50%',
    margin: '0 auto 12px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '0.9rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 16px',
  },
};
