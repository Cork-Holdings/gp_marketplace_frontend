// Authorised scheduling-only local journey. No collection, payment or disbursement is sent.
async page => {
  const root = 'http://127.0.0.1:5173', base = root + '/api/v1';
  const store = '00000000-0000-0000-0000-000000000011';
  const title = 'Scheduling verification only · ' + new Date().toISOString();
  const errors = [], financial = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.unroute('**/api/**');
  await page.route('**/api/**', route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) && !/\/service-quotes(?:\/|$)|\/service-jobs(?:\/|$)/.test(new URL(request.url()).pathname)) {
      financial.push(request.url()); return route.abort();
    }
    return route.continue();
  });
  async function login(email, password) {
    const response = await page.request.post(base + '/auth/login', { data: { email, password } });
    if (!response.ok()) throw new Error('Local fixture login failed');
    const auth = await response.json();
    await page.evaluate(a => { localStorage.clear(); localStorage.setItem('geepay_access_token', a.access_token); localStorage.setItem('geepay_user', JSON.stringify(a.user)); }, auth);
    return { Authorization: 'Bearer ' + auth.access_token };
  }
  async function json(response) { if (!response.ok()) throw new Error(response.status() + ': ' + (await response.text()).slice(0, 400)); return response.json(); }
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const customer = await login('customer@example.com', 'CustomerPass123!');
  const ownerAuth = await page.request.post(base + '/auth/login', { data: { email: 'owner@barber.co.zm', password: 'OwnerPass123!' } });
  const owner = { Authorization: 'Bearer ' + (await json(ownerAuth)).access_token };
  const prefix = base + '/owner/stores/' + store;
  const resourceList = await json(await page.request.get(prefix + '/resources', { headers: owner }));
  const daniel = resourceList.resources.find(resource => resource.employee_user_id === '1bc757c8-5c3f-4710-8681-a6b8d049e1e3');
  const peter = resourceList.resources.find(resource => resource.employee_user_id === '00000000-0000-0000-0000-000000000004');
  if (!daniel || !peter) throw new Error('Configure real employee resources first');
  let quote, job;
  try {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(root + '/account/quotes?request=1&store=' + store);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByLabel('What needs doing?', { exact: true }).fill(title);
    await page.getByLabel('Details', { exact: true }).fill('Scheduling verification only. Do not dispatch staff or collect payment.');
    await page.getByLabel('Service address', { exact: true }).fill('Test address, Lusaka');
    await page.getByLabel('City or town', { exact: true }).fill('Lusaka');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('combobox', { name: 'Team member or resource', exact: true }).selectOption(daniel.id);
    await page.getByLabel('Visit date (Zambia time)', { exact: true }).fill(date);
    // Request the first published candidate; the provider will deliberately suggest another.
    const requestedButton = page.getByRole('group', { name: 'Available visit times' }).getByRole('button').first();
    await requestedButton.waitFor();
    const requestedLabel = await requestedButton.innerText();
    await requestedButton.click();
    await page.getByRole('button', { name: 'Review request', exact: true }).click();
    const created = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/customers/me/service-quotes'));
    await page.getByRole('button', { name: 'Send request', exact: true }).click();
    quote = await json(await created);
    await page.getByRole('heading', { name: title, exact: true }).waitFor();
    // A request is only a preference, even when it names a resource.
    const unheld = await json(await page.request.get(prefix + `/visit-slots?resource_id=${daniel.id}&duration_minutes=60&date=${date}`, { headers: owner }));
    if (!unheld.slots.some(slot => Date.parse(slot.starts_at) === Date.parse(quote.requested_at))) throw new Error('Draft preference incorrectly reserved employee');
    await login('owner@barber.co.zm', 'OwnerPass123!');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(root + '/portal/owner/quotes');
    await page.getByRole('combobox', { name: 'Branch', exact: true }).selectOption(store);
    await page.goto(root + '/portal/owner/quotes?detail=' + quote.id);
    await page.getByRole('button', { name: /Add estimate|Edit charges/, exact: true }).click();
    await page.getByLabel('Charge description', { exact: true }).fill('Scheduling verification, no actual service');
    await page.getByLabel('Unit price', { exact: true }).fill('1');
    await page.getByRole('combobox', { name: 'Visit length', exact: true }).selectOption('60');
    await page.getByRole('group', { name: 'Available visit times' }).getByRole('button').nth(4).click();
    await page.getByRole('button', { name: 'Save priced draft', exact: true }).click();
    const sent = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith('/service-quotes/' + quote.id + '/status'));
    await page.getByRole('button', { name: 'Send to customer', exact: true }).click();
    quote = await json(await sent);
    if (quote.status !== 'sent' || Date.parse(quote.scheduled_at) === Date.parse(quote.requested_at)) throw new Error('Provider did not send changed time');
    await page.screenshot({ path: 'output/playwright/scheduling-provider-proposal-1440.png', fullPage: true });
    await login('customer@example.com', 'CustomerPass123!');
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(root + '/account/quotes?detail=' + quote.id);
    await page.getByText('Originally requested:', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Accept estimate', exact: true }).click();
    const confirm = page.getByRole('dialog');
    await confirm.getByText(/Visit:/).waitFor();
    await confirm.getByRole('button', { name: 'Accept estimate', exact: true }).click();
    await page.getByRole('heading', { name: 'Agreed visit window', exact: true }).waitFor();
    quote = await json(await page.request.get(prefix + '/service-quotes/' + quote.id, { headers: owner }));
    const reserved = await json(await page.request.get(prefix + `/visit-slots?resource_id=${daniel.id}&duration_minutes=60&date=${date}`, { headers: owner }));
    if (reserved.slots.some(slot => Date.parse(slot.starts_at) === Date.parse(quote.scheduled_at))) throw new Error('Accepted visit did not reserve employee');
    await page.screenshot({ path: 'output/playwright/scheduling-customer-accepted-390.png', fullPage: true });
    await login('owner@barber.co.zm', 'OwnerPass123!');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(root + '/portal/owner/quotes');
    await page.getByRole('combobox', { name: 'Branch', exact: true }).selectOption(store);
    await page.goto(root + '/portal/owner/quotes?detail=' + quote.id);
    const jobResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/service-jobs'));
    await page.getByRole('button', { name: 'Create service job', exact: true }).click();
    job = await json(await jobResponse);
    if (Date.parse(job.scheduled_start_at) !== Date.parse(quote.scheduled_at) || Date.parse(job.scheduled_end_at) !== Date.parse(quote.scheduled_end_at) || job.assigned_to !== daniel.employee_user_id) throw new Error('Job did not inherit agreed time and employee');
    await page.goto(root + '/portal/owner/jobs?detail=' + job.id);
    await page.getByRole('combobox', { name: 'Provider', exact: true }).selectOption(peter.employee_user_id);
    const reassigned = page.waitForResponse(response => response.request().method() === 'PATCH' && response.url().endsWith('/assignment'));
    await page.getByRole('button', { name: 'Assign provider', exact: true }).click();
    job = await json(await reassigned);
    if (job.assigned_to !== peter.employee_user_id) throw new Error('Reassignment failed');
    const calendar = await json(await page.request.get(prefix + '/day-calendar?date=' + date, { headers: owner }));
    const freed = await json(await page.request.get(prefix + `/visit-slots?resource_id=${daniel.id}&duration_minutes=60&date=${date}`, { headers: owner }));
    const occupied = await json(await page.request.get(prefix + `/visit-slots?resource_id=${peter.id}&duration_minutes=60&date=${date}`, { headers: owner }));
    if (!freed.slots.some(slot => Date.parse(slot.starts_at) === Date.parse(quote.scheduled_at)) || occupied.slots.some(slot => Date.parse(slot.starts_at) === Date.parse(quote.scheduled_at))) throw new Error('Reassignment failed to move capacity');
    await page.goto(root + '/portal/owner/bookings');
    await page.locator('.employee-calendar').getByLabel('Day', { exact: true }).fill(date);
    await page.locator('.employee-calendar').getByRole('button', { name: 'Agenda view', exact: true }).click();
    await page.locator('.employee-calendar').getByRole('link', { name: new RegExp('Scheduling verification only') }).first().waitFor();
    await page.screenshot({ path: 'output/playwright/scheduling-reassigned-calendar-1440.png', fullPage: true });
    if (errors.length || financial.length) throw new Error(JSON.stringify({ errors, financial }));
    return { store, date, requestedLabel, originalRequested: quote.requested_at, agreedStart: quote.scheduled_at, agreedEnd: quote.scheduled_end_at, quote: quote.id, job: job.id, inheritedEmployee: 'Daniel Zaga', reassignedEmployee: 'Peter Phiri', preferenceDoesNotHold: true, acceptedWindowReserves: true, reassignmentMovesCapacity: true, calendarLoaded: Boolean(calendar), pageErrors: errors, financialCalls: financial };
  } finally {
    // Release only records created by this test, without touching pre-existing customer work.
    if (job?.id) await json(await page.request.patch(prefix + '/service-jobs/' + job.id + '/status', { headers: owner, data: { status: 'cancelled' } }));
    else if (quote?.id) await json(await page.request.patch(prefix + '/service-quotes/' + quote.id + '/status', { headers: owner, data: { status: 'cancelled' } }));
  }
}
