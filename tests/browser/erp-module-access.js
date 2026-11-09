// Browser-only GET fixtures exercise access/error states; no plan or permission is changed.
async page => {
  const root = 'http://127.0.0.1:5173';
  await page.unrouteAll({ behavior: 'wait' });
  const response = await page.request.post(root + '/api/v1/auth/login', { data: { email: 'owner@barber.co.zm', password: 'OwnerPass123!' } });
  if (!response.ok()) throw new Error('Local fixture login failed');
  const auth = await response.json();
  await page.evaluate(a => { localStorage.clear(); localStorage.setItem('geepay_access_token', a.access_token); localStorage.setItem('geepay_user', JSON.stringify(a.user)); }, auth);
  await page.route('**/api/**', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
  const planPattern = '**/api/v1/merchants/*/plan';
  await page.route(planPattern, async route => {
    const live = await route.fetch();
    if (!live.ok()) throw new Error('Current plan could not be read');
    const fixture = await live.json();
    fixture.plan.data.features = fixture.plan.data.features.filter(feature => feature !== 'inventory');
    await route.fulfill({ response: live, json: fixture });
  });
  await page.goto(root + '/portal/owner/modules/inventory');
  await page.locator('.module-section[aria-busy="false"]').waitFor();
  if (await page.getByRole('link', { name: 'Open Inventory', exact: true }).count()) throw new Error('Excluded feature still opens');
  for (const path of ['inventory','purchasing','stock-control']) if (await page.locator('a[href="/portal/owner/'+path+'"]').count()) throw new Error('Excluded tool visible: '+path);
  await page.unroute(planPattern);
  await page.route(planPattern, route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Plan temporarily unavailable"}' }));
  await page.reload();
  await page.getByText('Plan access could not be checked.', { exact: true }).waitFor();
  if (await page.getByRole('link', { name: 'Open Inventory', exact: true }).count()) throw new Error('Failed plan check opened inventory');
  await page.unroute(planPattern);
  await page.getByRole('button', { name: 'Retry plan check', exact: true }).first().click();
  await page.getByRole('link', { name: 'Open Inventory', exact: true }).waitFor();
  const permissionPattern = '**/api/v1/auth/me/permissions?**';
  await page.route(permissionPattern, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"permissions":["stores.view"]}' }));
  await page.goto(root + '/portal/owner/modules/finance');
  await page.getByText('No tools are available for your current access.', { exact: true }).waitFor();
  if (await page.getByRole('link', { name: 'Open Transactions', exact: true }).count()) throw new Error('Restricted feature still opens');
  await page.unroute(permissionPattern);
  await page.reload();
  await page.getByRole('link', { name: 'Open Transactions', exact: true }).waitFor();
  return { planRequired: true, failedPlanCheck: true, retry: true, permissionRequired: true, actualPlanAndPermissionsUnchanged: true };
}
