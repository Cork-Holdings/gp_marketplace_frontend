/** Only approved copy reaches the UI; response bodies and exception text are not copy. */
export interface ErrorContext {
  status?: number;
  code?: string;
  path?: string;
  method?: string;
}

export class UserFacingError extends Error {}

const PAYMENT_CHECK = 'We could not confirm the payment result. Check payment status before trying again. If you were charged, do not pay again; contact the business.';
const DEFAULT_MESSAGE = 'We could not complete that action. Refresh the page and check the latest details before trying again. If it keeps happening, contact support.';

const rules: ReadonlyArray<readonly [RegExp, string]> = [
  [/this record changed/, 'This record was updated elsewhere. Reload it before saving your changes again.'],
  [/choose another free active default plan/, 'Set another free, active plan as the default before changing this plan.'],
  [/core catalogue and fulfilment/, 'Keep the core catalogue and fulfilment modules enabled so existing customer work remains accessible.'],
  [/check the required fields, prices, links and available features/, 'Check the required fields, non-negative prices and internal links. Only available modules can be included.'],
  [/plan is no longer active|plan must be active/, 'This plan is no longer active. Refresh the available plans and choose another.'],
  [/active plan does not include/, 'Your active plan does not include this module. Review the available plans or contact the administrator.'],
  [/only a business owner or manager/, 'Only the business owner or a manager can request a plan change.'],
  [/booking_outside_hours|available appointment time within.*opening hours|choose an available time within opening hours/, 'Choose one of the available times within the business opening hours, then review your booking again.'],
  [/booking_service_unavailable|service or resource is no longer available/, 'This service or resource is no longer available. Choose another option and check available times again.'],
  [/set opening hours or closed for all seven days|each weekday must appear once/, 'Set opening hours or mark Closed for each day of the week, then save again.'],
  [/closing time must be later than opening time/, 'Choose a closing time later than the opening time on the same day. Overnight hours are not supported yet.'],
  [/booking_hold_expired|booking hold expired/, 'The 15-minute payment hold has ended. Choose an available time and make a new booking. No new payment request was sent.'],
  [/booking_payment_pending|booking payment pending/, 'A payment is still being checked for this booking. Check payment status before cancelling or booking again.'],
  [/business_not_approved|business is not approved/, 'This business is not accepting new requests yet. Choose another provider or contact the business for help.'],
  [/booking_capacity|selected resource is fully booked/, 'That time is no longer available. Choose another time or provider, then review your booking again.'],
  [/required document upload missing.*owner_id/, 'Upload the owner’s identity document before submitting the application.'],
  [/required document upload missing.*company_registration/, 'Upload the company registration document before submitting this formal business application.'],
  [/booking schedule cannot be changed/, 'Contact the business to arrange a different time. This booking cannot be rescheduled here.'],
  [/customer balance payment is required/, 'The customer still needs to pay the remaining balance. Ask them to open their request and pay before handing over the order.'],
  [/customer deposit payment is required/, 'The customer still needs to pay the deposit. Ask them to open their request and pay before you start work or allocate goods.'],
  [/customer full payment is required/, 'The customer still needs to pay the agreed price. Ask them to open their request and pay before you continue.'],
  [/customer payment is required before confirming/, 'This booking is waiting for payment. Ask the customer to open their booking and pay before you confirm it.'],
  [/customer payment is required before dispatch/, 'This job is waiting for payment. Ask the customer to open their estimate and pay before you dispatch a provider or start work.'],
  [/pay the deposit before the balance/, 'Pay the deposit first. Open the deposit payment section, then return here when it is confirmed.'],
  [/collection.*(in progress|in flight|pending verification)|pending verification.*collection/, 'Your payment request may already be in progress. Check payment status before trying again. Do not start another payment while the result is unconfirmed.'],
  [/collection request failed|payment is temporarily unavailable/, PAYMENT_CHECK],
  [/payment already completed|no pending payment transaction|order is not pending payment/, 'This payment is no longer waiting to be collected. Refresh the payment details to see the latest result before making another payment.'],
  [/payment belongs to a different environment/, 'This payment cannot be used in the current payment mode. Contact support before making another payment.'],
  [/manual payment recording is disabled/, 'Use the Pay button to make this payment, then check its status. A payment cannot be confirmed manually here.'],
  [/payment must be successful first/, 'Payment has not been confirmed yet. Check its status before continuing with settlement.'],
  [/payment amount must be positive|invalid order total/, 'The agreed payment amount needs to be corrected. Ask the business to review the price before you pay.'],
  [/supports zmw only/, 'This test payment supports Zambian kwacha only. Use a ZMW-priced request to continue the test.'],
  [/phone.*required|phone_number|valid mobile.money number|invalid.*(phone|msisdn)/, 'Enter a valid mobile-money number, such as 09 followed by eight digits, then review the payment amount.'],
  [/fully booked|resource.*(conflict|unavailable)|booking time unavailable|time.*(already reserved|not available|conflict)/, 'That time is no longer available. Choose another time or provider, then review your booking again.'],
  [/appointment must be in the future|choose a future date/, 'Choose a future date and time, then review the booking again.'],
  [/select a service resource/, 'Choose an available team member or service location before continuing. If none are listed, contact the business for a booking.'],
  [/select a priced service|service is not available/, 'This service is not available for online booking right now. Choose another listed service or contact the business.'],
  [/service name, duration/, 'Add a service name, a duration from 15 to 240 minutes and a price greater than zero, then save again.'],
  [/resource name, type and capacity/, 'Add a resource name and type, and a capacity from 1 to 100, then save again.'],
  [/valid (start time|time range)|scheduled end must be after start/, 'Check the appointment date and time. The end time must be later than the start time.'],
  [/customer must accept the price|quote must be accepted/, 'The customer needs to approve the price first. Send the estimate or offer and ask them to review it before work begins.'],
  [/add at least one fulfilment line/, 'Add the goods and quantities for this bulk order before marking it ready.'],
  [/all bulk quantities must be fulfilled|allocated lines must cover/, 'Some bulk quantities are still outstanding. Record the remaining quantities before marking the order ready.'],
  [/fulfilment lines cannot exceed/, 'The allocated quantities are higher than the customer requested. Reduce them to match the order, then save again.'],
  [/fulfilled quantity|invalid fulfilment quantity/, 'Check the fulfilled quantity. It must match the line status and cannot exceed the requested quantity.'],
  [/positive bulk quantity|positive quantity|quantity must be positive/, 'Enter a quantity greater than zero, with no more than three decimal places, then save again.'],
  [/assign a provider|assignee is required/, 'Choose a team member for this job before marking it assigned.'],
  [/assignee must be an active|assignee has no access/, 'Choose an active team member who has access to this branch. Update their access in Team if needed.'],
  [/record the completed work/, 'Add a work note describing what was completed before asking the customer to confirm.'],
  [/explain the issue/, 'Describe the problem in the issue field using 1 to 2,000 characters, then submit again.'],
  [/work note must be|evidence kind|invalid evidence/, 'Add a work note of up to 2,000 characters or attach the relevant file, then save again.'],
  [/explain the decision/, 'Add a reason of at least 10 characters so the payment decision is clear, then submit again.'],
  [/deposit and balance must equal/, 'The deposit and remaining balance must add up to the full price, including delivery. Correct the amounts, then send the offer again.'],
  [/deposit and balance must be|prices must be|invalid price|unit_price|price_delta|price is required/, 'Enter a valid price with no more than two decimal places. Check each charge, then save again.'],
  [/pickup cannot have a delivery fee/, 'Pickup orders cannot include a delivery fee. Remove the fee or choose delivery, then save again.'],
  [/delivery address.*required|zambian service address/, 'Add the street address and city for the visit or delivery, then review the request again.'],
  [/choose pickup or delivery/, 'Choose pickup or delivery before sending the request.'],
  [/currency must match|currency is required/, 'Use the same currency as the business. Check the price settings before continuing.'],
  [/offer note is too long/, 'Shorten the offer note, then send the price again.'],
  [/add priced charge lines|between 1 and 100 lines/, 'Add at least one priced charge with a description and quantity before sending the estimate.'],
  [/quote total is too large|unit_price is too large|total is too large/, 'One or more charges are too large. Review the quantities and prices, then save again.'],
  [/description is required/, 'Add a short description for each item or charge, then save again.'],
  [/service quote has expired|quote expired/, 'This estimate has expired. Ask the business to send an updated estimate before accepting or paying.'],
  [/quote is no longer editable|quote not editable/, 'This estimate can no longer be edited. Refresh its details and send a revised estimate if the price needs to change.'],
  [/invalid.*status transition|invalid.*transition|idempotency.*different payload/, 'This step is not available from the current status. Refresh the details and follow the next available action.'],
  [/customer.*(active customer account|cannot be changed|customer_id)|use an active customer account|customer_id or customer_email/, 'Select an active customer account. Ask the customer to register or check their email address before continuing.'],
  [/choose an on.site service provider/, 'Choose a provider that offers visits to your location, then send the request again.'],
  [/title.*required|customer and title are required|name.*(required|empty)/, 'Add the name or title requested in the form, then save again.'],
  [/insufficient stock/, 'There is not enough stock for that quantity. Reduce the quantity or ask the business about availability.'],
  [/stock_quantity/, 'Enter a stock quantity of zero or more, then save again.'],
  [/product unavailable|product is inactive/, 'This item is no longer available. Remove it or choose another item before continuing.'],
  [/must use its .*workflow|invalid purchase_flow/, 'This item needs a booking, estimate or custom request rather than checkout. Return to its listing and use the action shown there.'],
  [/cart is empty/, 'Add an available item to your basket before checking out.'],
  [/store is inactive|merchant is suspended/, 'This business is not accepting requests right now. Choose another business or contact it for help.'],
  [/invalid email or password|invalid credentials/, 'The email or password does not match. Check both and try signing in again.'],
  [/email already registered|email taken/, 'There is already an account with that email. Sign in with it, or use a different email to register.'],
  [/password must be at least/, 'Use a password with at least eight characters, then try again.'],
  [/email, password, and full_name/, 'Enter your name, email and password before creating the account.'],
  [/pin locked/, 'Sign-in is temporarily locked after several incorrect PINs. Ask your business owner for help before trying again.'],
  [/invalid pin|employee not found/, 'The employee number or PIN does not match. Check both, or ask your business owner for help.'],
  [/employee_number and pin/, 'Enter your employee number and PIN, then try signing in again.'],
  [/employee number already in use/, 'That employee number is already in use. Choose a different number, then save again.'],
  [/slug already taken|slug taken/, 'That business web address is already in use. Choose another address and save again.'],
  [/sku already taken|sku taken/, 'That stock code is already in use. Choose another code for this item and save again.'],
  [/slug must be|invalid slug format/, 'Use lowercase letters, numbers and hyphens for the business web address, then save again.'],
  [/ussd_code must be/, 'Enter a short code such as 115 or a complete dial code such as *111*1*1#, then try again.'],
  [/brand_color/, 'Choose a valid brand colour using the colour picker, then save again.'],
  [/image file is required|required document upload missing/, 'Choose the required image or document and upload it before continuing.'],
  [/image.*(too large|size)|request.*too large/, 'This file is too large. Choose a smaller file and upload it again.'],
  [/invalid qr code|qr code is disabled|invalid qr response|invalid store ussd code/, 'This code is not available. Find the business in the marketplace or ask it for a new code.'],
  [/table required|table is inactive|dine.in is not available/, 'Choose an available table for dine-in, or select another ordering option.'],
  [/table number already exists/, 'That table number is already in use. Choose a different number, then save again.'],
  [/invalid modifier selection|invalid selection_type/, 'Check the options selected for this item, then review the order again.'],
  [/invalid payment method/, 'Choose one of the available payment methods, then review the amount.'],
  [/system roles cannot be modified/, 'This built-in role cannot be changed. Create a custom role if you need different permissions.'],
  [/invalid role scope|role is not assignable|invalid merchant member role/, 'Choose an available business role with the correct branch access, then save again.'],
  [/forbidden|missing.*permission|not a member|insufficient.*privileges/, 'You do not have access to this action. Ask your business owner or administrator to check your permissions.'],
  [/no store selected/, 'Select a business or branch before continuing.'],
  [/no stores are available/, 'No businesses are available yet. Return to the marketplace and check again later.'],
  [/resource not found|store.*not found/, 'These details are no longer available. Return to the list or marketplace and choose another item.'],
];

