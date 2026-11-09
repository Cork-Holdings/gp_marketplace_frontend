// Working module overviews are combined into dashboards; roadmap stays internal.
async page=>{
 const root='http://127.0.0.1:5173',errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function login(email,password){const r=await page.request.post(root+'/api/v1/auth/login',{data:{email,password}});if(!r.ok())throw new Error('Login failed');const a=await r.json();await page.goto(root);await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user));},a);}
 for(const role of ['owner','admin']){
  await login(role==='owner'?'owner@barber.co.zm':'admin@geepay.local',role==='owner'?'OwnerPass123!':'AdminPass123!');
  await page.goto(root+'/portal/'+role+'/modules');await page.waitForURL('**/portal/'+role);await page.getByRole('heading',{name:'Business modules',exact:true}).waitFor();
  if(await page.getByRole('link',{name:'Explore modules',exact:true}).count())throw new Error('Duplicate module start remains');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Dashboard overflow '+role+' '+width);}
  await page.goto(root+'/portal/'+role+'/modules/finance');await page.getByRole('heading',{name:'At a glance',exact:true}).waitFor();await page.getByText('Loading current activity…',{exact:true}).waitFor({state:'hidden'});
  if(await page.locator('.module-planned-list,.module-planned-disclosure,.reference-menu .reference-soon').count())throw new Error('Planned UI remains');
  await page.getByRole('link',{name:'Dashboard',exact:true}).last().click();await page.waitForURL('**/portal/'+role);
  await page.setViewportSize({width:390,height:1000});await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();const drawer=page.getByRole('dialog');await drawer.locator('summary').filter({hasText:'Finance & accounting'}).focus();await page.keyboard.press('Enter');await drawer.getByRole('link',{name:role==='owner'?'Accounting':'Business ERP oversight',exact:true}).click();await page.waitForURL('**/portal/'+role+'/'+(role==='owner'?'accounting':'erp'));if(await drawer.isVisible())throw new Error('Drawer remained open');
 }
 await page.setViewportSize({width:1440,height:1100});await page.goto(root+'/portal/admin');await page.getByRole('heading',{name:'Business modules',exact:true}).waitFor();await page.screenshot({path:'output/playwright/admin-dashboard-combined-1440.png',fullPage:true});
 if(errors.length)throw new Error(errors.join(' / '));return{dashboardAndDirectoryCombined:true,duplicateNavigationRemoved:true,moduleVisuals:true,roadmapHidden:true,mobileDrawerKeyboard:true,widths:[320,390,768,1440],errors};
}
