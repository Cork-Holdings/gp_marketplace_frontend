// Real local data, read-only requests. Exercise empty, populated, filter,
// day/week navigation, keyboard, responsive layouts, and error recovery.
async page => {
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const root='http://127.0.0.1:5173';
 await page.route('**/api/**',route=>['GET','HEAD','OPTIONS'].includes(route.request().method())?route.continue():route.abort());
 const response=await page.request.post('http://127.0.0.1:8080/api/v1/auth/login',{data:{email:'owner@barber.co.zm',password:'OwnerPass123!'}});
 if(!response.ok())throw new Error('Local fixture sign-in failed');
 const auth=await response.json();
 await page.evaluate(auth=>{localStorage.setItem('geepay_access_token',auth.access_token);localStorage.setItem('geepay_user',JSON.stringify(auth.user));},auth);
 await page.setViewportSize({width:1440,height:1000});await page.goto(root+'/portal/owner/bookings');
 await page.getByRole('combobox',{name:'Branch',exact:true}).selectOption('00000000-0000-0000-0000-000000000010');
 const calendar=page.locator('.employee-calendar');
 await calendar.locator('.calendar-team-chip').first().waitFor();
 const today=await calendar.getByLabel('Day',{exact:true}).inputValue();
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:1000});
  if(await calendar.locator('.calendar-empty h4').count()!==1)throw new Error('Expected one consolidated empty state');
  if(await calendar.getByText('No scheduled visits.',{exact:true}).count())throw new Error('Repeated employee empty messages remain');
  if(await calendar.getByRole('group',{name:'Week dates'}).getByRole('button').count()!==7)throw new Error('Week navigation missing dates');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Overflow at '+width);
  if(await calendar.locator('.calendar-selected-day').evaluate(element=>element.getBoundingClientRect().height>32))throw new Error('Selected date wraps at '+width);
  await calendar.screenshot({path:`output/playwright/calendar-redesign-empty-${width}.png`});
 }
 const next=calendar.getByRole('button',{name:'Next day',exact:true});await next.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(value=>document.querySelector('input[name=calendar_day]')?.value!==value,today);
 await calendar.getByRole('button',{name:'Today',exact:true}).click();
 await page.waitForFunction(value=>document.querySelector('input[name=calendar_day]')?.value===value,today);
 const weekDay=calendar.getByRole('group',{name:'Week dates'}).getByRole('button').first();await weekDay.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('.calendar-week-strip button[aria-pressed=true]')===document.querySelector('.calendar-week-strip button'));
 await calendar.getByLabel('Day',{exact:true}).fill('2026-10-09');
 await calendar.getByRole('button',{name:'Agenda view',exact:true}).click();
 await calendar.locator('.employee-calendar-agenda').getByRole('link',{name:/Beard trim/}).waitFor();
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});
  await calendar.screenshot({path:`output/playwright/calendar-redesign-booked-${width}.png`});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error('Booked agenda overflow at '+width);
 }
 await calendar.getByRole('button',{name:'Timeline view',exact:true}).click();
 await calendar.locator('.employee-calendar-grid-wrap').waitFor();
 if(await calendar.getByRole('button',{name:'Timeline view',exact:true}).getAttribute('aria-pressed')!=='true')throw new Error('Layout selection not announced');
 await calendar.screenshot({path:'output/playwright/calendar-redesign-timeline-1440.png'});
 const person=await calendar.getByRole('combobox',{name:'Team member',exact:true}).locator('option').nth(1).getAttribute('value');
 await calendar.getByRole('combobox',{name:'Team member',exact:true}).selectOption(person);
 await calendar.getByRole('heading',{name:'No bookings for this day',exact:true}).waitFor();
 await calendar.getByRole('combobox',{name:'Team member',exact:true}).selectOption('all');
 await calendar.locator('.employee-calendar-event').first().waitFor();
 await page.route('**/day-calendar?**',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Calendar unavailable"}'}));
 await calendar.getByRole('button',{name:'Refresh calendar',exact:true}).click();
 await calendar.getByText('Calendar couldn’t load',{exact:true}).waitFor();
 await page.unroute('**/day-calendar?**');await calendar.getByRole('button',{name:'Try again',exact:true}).click();
 await calendar.locator('.employee-calendar-event').first().waitFor();
 if(errors.length)throw new Error(JSON.stringify(errors));
 return {widths:[320,390,768,1440],singleEmptyState:true,weekNavigation:true,keyboardDayNavigation:true,agendaAndTimeline:true,employeeFilter:true,retry:true,pageErrors:errors};
}
