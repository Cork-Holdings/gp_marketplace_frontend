import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export type BookingHour = { weekday: number; closed: boolean; opens_at: string; closes_at: string };
export type BookingSchedule = { timezone: string; configured: boolean; hours: BookingHour[] };
export type BookingSlot = { starts_at: string; ends_at: string };
export type BookingAvailability = { timezone: string; configured: boolean; slots: BookingSlot[] };
const route = (storeId: string, owner: boolean, suffix: string) =>
  getRoute(owner ? 'OWNER_RESOURCES' : 'STORE_RESOURCES', { storeId }).replace(/\/resources$/, `/${suffix}`);

export const bookingScheduleApi = {
  get: (storeId: string, owner = false): Promise<BookingSchedule> => secureApi.get(route(storeId, owner, 'booking-hours'), { auth: owner }),
  save: (storeId: string, hours: BookingHour[]): Promise<BookingSchedule> => secureApi.put(route(storeId, true, 'booking-hours'), { hours }),
  slots: (storeId: string, serviceId: string, resourceId: string, date: string, owner = false, signal?: AbortSignal): Promise<BookingAvailability> =>
    secureApi.get(withQuery(route(storeId, owner, 'booking-slots'), { service_id: serviceId, resource_id: resourceId, date }), { auth: owner, signal }),
};
