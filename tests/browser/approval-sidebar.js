async page => {
  const {origin: base, hostname} = new URL(page.url());
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') throw Error('Run this fixture against a local Marketplace frontend');
  const id = '10000000-0000-4000-8000-000000000001';
  const user = {id, email:'reviewer@example.test', full_name:'Reviewer', role:'system_admin', is_active:true};
  let total = 3;
  let requests = 0;
  let decision = 'pending';
  let canReview = true;
  await page.unrouteAll({ behavior: 'wait' });
  await page.addInitScript(({user}) => {
    localStorage.setItem('geepay_access_token', 'local-fixture');
    localStorage.setItem('geepay_user', JSON.stringify(user));
  }, {user});
  await page.route(url => url.origin === base && url.pathname.startsWith('/api/v1'), async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.slice('/api/v1'.length);
    let json = {};
    let status = 200;
    if (path === '/admin/dashboard') status = 503;
    if (path === '/auth/me') json = {user};
    if (path === '/auth/me/permissions') json = {permissions: canReview ? ['kyc.view','kyc.review'] : ['kyc.view']};
    if (path === '/admin/kyc') {
      if (url.searchParams.get('limit') === '1' && url.searchParams.get('status') === 'pending') requests++;
      json = {verifications:[], total};
    }
    if (path === '/admin/kyc/' + id) json = {
      verification:{id,status:decision,verification_type:'owner_id'},
      merchant:{legal_name:'Synthetic business',business_type:'informal'},
      documents:[{id,file_url:'/fixture-kyc-image.jpg',file_name:'test.jpg',content_type:'image/jpeg',verification_type:'owner_id'}]
    };
    if (path === '/admin/kyc/' + id + '/approve') {
      decision = 'approved';
      total = 0;
      json = {verification:{id,status:decision,verification_type:'owner_id'}};
    }
    await route.fulfill({status,json});
  });
  await page.route('**/fixture-kyc-image.jpg', route => route.fulfill({status:404,body:''}));
  await page.goto(base + '/portal/admin');
  const summary = page.locator('summary').filter({hasText:'Trust & compliance'});
  await summary.getByText('3', {exact:true}).waitFor();
  await summary.click();
  const kyc = page.locator('.reference-menu-link').filter({hasText:'KYC Review'});
  await kyc.getByText('3', {exact:true}).waitFor();
  if (await summary.getByText('3',{exact:true}).isVisible()) throw Error('Duplicate count in open section');
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Open navigation menu'}).click();
  const drawer = page.getByRole('dialog',{name:'admin menu'});
  await drawer.locator('summary').filter({hasText:'Trust & compliance'}).getByText('3',{exact:true}).waitFor();
  await drawer.getByRole('button',{name:'Close menu'}).click();
  await page.setViewportSize({width:1280,height:900});
  await page.goto(base + '/portal/admin/kyc?review=' + id);
  await page.getByText('This image could not be loaded.',{exact:false}).waitFor();
  await kyc.getByText('3',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Approve check'}).click();
  await page.getByRole('button',{name:'Confirm approval'}).click();
  await kyc.locator('.reference-approval-count').waitFor({state:'detached'});
  if (decision !== 'approved') throw Error('Synthetic approval not recorded');
  const previousRequests = requests;
  canReview = false;
  total = 3;
  await page.reload();
  await kyc.waitFor();

  if (await kyc.locator('.reference-approval-count').count() || requests !== previousRequests) throw Error('View-only admin received actionable count');
  return 'PASS: cross-device KYC badge, zero state, approval refresh, view-only access, missing image state';
}
