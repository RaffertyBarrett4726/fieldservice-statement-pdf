import assert from "node:assert/strict";
import { StatementRequest } from "../src/statement_export.js";

const parsed = StatementRequest.safeParse({ accountId: "A-1", period: "2026-09", workOrders: [{ id: "WO-1", site: "Depot", status: "dispatched", technician: "Lee", photos: [], followUp: "Call customer" }] });
assert.equal(parsed.success, true);
assert.equal(parsed.success && parsed.data.workOrders[0].status, "dispatched");
assert.equal(StatementRequest.safeParse({ accountId: "A-1", period: "September", workOrders: [] }).success, false);
console.log("statement boundary test passed");
