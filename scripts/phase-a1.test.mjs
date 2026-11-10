import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createDemoDataset,
  demoSaleDraft,
  daysBefore,
  demoToday,
} from "../lib/business/demo-fixtures.ts";
import {
  quotationToMemo,
  emptyMemo,
  paymentSummary,
  validateMemo,
  aggregateSales,
} from "../lib/business/sales.ts";
import { calculateQuote, amount, decimal } from "../lib/business/finance.ts";
import {
  renderQuotation,
  renderSalesDocument,
  renderLetter,
  dateText,
} from "../lib/business/documents.ts";
import {
  initialDemoRoles,
  assertRoleChange,
} from "../lib/business/role-matrix.ts";
import {
  demoSeedPlan,
  seedApprovedDemoTarget,
} from "../lib/business/demo-seed.ts";
const data = createDemoDataset(),
  company = {
    name: "TEST COMPANY",
    address: "TEST ADDRESS",
    phone: "DEMO",
    email: "test@example.com",
    logo: "/branding/aia-logo-light.webp",
    documentFooter: "",
  };
const posted = (value, id = "DEMO-PAY-TEST") => ({
  id,
  amount: value,
  method: "CASH",
  state: "POSTED",
  date: demoToday,
  reference: "DEMO",
  demo: true,
});
test("conversion copies approved financial and customer details without modifying its source", () => {
  const source = structuredClone(data.quotations[0]),
    before = JSON.stringify(source),
    memo = quotationToMemo(source);
  assert.equal(memo.sourceQuotation, source.id);
  assert.equal(memo.client, source.draft.client);
  assert.equal(calculateQuote(memo).total, calculateQuote(source.draft).total);
  assert.deepEqual(memo.payments, []);
  assert.equal(memo.kind, "MEMO");
  memo.items[0].unitPrice = "1";
  memo.client = "Changed";
  assert.equal(JSON.stringify(source), before);
  assert.notEqual(memo.items[0].id, source.draft.items[0].id);
});
test("draft and unrecognized source statuses cannot acquire approval through conversion", () => {
  for (const status of ["DRAFT", "PENDING_APPROVAL", "REJECTED"])
    assert.throws(() => quotationToMemo({ ...data.quotations[0], status }));
});
test("custom memos require no quotation and calculate exact partial payments", () => {
  const memo = {
    ...emptyMemo(),
    client: "External demo client",
    date: demoToday,
    items: [
      {
        id: "1",
        description: "Test",
        code: "",
        unit: "pcs",
        quantity: "2",
        unitPrice: "100.25",
      },
    ],
    discount: "10.50",
    taxPercent: "7.50",
    charges: "25",
    payments: [posted("100.01")],
  };
  assert.equal(memo.sourceQuotation, null);
  assert.deepEqual(validateMemo(memo), {
    subtotal: "200.50",
    discount: "10.50",
    tax: "14.25",
    charges: "25.00",
    total: "229.25",
    paid: "100.01",
    balance: "129.24",
    status: "PARTIAL",
  });
});
test("zero, negative, duplicate, excessive and malformed payments are rejected", () => {
  for (const value of ["0", "-1", "1.001", "NaN", "1e2", "101"])
    assert.throws(() => paymentSummary("100", [posted(value)]));
  assert.throws(() => paymentSummary("100", [posted("10"), posted("10")]));
  assert.deepEqual(
    paymentSummary("100", [{ ...posted("20"), state: "VOIDED" }]),
    { paid: "0.00", balance: "100.00", status: "UNPAID" },
  );
  assert.equal(paymentSummary("100", [posted("100")]).status, "PAID");
});
test("sale reports exclude voids and quotation offers, and reject shared payment identifiers", () => {
  const start = daysBefore(29),
    expected = data.sales.filter(
      (s) => s.status === "COMMITTED" && s.date >= start,
    );
  const stats = aggregateSales(data.sales, start, demoToday);
  assert.equal(stats.count, expected.length);
  assert.equal(
    stats.total,
    decimal(
      expected.reduce((sum, s) => sum + amount(calculateQuote(s).total), 0n),
    ),
  );
  const withPayment = data.sales.find((s) => s.payments.length);
  assert.throws(() =>
    aggregateSales(
      [withPayment, { ...withPayment, id: "OTHER" }],
      daysBefore(90),
      demoToday,
    ),
  );
  assert.equal(aggregateSales([], start, demoToday).total, "0.00");
});
test("demo fixtures are reproducible, isolated objects with synthetic contacts and separate documents", () => {
  assert.deepEqual(createDemoDataset(), createDemoDataset());
  const copy = createDemoDataset();
  copy.products[0].stock = 999;
  assert.notEqual(data.products[0].stock, 999);
  assert(
    data.customers.every(
      (c) =>
        c.demo &&
        c.email.endsWith("@example.com") &&
        c.phone.startsWith("DEMO-"),
    ),
  );
  assert(
    data.requests.every((r) => r.latitude === null && r.longitude === null),
  );
  assert(
    data.commercialDocuments.every(
      (d) =>
        d.id.startsWith("DEMO-") && data.sales.some((s) => s.id === d.saleId),
    ),
  );
  assert.equal(demoSeedPlan().scope, "AIA_PHASE_A1_DEMO_V1");
});
test("demo seed requires explicit approval of the matching isolated Dev/Test target", async () => {
  let writes = 0;
  const target = {
    id: "isolated-test",
    environment: "TEST",
    isolatedDemoDatabase: true,
    reviewedSchemaReady: true,
  };
  const adapter = {
    inspectTarget: async () => target,
    transaction: async (fn) =>
      fn({
        upsertDemoDataset: async () => {
          writes++;
        },
      }),
  };
  for (const change of [
    { environment: "PRODUCTION" },
    { environment: "STAGING" },
    { isolatedDemoDatabase: false },
    { reviewedSchemaReady: false },
    { id: "other" },
  ]) {
    const original = { ...target };
    Object.assign(target, change);
    await assert.rejects(() =>
      seedApprovedDemoTarget(adapter, {
        explicitSeedApproval: true,
        approvedTargetId: "isolated-test",
      }),
    );
    Object.assign(target, original);
  }
  await assert.rejects(() =>
    seedApprovedDemoTarget(adapter, {
      explicitSeedApproval: false,
      approvedTargetId: "isolated-test",
    }),
  );
  assert.equal(writes, 0);
  await seedApprovedDemoTarget(adapter, {
    explicitSeedApproval: true,
    approvedTargetId: "isolated-test",
  });
  assert.equal(writes, 1);
});
test("Root Admin matrix denies non-root changes, root elevation and unknown scopes", () => {
  const roles = initialDemoRoles(),
    [root, admin, staff] = roles;
  assert.throws(() => assertRoleChange(null, staff, staff));
  assert.throws(() => assertRoleChange(admin, staff, staff));
  assert.throws(() => assertRoleChange(root, root, root));
  assert.throws(() =>
    assertRoleChange(root, staff, { ...staff, kind: "SUPER_ADMIN" }),
  );
  assert.throws(() =>
    assertRoleChange(root, staff, { ...staff, scopes: ["system.anything"] }),
  );
  assert.doesNotThrow(() =>
    assertRoleChange(root, staff, {
      ...staff,
      scopes: [...staff.scopes, "documents.create"],
    }),
  );
  assert(!admin.scopes.includes("roles.manage"));
  assert(!staff.scopes.includes("company.edit"));
});
test("issued-layout specimens have one DEMO badge, a number, white paper and no draft clutter", () => {
  const html = renderQuotation(data.quotations[0].draft, company, "en", "", {
    mode: "demo-issued",
    number: "DEMO-QUO-2026-001",
  });
  assert(html.includes("background:#fff!important"));
  assert.equal((html.match(/class="document-badge">DEMO/g) || []).length, 1);
  assert(!html.includes("DRAFT"));
  assert(!html.includes("Approval Pending"));
  assert(html.includes("DEMO-QUO-2026-001"));
  assert.throws(() =>
    renderQuotation(data.quotations[0].draft, company, "en", "", {
      mode: "demo-issued",
      number: "QUO-REAL-1",
    }),
  );
});
test("receipts require a payment and challans contain quantities without pricing", () => {
  const memo = quotationToMemo(data.quotations[0]);
  assert.throws(() =>
    renderSalesDocument({ ...memo, kind: "RECEIPT" }, company),
  );
  const receipt = renderSalesDocument(
    { ...memo, kind: "RECEIPT", payments: [posted("500")] },
    company,
  );
  assert(receipt.includes("500.00"));
  assert(receipt.includes("Amount received"));
  assert(!receipt.includes("Grand total"));
  const challan = renderSalesDocument({ ...memo, kind: "CHALLAN" }, company);
  assert(challan.includes("Delivery challan"));
  assert(!challan.includes("Unit price"));
  assert(!challan.includes("Grand total"));
});
test("sales and Bengali correspondence escape hostile text and retain independent snapshots", () => {
  const memo = demoSaleDraft(data.sales[3]);
  memo.client = "<script>alert(1)</script>";
  const html = renderSalesDocument(memo, company, "bn", "", {
    mode: "demo-issued",
    number: "DEMO-MEM-2026-001",
  });
  assert(html.includes('lang="bn"'));
  assert(!html.includes("<script>"));
  assert(html.includes("&lt;script&gt;"));
  const letter = renderLetter(
    {
      recipient: "Demo",
      designation: "",
      organization: "",
      address: "",
      subject: "বাংলা পরীক্ষা",
      body: "যুক্তাক্ষর ও পৃষ্ঠার পরীক্ষা।",
      date: demoToday,
      sender: "Demo",
      senderDesignation: "",
    },
    company,
    "bn",
    "",
    { mode: "demo-issued", number: "DEMO-LTR-2026-001" },
  );
  assert(letter.includes("যুক্তাক্ষর"));
  assert(!letter.includes("DRAFT"));
});
test("invalid calendar dates and reversed quotation validity block rendering", () => {
  for (const date of ["2026-02-30", "2026-13-01", "bad"])
    assert.throws(() => dateText(date, "en"));
  assert.throws(() =>
    renderQuotation(
      { ...data.quotations[0].draft, validUntil: "2026-01-01" },
      company,
    ),
  );
});
test("schema extension remains a review proposal with independent financial records and no health-table changes", () => {
  const sql = readFileSync("prisma/proposals/phase-a1-extension.sql", "utf8");
  for (const name of [
    "Sale",
    "SaleItem",
    "PaymentRecord",
    "PaymentAllocation",
    "RefundRecord",
    "DeliveryRecord",
    "StockMovement",
    "CommercialDocument",
  ])
    assert(sql.includes(`CREATE TABLE "${name}"`));
  assert(!/\b(DROP|TRUNCATE)\b/i.test(sql));
  assert(!/ALTER TABLE "DatabaseHealthCheck"/.test(sql));
  assert(sql.includes("ENABLE ROW LEVEL SECURITY"));
  assert(sql.includes("idempotencyKey"));
  assert.equal(
    (readFileSync("prisma/proposals/phase-b-from.prisma", "utf8").match(/^model /gm) || [])
      .length,
    1,
  );
});
