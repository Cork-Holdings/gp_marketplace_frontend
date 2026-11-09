// Authorised local configuration. Uses actual employee IDs and leaves any existing hours intact.
async page => {
  const base = 'http://127.0.0.1:5173/api/v1';
  const login = await page.request.post(base + '/auth/login', { data: { email: 'owner@barber.co.zm', password: 'OwnerPass123!' } });
  if (!login.ok()) throw new Error('Local owner login failed');
  const auth = await login.json();
  const headers = { Authorization: 'Bearer ' + auth.access_token };
  const store = '00000000-0000-0000-0000-000000000011';
  const prefix = base + '/owner/stores/' + store;
  async function json(response) { if (!response.ok()) throw new Error(response.status() + ': ' + (await response.text()).slice(0, 400)); return response.json(); }
  const before = await json(await page.request.get(prefix + '/booking-hours', { headers }));
  if (!before.configured) {
    const hours = Array.from({ length: 7 }, (_, weekday) => ({ weekday, closed: weekday === 0, opens_at: weekday === 0 ? '00:00' : '08:00', closes_at: weekday === 0 ? '00:00' : '17:00' }));
    await json(await page.request.put(prefix + '/booking-hours', { headers, data: { hours } }));
  }
  const resources = await json(await page.request.get(prefix + '/resources', { headers }));
  const employees = [
    { id: '1bc757c8-5c3f-4710-8681-a6b8d049e1e3', name: 'Daniel Zaga' },
    { id: '00000000-0000-0000-0000-000000000004', name: 'Peter Phiri' },
  ];
  const created = [];
  for (const employee of employees) {
    if ((resources.resources ?? []).some(resource => resource.employee_user_id === employee.id && resource.is_active)) continue;
    const resource = await json(await page.request.post(prefix + '/resources', { headers, data: { employee_user_id: employee.id, name: employee.name + ' · Mobile visits', resource_type: 'employee', capacity: 1 } }));
    created.push({ id: resource.id, name: resource.name });
  }
  const schedule = await json(await page.request.get(prefix + '/booking-hours', { headers }));
  const final = await json(await page.request.get(prefix + '/resources', { headers }));
  return { store, configured: schedule.configured, hours: schedule.hours, created, resources: final.resources.map(resource => ({ id: resource.id, name: resource.name, employee: resource.employee_user_id, capacity: resource.capacity })) };
}
