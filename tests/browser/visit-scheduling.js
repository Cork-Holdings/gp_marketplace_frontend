// Read-only local-browser check: requests are filled/reviewed, never submitted.
async page => {
 const root='http://127.0.0.1:5173';const api='http://127.0.0.1:8080/api/v1';
 const errors=[],writes=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort();}return route.continue();});
 async function login(email,password){const response=await page.request.post(api+'/auth/login',{data:{email,password}});if(!response.ok())throw new Error('Local fixture sign-in failed: '+response.status());const auth=await response.json();await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user));},auth);return auth;}
 await login('customer@example.com','CustomerPass123!');
 await page.setViewportSize({width:390,height:950});
 await page.goto(root+'/account/quotes?request=1');
 await page.getByRole('button',{name:/Mulenga Mobile Grooming/}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.getByLabel('What needs doing?').fill('Visit-time browser preview');
 await page.getByLabel('Details',{exact:true}).fill('A scheduling preview only; do not submit this request.');
 await page.getByLabel('Service address',{exact:true}).fill('10 Example Road');
 await page.getByLabel('City or town',{exact:true}).fill('Lusaka');
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
 await page.getByLabel('Preferred date and time (Zambia time)',{exact:true}).fill(date+'T10:30');
 await page.getByRole('button',{name:'Review request',exact:true}).click();
 if(!await page.getByText('Preferred arrival:',{exact:true}).isVisible())throw new Error('Requested time missing from review');
 if(!await page.getByRole('button',{name:'Send request',exact:true}).isEnabled())throw new Error('Valid preferred time does not enable review');
 await page.screenshot({path:'output/playwright/visit-request-390.png',fullPage:true});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Customer request overflows phone viewport');
 // Leave without sending. Verify real calendar data under owner authorization.
 const owner=await login('owner@barber.co.zm','OwnerPass123!');
 const headers={Authorization:`Bearer ${owner.access_token}`};const store='00000000-0000-0000-0000-000000000011';
 const endpoint=`${api}/owner/stores/${store}/day-calendar?date=${date}`;
 const response=await page.request.get(endpoint,{headers});if(!response.ok())throw new Error('Calendar API failed: '+response.status()+' '+await response.text());
 const calendar=await response.json();if(!Array.isArray(calendar.employees)||!Array.isArray(calendar.events))throw new Error('Invalid calendar response');
 const denied=await page.request.get(endpoint);if(denied.status()!==401)throw new Error('Calendar exposed without authentication');
 const otherMerchant=await page.request.get(`${api}/owner/stores/00000000-0000-0000-0000-000000000110/day-calendar?date=${date}`,{headers});if(otherMerchant.status()!==403)throw new Error('Calendar did not enforce branch access');
 await page.setViewportSize({width:1440,height:1000});await page.goto(root+'/portal/owner/bookings');
 await page.getByRole('combobox',{name:'Branch',exact:true}).selectOption('00000000-0000-0000-0000-000000000010');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(root+'/portal/owner/bookings');
  await page.getByRole('heading',{name:'Team calendar',exact:true}).waitFor();
  await page.locator('.calendar-team-chip').first().waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Team calendar page overflows at '+width);
  await page.locator('.employee-calendar').screenshot({path:`output/playwright/team-calendar-${width}.png`});
 }
 await page.getByLabel('Day',{exact:true}).fill('2026-10-09');
 await page.getByRole('button',{name:'Agenda view',exact:true}).click();
 await page.locator('.employee-calendar-agenda').getByRole('link',{name:/Beard trim/}).first().waitFor();
 await page.screenshot({path:'output/playwright/team-calendar-existing-booking.png'});
 await page.goto(root+'/portal/owner/jobs');await page.getByRole('heading',{name:'Team calendar',exact:true}).waitFor();
 await page.goto(root+'/portal/owner/bookings?view=setup&section=resources');
 await page.getByText('Add resource',{exact:true}).first().waitFor();
 if(!await page.getByRole('combobox',{name:'Employee (optional)',exact:true}).isVisible())await page.getByText('Add resource',{exact:true}).first().click();
 await page.getByRole('combobox',{name:'Employee (optional)',exact:true}).waitFor();
 await page.goto(root+'/portal/owner/quotes');
 await page.getByRole('combobox',{name:'Branch',exact:true}).selectOption(store);
 await page.getByRole('button',{name:'Create quote',exact:true}).click();
 await page.getByRole('combobox',{name:'Visit length',exact:true}).selectOption('60');
 await page.getByLabel('Proposed arrival (Zambia time)',{exact:true}).fill(date+'T11:00');
 await page.getByText(/Proposed window:.*11:00.*12:00/).waitFor();
 await page.screenshot({path:'output/playwright/provider-visit-proposal.png'});
 if(errors.length||writes.length)throw new Error(JSON.stringify({errors,writes}));
 return {customerPreferredTimeReview:true,calendarEmployees:calendar.employees.length,existingBookingRendered:true,unauthenticatedDenied:true,otherMerchantDenied:true,calendarBothWorkflows:true,widths:[390,1440],financialWrites:0,pageErrors:errors};
}
