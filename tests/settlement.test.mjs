import test from "node:test";
import assert from "node:assert/strict";
import {
  settlementActions,
  settlementLabel,
  settlementMoney,
} from "../src/lib/settlement.ts";
test("recovered collections need finance release, confirmed work and evidence", () => {
  const item = {
    status: "held",
    recovered: true,
    customer_confirmed: true,
    release_evidence_ready: true,
  };
  assert.equal(settlementLabel(item), "Finance release required");
  assert.deepEqual(settlementActions(item, true, false), ["release_recovered"]);
  assert.deepEqual(settlementActions(item, false, false), []);
  assert.deepEqual(
    settlementActions({ ...item, customer_confirmed: false }, true, false),
    [],
  );
  assert.deepEqual(
    settlementActions({ ...item, release_evidence_ready: false }, true, false),
    [],
  );
  for (const status of ["prepared", "pending", "unconfirmed", "successful"])
    assert.deepEqual(
      settlementActions({ ...item, attempt: { status } }, true, false),
      [],
    );
});
test("release is not presented as paid until provider confirmation", () => {
  assert.equal(settlementLabel({ status: "released" }), "Release authorised");
  assert.equal(
    settlementLabel({ status: "released", attempt: { status: "pending" } }),
    "Payout processing",
  );
  assert.equal(settlementLabel({ status: "paid_out" }), "Merchant paid");
  assert.equal(settlementMoney(105).includes("1.05"), true);
});
test("customers dispute only unsent held/released funds; cannot make finance decisions", () => {
  assert.deepEqual(settlementActions({ status: "held" }, false, true), [
    "dispute",
  ]);
  for (const status of ["prepared", "pending", "unconfirmed", "successful"])
    assert.deepEqual(
      settlementActions(
        { status: "released", attempt: { status } },
        false,
        true,
      ),
      [],
    );
  assert.deepEqual(settlementActions({ status: "disputed" }, false, false), []);
});
test("only finance can resolve or authorise a retry of a final failed payout", () => {
  assert.deepEqual(
    settlementActions(
      { status: "released", attempt: { status: "failed" } },
      true,
      false,
    ),
    ["retry"],
  );
  assert.deepEqual(
    settlementActions(
      { status: "released", attempt: { status: "unconfirmed" } },
      true,
      false,
    ),
    [],
  );
  assert.deepEqual(
    settlementActions(
      { status: "disputed", release_evidence_ready: true },
      true,
      false,
    ),
    ["resolve_resume", "resolve_release", "resolve_refund"],
  );
  assert.deepEqual(
    settlementActions(
      { status: "disputed", release_evidence_ready: false },
      true,
      false,
    ),
    ["resolve_resume", "resolve_refund"],
  );
  assert.deepEqual(
    settlementActions({ status: "refund_pending" }, true, false),
    [],
  );
});
