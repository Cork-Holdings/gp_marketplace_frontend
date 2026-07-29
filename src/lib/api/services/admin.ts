import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export const AdminService = {
  createPlatformAdmin: (payload: unknown) => secureApi.post(getRoute('CREATE_PLATFORM_ADMIN'), payload),
  createStore: (payload: unknown) => secureApi.post(getRoute('ADMIN_CREATE_STORE'), payload),
  listStores: () => secureApi.get(getRoute('ADMIN_LIST_STORES')),
  registerMerchant: (formData: FormData) => secureApi.upload(getRoute('ADMIN_REGISTER_MERCHANT'), formData),
  listMerchants: () => secureApi.get(getRoute('LIST_MERCHANTS')),
  listKyc: (params: Record<string, string> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_KYC'), params)),
  getKyc: (verificationId: string) => secureApi.get(getRoute('GET_KYC', { verificationId })),
  approveKyc: (verificationId: string, payload: unknown) =>
    secureApi.post(getRoute('APPROVE_KYC', { verificationId }), payload),
  rejectKyc: (verificationId: string, payload: unknown) =>
    secureApi.post(getRoute('REJECT_KYC', { verificationId }), payload),
  listAuditLogs: (params: Record<string, string> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_AUDIT_LOGS'), params)),
  listOrders: (params: Record<string, string> = {}) =>
    secureApi.get(withQuery(getRoute('ADMIN_LIST_ORDERS'), params)),
  getOrder: (orderId: string) => secureApi.get(getRoute('ADMIN_GET_ORDER', { orderId })),

  /** @deprecated legacy store-owner endpoints */
  onboardOwner: (payload: unknown) => secureApi.post(getRoute('ONBOARD_OWNER'), payload),
  /** @deprecated legacy store-owner endpoints */
  listOwners: () => secureApi.get(getRoute('LIST_OWNERS')),
  /** @deprecated legacy store-owner endpoints */
  updateOwner: (ownerId: string, payload: unknown) =>
    secureApi.patch(getRoute('UPDATE_OWNER', { ownerId }), payload),
};

export default AdminService;
