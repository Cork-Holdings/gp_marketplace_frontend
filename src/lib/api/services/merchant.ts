import secureApi from '../crud';
import { getRoute } from '../end_points';

export const MerchantService = {
  listMemberships: () => secureApi.get(getRoute('LIST_MEMBERSHIPS')),
  onboardBusiness: (formData: FormData) => secureApi.upload(getRoute('ONBOARD_BUSINESS'), formData),
};

export default MerchantService;
