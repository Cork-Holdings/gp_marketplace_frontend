export function kycLabel(value?: string | null): string {
  const labels: Record<string, string> = {
    owner_id: 'Owner identity', company_registration: 'PACRA registration',
    structural_approval: 'Council licence or permit', national_id: 'National Registration Card (NRC)',
    passport: 'Passport', drivers_license: 'Driving licence', driver_license: 'Driving licence',
    informal: 'Informal business', formal: 'Formal business',
  };
  if (!value) return 'Not provided';
  return labels[value] || value.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
}

export function kycDocumentUrl(value?: string | null, apiBase = ''): string | null {
  if (!value) return null;
  try {
    const origin = apiBase.replace(/\/api\/v1\/?$/, '') || globalThis.location?.origin || 'http://localhost';
    const url = new URL(value, origin);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

type DocumentRecord = {
  id?: string; file_url?: string | null; file_name?: string | null;
  content_type?: string | null; file_size?: number | null; created_at?: string;
  verification_type?: string; document_type?: string; status?: string;
};

export type ReviewDocument = DocumentRecord & { title: string; source: string };

// The NRC can be reused for owner verification. Show the file once, with both purposes.
export function kycDocuments(data: {
  documents?: DocumentRecord[] | null;
  applicant?: { documents?: DocumentRecord[] | null } | null;
  verification?: { verification_type?: string; document_url?: string | null } | null;
}): ReviewDocument[] {
  const documents: ReviewDocument[] = [];
  for (const doc of data.documents || []) {
    documents.push({ ...doc, title: kycLabel(doc.verification_type), source: 'Business verification' });
  }
  for (const doc of data.applicant?.documents || []) {
    const existing = doc.file_url && documents.find(item => item.file_url === doc.file_url);
    if (existing) {
      existing.source = `Business verification and ${kycLabel(doc.document_type)}`;
    } else {
      documents.push({ ...doc, title: kycLabel(doc.document_type), source: 'Applicant identity' });
    }
  }
  const verification = data.verification;
  if (verification?.document_url && !documents.some(doc => doc.file_url === verification.document_url)) {
    documents.push({ file_url: verification.document_url, title: kycLabel(verification.verification_type), source: 'Business verification' });
  }
  return documents;
}

export function kycDecisionIssue(approved: boolean, notes: string): string | null {
  if (notes.length > 2000) return 'Keep reviewer notes to 2,000 characters or fewer.';
  if (!approved && !notes.trim()) return 'Explain what needs correcting so the applicant knows what to do next.';
  return null;
}
