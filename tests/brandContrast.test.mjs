import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('primary control uses a readable steel-blue shade against white',()=>{
 const css=readFileSync(new URL('../src/index.css',import.meta.url),'utf8');
 const color=css.match(/--btn-primary:\s*#([a-f0-9]{6})/i)?.[1];assert.ok(color);
 const channels=color.match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
 assert.ok(1.05/(luminance+.05)>=4.5);
 assert.match(css,/--gp-steel:\s*#257DC1/);
});

test('opt-in gradient keeps white labels readable across its full colour range',()=>{
 const css=readFileSync(new URL('../src/index.css',import.meta.url),'utf8');
 const hex=name=>css.match(new RegExp(`--${name}:\\s*#([a-f0-9]{6})`,'i'))[1].match(/../g).map(c=>parseInt(c,16));
 const steel=hex('gp-steel'),aqua=hex('gp-sky');
 const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 for(const token of ['brand-action-scrim','brand-action-hover-scrim']){
  const match=css.match(new RegExp(`--${token}:\\s*linear-gradient\\(rgba\\((\\d+), (\\d+), (\\d+), ([\\d.]+)\\)`));
  assert.ok(match,`missing ${token}`);
  const overlay=match.slice(1,4).map(Number),opacity=Number(match[4]);
  for(let step=0;step<=100;step++){
   const t=step/100;
   const pixel=steel.map((from,i)=>(from+(aqua[i]-from)*t)*(1-opacity)+overlay[i]*opacity);
   assert.ok(1.05/(luminance(pixel)+.05)>=4.5,`${token} contrast fails at ${step}%`);
  }
 }
});
