// Normal local app. Reads real records without posting money, changing plans or HR.
async page=>{
 const root='http://127.0.0.1:5173',errors=[],serverErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=500)serverErrors.push(r.url())});
 async function login(email,password){const r=await page.request.post(root+'/api/v1/auth/login',{data:{email,password}});if(!r.ok())throw new Error('Login failed '+r.status());const a=await r.json();await page.goto(root);await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user));},a);return a;}
 const admin=await login('admin@geepay.local','AdminPass123!');
 const headers={Authorization:'Bearer '+admin.access_token};
 for(const kind of ['customers','products','categories','quotes','jobs','bookings','custom-orders']){const r=await page.request.get(root+'/api/v1/admin/workspace/'+kind,{headers});if(!r.ok())throw new Error(kind+' '+r.status()+': '+await r.text());}
 const branch='00000000-0000-0000-0000-000000000010';
 for(const kind of ['suppliers','purchases','stock','receipts','documents','journals','balances','payment-records','trial-balance','bank-lines','bank-match-history','period-history','employees','people','events']){const r=await page.request.get(root+`/api/v1/admin/stores/${branch}/erp/${kind}?from=2026-01-01&to=2026-12-31`,{headers});if(!r.ok())throw new Error('ERP '+kind+' '+r.status()+': '+await r.text());}
 await page.setViewportSize({width:1920,height:1050});await page.goto(root+'/portal/admin/erp?view=documents&store='+branch);await page.getByRole('heading',{name:'Business ERP oversight',exact:true}).waitFor();
 await page.getByText('Loading records…',{exact:true}).waitFor({state:'hidden'});
 const tops=await page.locator('.admin-records-filters input[type=search],.admin-records-filters select').evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().top)));
 if(Math.max(...tops)-Math.min(...tops)>2)throw new Error('Filter controls are misaligned '+tops.join(','));
 await page.screenshot({path:'output/playwright/admin-erp-aligned-1920.png',fullPage:true});
 for(const [ownerPath,expected] of [['purchasing','erp'],['stock-control','erp'],['accounting','erp'],['reconciliation','erp'],['reports','erp'],['people','erp'],['customers','customers'],['activity','erp']]){await page.goto(root+'/portal/owner/'+ownerPath);await page.waitForURL(url=>url.pathname==='/portal/admin/'+expected);}
 await page.goto(root+'/portal/admin/coming-soon/customers');await page.waitForURL('**/portal/admin/customers');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});for(const route of ['customers','products','categories','operations','erp?store='+branch+'&view=documents','modules/people','plans/new','plans/business/edit']){
   if(route==='modules/people')continue;
   await page.goto(root+'/portal/admin/'+route);await page.locator('h1').first().waitFor();await page.waitForTimeout(200);
   if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Overflow '+route+' '+width);
   if(await page.getByText('Something went wrong',{exact:true}).isVisible().catch(()=>false))throw new Error('Error page '+route);
   if(width===390&&route==='plans/business/edit')await page.screenshot({path:'output/playwright/admin-plan-editor-390.png',fullPage:true});
 }}
 await page.setViewportSize({width:1440,height:1100});await page.goto(root+'/portal/admin/plans/business/edit');await page.getByLabel('Plan name',{exact:true}).waitFor();await page.screenshot({path:'output/playwright/admin-plan-editor-1440.png',fullPage:true});
 for(const module of ['sales','inventory','customers','finance','administration','trust','online-presence']){await page.goto(root+'/portal/admin/modules/'+module);await page.getByRole('heading',{name:'At a glance',exact:true}).waitFor();await page.getByText('Loading current activity…',{exact:true}).waitFor({state:'hidden'});if(await page.locator('.module-planned-list,.module-planned-disclosure').count())throw new Error('Roadmap in interface');}
 await page.goto(root+'/portal/admin/modules/sales');await page.getByRole('heading',{name:'At a glance',exact:true}).waitFor();await page.getByText('Loading current activity…',{exact:true}).waitFor({state:'hidden'});await page.screenshot({path:'output/playwright/admin-operations-overview-1440.png',fullPage:true});
 if(await page.locator('.reference-menu .reference-soon').count())throw new Error('Coming soon nav badges remain');
 const owner=await login('owner@barber.co.zm','OwnerPass123!');await page.goto(root+'/portal/owner/people');await page.getByRole('combobox',{name:'Branch',exact:true}).selectOption('00000000-0000-0000-0000-000000000011');
 await page.getByRole('table',{name:'Employee directory',exact:true}).waitFor();const r=await page.request.get(root+'/api/v1/owner/stores/00000000-0000-0000-0000-000000000011/erp/employees',{headers:{Authorization:'Bearer '+owner.access_token}});const employees=(await r.json()).items;
 for(const person of employees)await page.getByRole('table',{name:'Employee directory',exact:true}).getByText(person.name,{exact:true}).waitFor();
 await page.getByLabel('Find an employee',{exact:true}).fill('Daniel');await page.getByRole('table',{name:'Employee directory',exact:true}).getByText('Daniel Zaga',{exact:true}).waitFor();
 await page.getByLabel('Find an employee',{exact:true}).fill('');await page.screenshot({path:'output/playwright/owner-employees-1440.png',fullPage:true});
 for(const module of ['people','finance','inventory','customers','calendar']){await page.goto(root+'/portal/owner/modules/'+module);await page.getByRole('heading',{name:'At a glance',exact:true}).waitFor();await page.getByText('Loading current activity…',{exact:true}).waitFor({state:'hidden'});}
 await page.goto(root+'/portal/owner/reports');await page.getByRole('heading',{name:'Recorded collections · all time',exact:true}).waitFor();await page.screenshot({path:'output/playwright/owner-reports-real-data-1440.png',fullPage:true});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:1000});for(const route of ['people','reports','modules/people']){await page.goto(root+'/portal/owner/'+route);await page.locator('h1').waitFor();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Owner overflow '+route+' '+width);}}
 const customer=await login('customer@example.com','CustomerPass123!');await page.goto(root+'/account/invoices');await page.getByRole('heading',{name:'Your invoices',exact:true}).waitFor();const denied=await page.request.get(root+'/api/v1/admin/workspace/customers',{headers:{Authorization:'Bearer '+customer.access_token}});if(denied.status()!==403)throw new Error('Customer admin access accepted');
 if(errors.length||serverErrors.length)throw new Error(JSON.stringify({errors,serverErrors}));return {adminDirectories:true,allERPViews:true,legacyAdminLinks:true,filtersAligned:true,employees:employees.length,planEditorPages:true,visualOverviews:true,roadmapHidden:true,realReports:true,widths:[320,390,768,1440,1920],errors,serverErrors};
}
