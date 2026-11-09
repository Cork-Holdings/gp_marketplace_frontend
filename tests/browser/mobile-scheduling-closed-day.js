// Read-only availability UI check against configured local hours.
async page => {
  const root = 'http://127.0.0.1:5173';
  const response = await page.request.post(root + '/api/v1/auth/login', { data: { email: 'customer@example.com', password: 'CustomerPass123!' } });
  if (!response.ok()) throw new Error('Local fixture login failed');
  const auth = await response.json();
  await page.evaluate(a => { localStorage.clear(); localStorage.setItem('geepay_access_token', a.access_token); localStorage.setItem('geepay_user', JSON.stringify(a.user)); }, auth);
  await page.unroute('**/api/**');
  await page.route('**/api/**', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.goto(root + '/account/quotes?request=1&store=00000000-0000-0000-0000-000000000011');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('What needs doing?', { exact: true }).fill('Read-only unavailable-time check');
  await page.getByLabel('Details', { exact: true }).fill('Preview only; this request will not be submitted.');
  await page.getByLabel('Service address', { exact: true }).fill('Test address');
  await page.getByLabel('City or town', { exact: true }).fill('Lusaka');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const resource = page.getByRole('combobox', { name: 'Team member or resource', exact: true });
  await resource.selectOption({ label: 'Daniel Zaga · Mobile visits' });
  const sunday = new Date(Date.now() + 86400000);
  while (sunday.getUTCDay() !== 0) sunday.setUTCDate(sunday.getUTCDate() + 1);
  await page.getByLabel('Visit date (Zambia time)', { exact: true }).fill(sunday.toISOString().slice(0, 10));
  await page.getByText('No available times on this date. Choose another date or resource.', { exact: true }).waitFor();
  if (await page.getByRole('button', { name: 'Review request', exact: true }).isEnabled()) throw new Error('Unavailable day still allowed review');
  await resource.selectOption('');
  await page.getByText('Availability is not confirmed until the provider assigns a team member. No employee time is reserved by a time-only request.', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Back to list', exact: true }).click();
  return { closedDayMessage: true, reviewDisabled: true, timeOnlyWarning: true, submitted: false };
}
