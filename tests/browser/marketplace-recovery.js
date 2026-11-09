// Read-only browser regression. Run with playwright-cli run-code --filename tests/browser/marketplace-recovery.js
async page => {
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  await page.setViewportSize({width:390,height:900});
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('.reference-market-card').first().waitFor();
  const categories=page.locator('.reference-market-categories a');
  await categories.first().focus();
  for(let i=0;i<8;i++)await page.keyboard.press('Tab');
  const ribbon=await categories.last().evaluate(el=>{
    const r=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();
    return {focused:el===document.activeElement,visible:r.left>=parent.left-1&&r.right<=parent.right+1,scrolled:el.parentElement.scrollLeft>0,scrollbar:getComputedStyle(el.parentElement).scrollbarWidth};
  });
  assert(ribbon.focused&&ribbon.visible&&ribbon.scrolled&&ribbon.scrollbar==='none','hidden ribbon lost keyboard access');
  const storePath=await page.locator('.reference-market-card-category').first().getAttribute('href');
  await page.goto(`http://127.0.0.1:5173${storePath}`);
  await page.locator('.reference-store').waitFor();
  assert(await page.locator('.reference-marketplace-home').count()===0,'homepage styles leaked to storefront');
  let fail=true;
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/v1/marketplace/offerings?**',async route=>{
    if(fail){await gate;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporarily unavailable'})});}
    return route.continue();
  });
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('.reference-market-skeleton').first().waitFor();
  const loadingColumns=await page.locator('.reference-market-card-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  assert(loadingColumns===2,'loading layout does not match final grid');
  release();
  await page.getByText('Marketplace could not be loaded',{exact:true}).waitFor();
  fail=false;
  await page.getByRole('button',{name:/retry|try again/i}).first().click();
  await page.locator('.reference-market-card').first().waitFor();
  return {ribbon,storefrontUnaffected:true,loadingColumns,errorRetryRecovered:true};
}