export function isBookingTimeConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && ['BOOKING_TIME_UNAVAILABLE', 'booking_capacity', 'booking_outside_hours', 'booking_service_unavailable'].includes(String(error.code));
}

export function errorMessage(message: unknown, context: ErrorContext = {}): string {
  const { status = 0, code = '', path = '', method = 'GET' } = context;
  const text = typeof message === 'string' ? message.toLowerCase() : '';
  const payment = /payment|collect|transaction/.test(path);
  if (code === 'OFFLINE') return 'You are offline. Reconnect, then check the latest details before trying again.';
  if (code === 'NETWORK_ERROR' || /failed to fetch|network error|networkerror/.test(text)) {
    return payment && method !== 'GET' ? PAYMENT_CHECK : 'We could not connect to GeePay. Check your connection, then refresh the details before trying again.';
  }
  // Never expose HTML, stack traces or storage/provider diagnostics on server failures.
  if (status >= 500) {
    if (/collection is not enabled/.test(text)) return 'Online payment is unavailable right now. Please try later or contact the business to discuss payment options.';
    return payment ? PAYMENT_CHECK : 'GeePay is temporarily unavailable. Please try again shortly. If it keeps happening, contact support.';
  }
  if (status === 403) return 'You do not have access to this action. Ask your business owner or administrator to check your permissions.';
  if (status === 429) return 'There have been too many attempts in a short time. Wait a minute before trying again.';
  if (status === 413) return 'This file is too large. Choose a smaller file and upload it again.';
  const normalized = `${code.replaceAll('_', ' ').toLowerCase()} ${text}`;
  for (const [pattern, copy] of rules) if (pattern.test(normalized)) return copy;
  if (status === 401 || /unauthorized|session expired/.test(text)) return 'Please sign in again to continue, then reopen the item you were working on.';
  if (status === 404) return 'These details are no longer available. Return to the list or marketplace and choose another item.';
  if (status === 409) return payment ? PAYMENT_CHECK : 'These details have changed. Refresh them and check the latest status before continuing.';
  if (status === 400 || status === 422) return 'Some details need attention. Check the required fields, dates, quantities and prices, then submit again.';
  return DEFAULT_MESSAGE;
}

/** API errors already contain approved copy. Unknown exceptions must not be displayed verbatim. */
export function userMessage(error: unknown, fallback = DEFAULT_MESSAGE): string {
  if (error instanceof UserFacingError) return error.message;
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const copy = errorMessage(message);
  if (copy !== DEFAULT_MESSAGE) return copy;
  if (!fallback.trim()) return DEFAULT_MESSAGE;
  return /try|check|contact|open|refresh|choose|review|return|reconnect/i.test(fallback)
    ? fallback : `${fallback.replace(/\.$/, '')}. Check the latest details before trying again.`;
}
