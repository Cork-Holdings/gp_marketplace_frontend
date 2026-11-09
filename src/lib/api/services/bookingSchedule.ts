import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export type BookingHour = { weekday: number; closed: boolean; opens_at: string; closes_at: string };
export type BookingSchedule = { timezone: string; configured: boolean; hours: BookingHour[] };
export type BookingSlot = { starts_at: string; ends_at: string };
export type BookingAvailability = { timezone: string; configured: boolean; slots: BookingSlot[] };
export type CalendarEvent = { id:string; kind:'booking'|'job'|'quote'|'leave'; title:string; status:string; employee_id?:string; resource_name?:string; starts_at:string; ends_at:string };
export type EmployeeCalendar = { date:string; timezone:string; employees:{id:string; name:string}[]; events:CalendarEvent[]; unscheduled:number };
const route = (storeId: string, owner: boolean, suffix: string) =>
  getRoute(owner ? 'OWNER_RESOURCES' : 'STORE_RESOURCES', { storeId }).replace(/\/resources$/, `/${suffix}`);

export const bookingScheduleApi = {
  calendar: (storeId:string,date:string,signal?:AbortSignal):Promise<EmployeeCalendar> => secureApi.get(withQuery(route(storeId,true,'day-calendar'),{date}),{signal}),
  visitSlots: (storeId:string,resourceId:string,minutes:number,date:string,owner=false,signal?:AbortSignal):Promise<BookingAvailability> => secureApi.get(withQuery(route(storeId,owner,'visit-slots'),{resource_id:resourceId,duration_minutes:minutes,date}),{auth:owner,signal}),
  get: (storeId: string, owner = false): Promise<BookingSchedule> => secureApi.get(route(storeId, owner, 'booking-hours'), { auth: owner }),
  save: (storeId: string, hours: BookingHour[]): Promise<BookingSchedule> => secureApi.put(route(storeId, true, 'booking-hours'), { hours }),
  slots: (storeId: string, serviceId: string, resourceId: string, date: string, owner = false, signal?: AbortSignal): Promise<BookingAvailability> =>
    secureApi.get(withQuery(route(storeId, owner, 'booking-slots'), { service_id: serviceId, resource_id: resourceId, date }), { auth: owner, signal }),
};
