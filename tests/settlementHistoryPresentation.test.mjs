import test from "node:test";
import assert from "node:assert/strict";
import {
  historyLabel,
  historyAddress,
  historyAmount,
  historyDate,
} from "../src/lib/settlementHistoryPresentation.ts";

test('structured addresses show readable location text, not JSON', () => {
  assert.equal(historyAddress({line1:'My Place',city:'Lusaka',country:'ZM'}), 'My Place, Lusaka, ZM');
  assert.equal(historyAddress(null), 'Not recorded');
});
test("history labels distinguish customer confirmation, work submission and payment", () => {
  assert.equal(
    historyLabel("customer_confirmed"),
    "Customer confirmed completion",
  );
  assert.equal(
    historyLabel("provider_completed"),
    "Work submitted for customer review",
  );
  assert.equal(
    historyLabel("release_recovered"),
    "Merchant disbursement authorised",
  );
  assert.equal(historyLabel("successful"), "Payment confirmed");
  assert.equal(historyLabel("under_review"), "Under review");
});
test("history amounts keep decimal currency units and do not invent missing zeros", () => {
  assert.match(historyAmount("2.00", "ZMW"), /2\.00/);
  assert.match(historyAmount(0, "ZMW"), /0\.00/);
  for (const value of [null, undefined, "", NaN, "oops"])
    assert.equal(historyAmount(value), "Not recorded");
});
test("history date uses Lusaka time and handles missing timestamps", () => {
  assert.match(historyDate("2026-10-16T14:35:05Z", "time"), /4:35/);
  assert.match(historyDate("2026-10-16T14:35:05Z", "date"), /16 Oct 2026/);
  assert.equal(historyDate(null), "Time not recorded");
  assert.equal(historyDate("invalid"), "Time not recorded");
});
