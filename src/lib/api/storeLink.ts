import secureApi from './crud';
import { UserFacingError } from '../userMessage';
import { storeLinkIssue } from '../storeIdentity';

export async function checkStoreLink(value: string, admin = false, signal?: AbortSignal): Promise<boolean> {
  const issue = storeLinkIssue(value);
  if (issue) throw new UserFacingError(issue);
  const result = await secureApi.get(`/${admin ? 'admin' : 'owner'}/store-link-availability?slug=${encodeURIComponent(value.trim())}`, { signal });
  if (typeof result?.available !== 'boolean') throw new UserFacingError('We could not check this link. Try again before continuing.');
  return result.available;
}

export async function requireAvailableStoreLink(value: string, admin = false) {
  try {
    if (!await checkStoreLink(value, admin)) throw new UserFacingError('That storefront link is already in use. Choose a different ending.');
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    throw new UserFacingError('We could not check this link. Try again before continuing.');
  }
}
