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
