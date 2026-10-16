/** Mirrors the existing activation checklist; does not invent extra document policy. */
export function onboardingIssue(step: string, formal: boolean, registrationNumber: string, hasOwnerId: boolean, hasCompanyRegistration: boolean): { message: string; field: string; step: string } | null {
  if ((step === 'business' || step === 'review') && formal && !registrationNumber.trim()) return { message: 'Enter the company registration number before continuing.', field: 'registration_number', step: 'business' };
  if (step === 'kyc' || step === 'review') {
    if (!hasOwnerId) return { message: 'Upload the owner’s identity document here, or go Back to add a National ID. You only need to upload it once.', field: 'owner_id', step: 'kyc' };
    if (formal && !hasCompanyRegistration) return { message: 'Upload the company registration document before continuing. Your other details are still here.', field: 'company_registration', step: 'kyc' };
  }
  return null;
}
