// Read-only browser regression. Run with playwright-cli run-code --filename tests/browser/marketplace-layout.js
async page => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const writes=[];
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',route=>{
    if(!['GET','HEAD','OPTIONS'].includes(route.request().method())){writes.push(route.request().url());return route.abort();}
    return route.continue();
  });
  const results=[];
  for(const width of [320,390,430,720,768,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto('http://127.0.0.1:5173/');
    await page.locator('.reference-market-card').first().waitFor();
    await page.evaluate(()=>document.fonts.ready);
    const measured=await page.evaluate(()=>{
      const $=s=>document.querySelector(s);
      const css=s=>getComputedStyle($(s));
      const rect=s=>$(s).getBoundingClientRect().toJSON();
      return {
        width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
        columns:css('.reference-market-card-grid').gridTemplateColumns.split(' ').length,
        titleSize:parseFloat(css('.reference-market-card h3').fontSize),
        priceSize:parseFloat(css('.reference-market-card-bottom strong').fontSize),
        searchSize:parseFloat(css('.reference-market-search input').fontSize),
        actionHeight:rect('.reference-card-add').height,
        railScrollbar:css('.reference-market-categories').scrollbarWidth,
        cardHeight:rect('.reference-market-card-copy').height,
        copyScroll:$('.reference-market-card-copy').scrollHeight,
        upcomingCount:document.querySelectorAll('.reference-market-upcoming').length,
        categoryCount:document.querySelectorAll('.reference-market-categories a').length,
        bottomNavPosition:css('.reference-bottom-nav').position,
        brandStacked:rect('.reference-brand strong').top>=rect('.reference-brand img').bottom
          &&rect('.reference-brand small').top>=rect('.reference-brand strong').bottom,
        headerRects:[...document.querySelectorAll('.discovery-masthead > a,.reference-market-location,.discovery-header-actions')].map(el=>el.getBoundingClientRect().toJSON()),
        sameActions:[...document.querySelectorAll('.reference-market-card')].every(card=>card.querySelector('h3 a').href===card.querySelector('.reference-card-add').href)
      };
    });
    assert(!measured.overflow,`outer overflow at ${width}`);
    assert(measured.brandStacked,`Marketplace is not below the GeePay logo at ${width}`);
    assert(measured.columns===(width<=767?2:4),`wrong grid at ${width}`);
    assert(measured.titleSize>=15&&measured.priceSize>=16,`tiny card text at ${width}`);
    if(width<=767){assert(measured.searchSize>=16,`tiny search at ${width}`);assert(measured.bottomNavPosition==='fixed',`bottom navigation not fixed at ${width}`);}
    assert(measured.actionHeight>=44,`small action at ${width}`);
    assert(measured.copyScroll<=measured.cardHeight+1,`clipped copy at ${width}`);
    assert(measured.railScrollbar==='none',`visible ribbon scrollbar at ${width}`);
    assert(measured.upcomingCount===0&&measured.categoryCount===5&&measured.sameActions,`lost data/navigation at ${width}`);
    for(const rect of measured.headerRects)assert(rect.left>=0&&rect.right<=width+1,`header escaped at ${width}`);
    if(width===390||width===1440)await page.screenshot({path:`output/playwright/brand-review/readable-grid-${width}.png`,fullPage:false});
    // Exercise long content in the actual rendered component without changing data.
    await page.locator('.reference-market-card h3 a').first().evaluate(el=>el.textContent='An unusually long made-to-order service and product name for a full family celebration');
    await page.locator('.reference-market-card-bottom strong').first().evaluate(el=>el.textContent='Price after review');
    assert(await page.locator('.reference-market-card-copy').first().evaluate(el=>el.scrollHeight<=el.clientHeight+1),`long content clipped at ${width}`);
    results.push(measured);
  }
  await page.setViewportSize({width:390,height:900});
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('.reference-market-card').first().waitFor();
  await page.getByRole('button',{name:'See All / Filters'}).click();
  assert(await page.locator('#reference-discovery-filters').isVisible(),'filters failed');
  await page.locator('#reference-market-query').fill('no-such-catalogue-item-837261');
  await page.getByText('No matching offerings yet. Try another search or category.').waitFor();
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await page.locator('.reference-market-card').first().waitFor();
  assert(await page.locator('a[href*="coming-soon"]').count()===0,'planned feature link remains');
  assert(writes.length===0,'unexpected data mutation');
  assert(errors.length===0,`page errors: ${errors.join(';')}`);
  return {results,searchAndFilters:true,plannedFeaturesHidden:true,writes,errors};
}
