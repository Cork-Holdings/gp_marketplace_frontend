// Read-only layout and navigation verification on the normal local app.
async page=>{
 const root='http://127.0.0.1:5173',errors=[],writes=[];await page.unrouteAll({behavior:'wait'});page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',route=>{if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort()}return route.continue()});
 const r=await page.request.post(root+'/api/v1/auth/login',{data:{email:'owner@barber.co.zm',password:'OwnerPass123!'}});if(!r.ok())throw new Error('Login failed');const a=await r.json();await page.goto(root);await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user));sessionStorage.setItem('geepay.branch.'+a.user.id,'00000000-0000-0000-0000-000000000010')},a);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(root+'/portal/owner/accounting/accounts');await page.getByRole('table',{name:'Chart of accounts',exact:true}).waitFor();
  const table=page.getByRole('table',{name:'Chart of accounts',exact:true});const header=table.locator('tbody th[scope=row]').first();await header.waitFor();const box=await header.boundingBox();if(!box||box.width<100)throw new Error('Account name is cramped '+width);
  if(width===390){await header.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/accounting-chart-rows-390.png'});}
  if(width===1440){await page.screenshot({path:'output/playwright/accounting-chart-1440.png'});}
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Chart overflow '+width);
  await page.getByRole('button',{name:'View ledger 1000',exact:true}).click();await page.getByRole('table',{name:'Account ledger',exact:true}).waitFor();await page.getByLabel('Ledger from',{exact:true}).fill('');await page.getByText('Choose a valid from and to date, with the end on or after the start.',{exact:true}).waitFor();
  await page.goto(root+'/portal/owner/accounting/imports');await page.getByRole('heading',{name:'Accounting imports',exact:true}).waitFor();if(await page.locator('.reference-menu a[aria-current=page]').count()!==1)throw new Error('Multiple navigation items highlighted');if(!await page.getByRole('button',{name:'Preview import',exact:true}).isDisabled())throw new Error('Empty CSV preview enabled');if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Import overflow '+width);
  if(width===1440)await page.screenshot({path:'output/playwright/accounting-imports-1440.png'});
 }
 if(errors.length||writes.length)throw new Error(JSON.stringify({errors,writes}));return{normalAppReadOnly:true,responsiveRows:true,singleActiveNavigation:true,invalidLedgerDateGuidance:true,emptyImportDisabled:true,widths:[320,390,768,1440],writes:0,pageErrors:errors};
}
