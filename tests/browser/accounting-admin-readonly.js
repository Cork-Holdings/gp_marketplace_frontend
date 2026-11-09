// Normal app: authenticate fixture roles, then perform read-only UI checks.
async page=>{
 const root='http://127.0.0.1:5173',store='00000000-0000-0000-0000-000000000010',errors=[],writes=[],serverErrors=[];
 await page.unrouteAll({behavior:'wait'});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=500)serverErrors.push(r.url())});
 await page.route('**/api/**',route=>{if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort()}return route.continue()});
 async function login(email,password){const r=await page.request.post(root+'/api/v1/auth/login',{data:{email,password}});if(!r.ok())throw new Error('Fixture authentication failed');const auth=await r.json();await page.goto(root);await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user))},auth);return auth;}
 await login('admin@geepay.local','AdminPass123!');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(root+'/portal/admin/erp?view=accounts&store='+store);const table=page.getByRole('table',{name:'Chart of accounts',exact:true});await table.waitFor();await table.getByText('1000',{exact:true}).first().waitFor();await table.getByRole('button',{name:'View record',exact:true}).first().click();await page.getByRole('heading',{name:'Selected record',exact:true}).waitFor();
  if(await page.getByRole('button',{name:'Save account',exact:true}).count())throw new Error('Admin oversight exposes write form');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Admin chart overflows '+width);
  await page.goto(root+'/portal/admin/erp?view=imports&store='+store);await page.getByRole('heading',{name:'Accounting imports',exact:true}).waitFor();await page.getByRole('table',{name:'Accounting imports',exact:true}).or(page.getByText('No recorded entries for this view. New records will appear here when the business creates them.',{exact:true})).waitFor();
  if(await page.getByRole('heading',{name:'Something went wrong',exact:true}).count())throw new Error('Admin import history failed');if(await page.getByRole('button',{name:'Confirm and post journals',exact:true}).count())throw new Error('Admin oversight exposes import actions');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Admin imports overflow '+width);
 }
 await login('customer@example.com','CustomerPass123!');for(const path of ['accounts','imports']){await page.goto(root+'/portal/owner/accounting/'+path);await page.waitForURL('**/account');if(await page.locator('a[href="/portal/owner/accounting/'+path+'"]').count())throw new Error('Customer sees finance tools');}
 if(errors.length||writes.length||serverErrors.length)throw new Error(JSON.stringify({errors,writes,serverErrors}));return{adminChartVisible:true,adminImportHistoryVisible:true,oversightReadOnly:true,customerRoutesDenied:true,widths:[390,1440],businessWrites:0,pageErrors:errors,serverErrors};
}
