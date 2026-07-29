import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export const RolesService = {
  listPermissions: (merchantId: string) =>
    secureApi.get(getRoute('MERCHANT_PERMISSIONS', { merchantId })),

  listRoles: (merchantId: string) => secureApi.get(getRoute('MERCHANT_ROLES', { merchantId })),

  createRole: (merchantId: string, payload: unknown) =>
    secureApi.post(getRoute('MERCHANT_ROLES', { merchantId }), payload),

  updateRole: (merchantId: string, roleId: string, payload: unknown) =>
    secureApi.patch(getRoute('MERCHANT_ROLE', { merchantId, roleId }), payload),

  listMembers: (merchantId: string) => secureApi.get(getRoute('MERCHANT_MEMBERS', { merchantId })),

  getMember: (merchantId: string, memberId: string) =>
    secureApi.get(getRoute('MERCHANT_MEMBER', { merchantId, memberId })),

  createMember: (merchantId: string, payload: unknown) =>
    secureApi.post(getRoute('MERCHANT_MEMBERS', { merchantId }), payload),

  updateMember: (merchantId: string, memberId: string, payload: unknown) =>
    secureApi.patch(getRoute('MERCHANT_MEMBER', { merchantId, memberId }), payload),

  setMemberPin: (merchantId: string, memberId: string, pin: string) =>
    secureApi.post(getRoute('MERCHANT_MEMBER_PIN', { merchantId, memberId }), { pin }),

  deactivateMember: (merchantId: string, memberId: string) =>
    secureApi.delete(getRoute('MERCHANT_MEMBER', { merchantId, memberId })),

  myPermissions: (merchantId?: string) =>
    secureApi.get(withQuery(getRoute('AUTH_ME_PERMISSIONS'), { merchant_id: merchantId })),
};

export default RolesService;
