import assert from 'node:assert/strict';
import { test } from 'node:test';
import { storeLinkIssue, ussdCodeIssue } from '../src/lib/storeIdentity.ts';
import { beginAction, feedbackStore, showToast, dismissToast, actionSuccessMessage } from '../src/lib/actionFeedback.ts';
test('store links match platform format and length', () => {
 for (const value of ['s-uk77','my-barber','a'.repeat(100)]) assert.equal(storeLinkIssue(value),null);
 for (const value of ['','Two Words','a--b','/store/foo','a'.repeat(101)]) assert.ok(storeLinkIssue(value));
});
test('USSD accepts short codes and complete submenu codes', () => {
 for (const value of ['115','*115#','*111*1*1#']) assert.equal(ussdCodeIssue(value),null);
 for (const value of ['','111*1*1','*111**1#','*111','115#','abc','1'.repeat(21)]) assert.ok(ussdCodeIssue(value));
});
test('global loader tracks concurrent actions and ends exactly once', () => {
 const first=beginAction(), second=beginAction();
 assert.equal(feedbackStore.getSnapshot().pending,2);
 first();first(); assert.equal(feedbackStore.getSnapshot().pending,1);
 second();assert.equal(feedbackStore.getSnapshot().pending,0);
});
test('newest toast replaces old messages and old dismissal cannot clear it', () => {
 showToast('First');const first=feedbackStore.getSnapshot().toast.id;
 showToast('Second'); dismissToast(first);assert.equal(feedbackStore.getSnapshot().toast.message,'Second');
 dismissToast(feedbackStore.getSnapshot().toast.id);assert.equal(feedbackStore.getSnapshot().toast,null);
});
test('request acknowledgement does not claim payment success', () => {
 assert.match(actionSuccessMessage('/payments/collect','POST'),/Check its status/);
 assert.doesNotMatch(actionSuccessMessage('/payments/collect','POST'),/confirmed|successful/i);
});
