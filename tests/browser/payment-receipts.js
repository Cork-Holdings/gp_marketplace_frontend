// Local fixture login only. All collection/disbursement requests are blocked.
// Run with playwright-cli run-code --filename tests/browser/payment-receipts.js
async page => {
 const root='http://127.0.0.1:5173';
 const errors=[];const writes=[];
 await page.unrouteAll({behavior:'wait'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',route=>{
  if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort();}
  return route.continue();
 });
 const authResponse=await page.request.post('http://127.0.0.1:8080/api/v1/auth/login',{data:{email:'customer@example.com',password:'CustomerPass123!'}});
 if(!authResponse.ok())throw new Error(`Local customer login failed: ${authResponse.status()}`);
 const auth=await authResponse.json();
 const headers={Authorization:`Bearer ${auth.access_token}`};
 const endpoint='http://127.0.0.1:8080/api/v1/customers/me/payment-receipts';
 const response=await page.request.get(endpoint,{headers});
 if(!response.ok())throw new Error(`Receipts endpoint failed: ${response.status()} ${await response.text()}`);
 const all=await response.json();
 if(!all.items?.length)throw new Error('No existing paid receipts to verify');
 const quote=all.items.find(r=>r.kind==='quote'&&!r.simulated&&!r.refunded);
 if(!quote)throw new Error('No live paid quoted-service receipt');
 const denied=await page.request.get(endpoint);
 if(denied.status()!==401)throw new Error('Unauthenticated receipt access not rejected');
 const absent=await(await page.request.get(endpoint+'?kind=quote&source_id=ffffffff-ffff-4fff-8fff-ffffffffffff',{headers})).json();
 if(absent.items?.length!==0)throw new Error('Unknown source unexpectedly returned a receipt');
 await page.evaluate(auth=>{localStorage.setItem('geepay_access_token',auth.access_token);localStorage.setItem('geepay_user',JSON.stringify(auth.user));},auth);
 const widths=[];
 for(const width of [320,390,1440]){
  await page.setViewportSize({width,height:1000});
  await page.goto(`${root}/account/transactions?receipt_kind=${quote.kind}&receipt_source=${quote.source_id}`);
  const receipt=page.locator('.payment-receipt').first();await receipt.waitFor();
  const text=await receipt.innerText();
  if(!text.includes(quote.reference)||!text.includes(quote.business)||!text.includes(quote.title)||!text.includes('Full payment'))throw new Error('Receipt omitted saved context');
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw new Error(`Receipt overflow at ${width}`);
  await page.evaluate(()=>{
   window.__receiptPrints=[];
   window.print=()=>{
    window.__receiptPrints.push({count:document.querySelectorAll('#receipt-print').length,text:document.getElementById('receipt-print')?.textContent});
    window.dispatchEvent(new Event('afterprint'));
   };
  });
  await receipt.getByRole('button',{name:'Print / save PDF',exact:true}).click();
  const printing=await page.evaluate(()=>({items:window.__receiptPrints,remaining:document.querySelectorAll('#receipt-print').length}));
  if(printing.items.length!==1||printing.items[0].count!==1||!printing.items[0].text.includes(quote.reference)||printing.remaining!==0)throw new Error('Print target not isolated/restored');
  if(width===390)await receipt.screenshot({path:'output/playwright/brand-review/service-payment-receipt-390.png'});
  widths.push(width);
 }
 await page.goto(`${root}/account/quotes?detail=${quote.source_id}`);
 await page.locator('.payment-receipt-shortcut').first().waitFor();
 const link=await page.locator('.payment-receipt-shortcut').first().getAttribute('href');
 if(!link.includes(quote.source_id))throw new Error('Paid estimate does not link its receipt');
 // Inject a receipt-only error; no payment/operational records are changed.
 await page.route('**/api/v1/customers/me/payment-receipts?**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Receipts unavailable'})}));
 await page.goto(root+'/account/transactions');
 await page.locator('#payment-receipts').getByRole('button',{name:'Try again'}).waitFor();
 await page.unroute('**/api/v1/customers/me/payment-receipts?**');
 await page.locator('#payment-receipts').getByRole('button',{name:'Try again'}).click();
 const receipts=page.locator('#payment-receipts');
 await receipts.getByRole('table',{name:'Receipts',exact:true}).waitFor();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const search=receipts.getByRole('searchbox',{name:'Find a receipt'});
  await search.fill(quote.reference);await receipts.getByRole('table').getByText(quote.title,{exact:true}).waitFor();
  if(await receipts.getByRole('table').locator('tbody>tr:not(.customer-list-detail-row)').count()!==1)throw new Error('Reference filter did not isolate receipt');
  await search.fill('No such receipt in this test');await receipts.getByText('No receipts match your search on this page.',{exact:true}).waitFor();
  await search.fill('');await receipts.getByRole('table').waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Receipt table overflow '+width);
  await page.locator('#account-main').evaluate(node=>node.scrollTo(0,0));
  if(width===1440)await page.screenshot({path:'output/playwright/payment-receipts-table-1440.png'});
  if(width===390)await page.screenshot({path:'output/playwright/payment-receipts-table-390.png'});
 }
 const pages=receipts.getByRole('navigation',{name:'Receipt pages'});
 if(await pages.count()&&!await pages.getByRole('button',{name:'Next',exact:true}).isDisabled()){
  await pages.getByRole('button',{name:'Next',exact:true}).click();await pages.getByText('Page 2',{exact:true}).waitFor();await receipts.getByRole('table').waitFor();
  await pages.getByRole('button',{name:'Previous',exact:true}).click();await pages.getByText('Page 1',{exact:true}).waitFor();await receipts.getByRole('table').waitFor();
 }
 await receipts.getByRole('searchbox',{name:'Find a receipt'}).fill(quote.reference);
 for(const view of ['action_queue','table_detail','business_ledger','expandable_table']){
  await receipts.getByLabel('List view',{exact:true}).selectOption(view);
  await receipts.getByRole('button',{name:'View receipt: '+quote.title,exact:true}).or(receipts.getByRole('button',{name:'View receipt',exact:true})).first().click();
  const dialog=page.getByRole('dialog',{name:'Payment receipt',exact:true});await dialog.waitFor();
  if(!(await dialog.innerText()).includes(quote.reference))throw new Error('Wrong receipt opened');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 }

 if(writes.length||errors.length)throw new Error(JSON.stringify({writes,errors}));
 return {existingReceipts:all.items.length,kinds:[...new Set(all.items.map(r=>r.kind))],widths,printIsolated:true,paidEstimateLink:true,unauthenticatedDenied:true,unknownSourceEmpty:true,errorRetry:true,searchAndEmptyState:true,allFourTableViews:true,responsiveReceiptTable:true,financialWrites:writes.length,pageErrors:errors};
}
