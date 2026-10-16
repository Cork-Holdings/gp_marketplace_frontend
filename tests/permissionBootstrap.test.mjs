import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(`../src/${p}`,import.meta.url),'utf8');
test('permission routes wait for both singular and any-permission gates',()=>{
 assert.match(read('lib/ProtectedRoute.tsx'),/\(permission \|\| anyPermission\?\.length\) && permLoading/);
});
test('permission readiness includes business bootstrap and identity-scoped results',()=>{
 const source=read('lib/context/permissions.tsx');assert.match(source,/!initialized \|\| storesLoading \|\| resolvedKey !== key/);assert.match(source,/resolvedKey === key \? permissions : new Set/);assert.match(source,/request === version.current/);
});
test('empty or failed store lists finish bootstrap instead of retrying forever',()=>{
 const source=read('lib/context/marketplace.tsx');assert.match(source,/setLoading\(false\); setInitialized\(true\)/);assert.match(source,/isMerchant && !initialized/);assert.doesNotMatch(source,/isMerchant && !stores.length/);
});
