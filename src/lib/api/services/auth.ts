import secureApi from '../crud';
import { getRoute } from '../end_points';

export const AuthService = {
  login: (email: string, password: string) =>
    secureApi.post(getRoute('LOGIN'), { email, password }, { auth: false }),

  requestPasswordReset: (email: string) =>
    secureApi.post(getRoute('FORGOT_PASSWORD'), { email }, { auth: false }),
  resetPassword: (token: string, password: string) =>
    secureApi.post(getRoute('RESET_PASSWORD'), { token, password }, { auth: false }),

  employeeLogin: (payload: {
    merchant_id?: string;
    store_id?: string;
    employee_number: string;
    pin: string;
  }) => secureApi.post(getRoute('EMPLOYEE_LOGIN'), payload, { auth: false }),

  register: (payload: unknown) => secureApi.post(getRoute('REGISTER'), payload, { auth: false }),

  registerCustomer: (formData: FormData) =>
    secureApi.upload(getRoute('REGISTER_CUSTOMER'), formData, { auth: false }),

  registerMerchant: (formData: FormData) =>
    secureApi.upload(getRoute('REGISTER_MERCHANT'), formData, { auth: false }),

  refresh: () => secureApi.post(getRoute('REFRESH_TOKEN'), {}, { auth: true }),

  me: () => secureApi.get(getRoute('AUTH_ME')),
};

export default AuthService;
