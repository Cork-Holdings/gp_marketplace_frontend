// Read-only UI fixtures test long tables without creating business or payment data.
async page => {
 const root='http://127.0.0.1:5173',errors=[],writes=[];
 await page.unrouteAll({behavior:'wait'});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort();}return route.continue();});
 async function login(email,password,base=root){const r=await page.request.post(base+'/api/v1/auth/login',{data:{email,password}});if(!r.ok())throw new Error('Fixture login failed');const a=await r.json();await page.goto(base);await page.evaluate(a=>{localStorage.clear();localStorage.setItem('geepay_access_token',a.access_token);localStorage.setItem('geepay_user',JSON.stringify(a.user));sessionStorage.setItem('geepay.branch.'+a.user.id,'00000000-0000-0000-0000-000000000010');},a);return a;}
 await login('owner@barber.co.zm','OwnerPass123!');
 const employees='**/api/v1/owner/stores/*/erp/employees';
 await page.route(employees,async route=>{const live=await route.fetch();if(!live.ok())throw new Error('Employee source unavailable');const data=await live.json();if(!data.items?.length)throw new Error('Employee fixture needs an existing row');data.items=Array.from({length:63},(_,i)=>({...data.items[0],id:'pagination-preview-'+i,name:'Pagination staff '+String(i+1).padStart(2,'0'),employee_number:String(700000+i)}));await route.fulfill({response:live,json:data});});
 await page.setViewportSize({width:1440,height:1000});await page.goto(root+'/portal/owner/people');
 const directory=page.locator('.erp-section').filter({has:page.getByRole('heading',{name:'Employee directory',exact:true})});
 for(const view of ['expandable_table','table_detail','business_ledger','action_queue']){
  await directory.getByLabel('List view',{exact:true}).selectOption(view);
  const pager=directory.getByRole('navigation',{name:'Employee directory pagination',exact:true});
  await pager.getByText(/Page 1 of 3/).waitFor();
  const seen=[];
  for(let p=0;p<3;p++){
   const rows=directory.getByRole('table').locator('tbody>tr:not(.record-list-expanded)');const count=await rows.count();if(count!==(p===2?13:25))throw new Error('Wrong page size '+view+' '+p+' '+count);
   seen.push(...await rows.locator('td:nth-child(2)').allTextContents());
   if(view==='table_detail')await directory.getByRole('complementary').getByText('Pagination staff '+String(p*25+1).padStart(2,'0'),{exact:true}).waitFor();
   if(p<2)await pager.getByRole('button',{name:'Next',exact:true}).click();
  }
  if(new Set(seen).size!==63)throw new Error('Skipped or duplicated employee rows');
  if(!await pager.getByRole('button',{name:'Next',exact:true}).isDisabled())throw new Error('Final page can advance');
  await page.getByLabel('Find an employee',{exact:true}).fill('Pagination staff 63');await directory.getByRole('table').getByText('Pagination staff 63',{exact:true}).first().waitFor();
  if(await pager.count())throw new Error('Filtered one-row result kept invalid pagination');
  await page.getByLabel('Find an employee',{exact:true}).fill('');await directory.getByRole('navigation').getByText(/Page 1 of 3/).waitFor();
 }
 await page.unroute(employees);
 await login('customer@example.com','CustomerPass123!');
 const receipts='**/api/v1/customers/me/payment-receipts?**';
 await page.route(receipts,async route=>{const live=await route.fetch();const data=await live.json();if(!data.items?.length)throw new Error('Receipt source unavailable');const source=data.items[0];data.items=Array.from({length:63},(_,i)=>({...source,id:'pagination-receipt-'+i,title:'Pagination receipt '+String(i+1).padStart(2,'0'),reference:'PAGINATION-PREVIEW-'+i}));data.has_more=false;await route.fulfill({response:live,json:data});});
 await page.goto(root+'/account/transactions');const receiptList=page.locator('#payment-receipts');
 for(const view of ['expandable_table','table_detail','business_ledger','action_queue']){
  await receiptList.getByLabel('List view',{exact:true}).selectOption(view);const pager=receiptList.getByRole('navigation',{name:'Receipts pagination',exact:true});await pager.getByText(/Page 1 of 3/).waitFor();
  await pager.getByRole('button',{name:'Next',exact:true}).click();await receiptList.getByRole('table').getByText('Pagination receipt 26',{exact:true}).waitFor();
  if(await receiptList.getByRole('table').getByText('Pagination receipt 01',{exact:true}).count())throw new Error('Previous-page receipt remains');
  await pager.getByRole('button',{name:'Previous',exact:true}).click();await receiptList.getByRole('table').getByText('Pagination receipt 01',{exact:true}).waitFor();
 }
 await receiptList.getByLabel('List view',{exact:true}).selectOption('expandable_table');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1000});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Pagination overflow '+width);const pager=receiptList.getByRole('navigation',{name:'Receipts pagination',exact:true});await pager.scrollIntoViewIfNeeded();const next=pager.getByRole('button',{name:'Next',exact:true});const box=await next.boundingBox();if(!box||box.width<44||box.height<44||box.x<0||box.x+box.width>width)throw new Error('Pagination action clipped '+width);}
 await page.emulateMedia({media:'print'});await page.waitForFunction(()=>document.querySelectorAll('#payment-receipts .customer-list-table tbody>tr:not(.customer-list-detail-row)').length===63);await page.emulateMedia({media:'screen'});await receiptList.getByRole('navigation').getByText(/Page 1 of 3/).waitFor();await page.unroute(receipts);
 // A real long journal dataset covers ordinary tables, independent from the two view components.
 await login('owner@barber.co.zm','OwnerPass123!','http://127.0.0.1:5174');await page.goto('http://127.0.0.1:5174/portal/owner/accounting');
 const journals=page.locator('.erp-section').filter({has:page.getByRole('heading',{name:'Posted journal history',exact:true})});const pager=journals.getByRole('navigation');await pager.waitFor();await journals.getByRole('table').locator('tbody>tr').first().waitFor();const first=await journals.getByRole('table').locator('tbody>tr').first().innerText();await pager.getByRole('button',{name:'Next',exact:true}).click();if(await journals.getByRole('table').locator('tbody>tr').first().innerText()===first)throw new Error('Journal page did not change');
 for(const width of [390,1440]){await page.setViewportSize({width,height:1000});await pager.scrollIntoViewIfNeeded();const scroll=journals.locator('.paginated-table-scroll');await scroll.evaluate(node=>{node.scrollLeft=node.scrollWidth;});const box=await pager.getByRole('button',{name:'Next',exact:true}).boundingBox();if(!box||box.x<0||box.x+box.width>width)throw new Error('Journal pagination moved with table scrolling');}
 await page.emulateMedia({media:'print'});await page.waitForFunction(()=>[...document.querySelectorAll('.erp-section')].find(s=>s.querySelector('h2')?.textContent==='Posted journal history')?.querySelectorAll('tbody>tr').length>25);await page.emulateMedia({media:'screen'});
 if(errors.length||writes.length)throw new Error(JSON.stringify({errors,writes}));return{employeeAndCustomerFixtures:63,allFourViews:true,rowsReachableWithoutDuplicates:true,searchResetsPage:true,selectedPaneFollowsPage:true,realJournalPagination:true,printIncludesAllLoadedRows:true,widths:[320,390,768,1440],financialWrites:0,pageErrors:errors};
}
