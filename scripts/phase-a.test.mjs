import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateQuote, money } from '../lib/business/finance.ts';
import { emptyQuotation, renderQuotation, renderLetter } from '../lib/business/documents.ts';
import { may, eligibleClaim, canReadIssuedQuote, assertQuoteTransition } from '../lib/business/policy.ts';
import { assertEmailReviewed, renderVariables } from '../lib/business/contracts.ts';

const line = (quantity, unitPrice) => ({ id: 'test', code: '', description: 'TEST ONLY', unit: 'pcs', quantity, unitPrice });
const input = (items, extra = {}) => ({ items, discount: '0', taxPercent: '0', charges: '0', ...extra });
const company = { name: 'TEST ONLY', address: '', phone: '', email: '', logo: '', documentFooter: '' };
test('decimal finance rounds half-up per line without floating point drift', () => {
  assert.equal(calculateQuote(input([line('3', '0.10')])).total, '0.30');
  assert.equal(calculateQuote(input([line('0.5', '0.01')])).total, '0.01');
  assert.equal(calculateQuote(input([line('1.2345', '100.00')])).total, '123.45');
});
test('fixed discount, net tax, and untaxed charges use the documented policy', () => {
  assert.deepEqual(calculateQuote(input([line('2', '100.25')], { discount: '10.50', taxPercent: '7.50', charges: '25' })), { subtotal: '200.50', discount: '10.50', tax: '14.25', charges: '25.00', total: '229.25' });
});
test('large amounts retain exact cents and thousands separators', () => {
  assert.equal(calculateQuote(input([line('1', '999999999999.99')])).total, '999999999999.99');
  assert.equal(money('999999999999.99'), '999,999,999,999.99');
});
test('invalid amounts, precision, quantity, rates, limits and discounts are rejected', () => {
  for (const p of ['-1', 'NaN', 'Infinity', '1e3', '1.001', '', ' 1', '1,000']) assert.throws(() => calculateQuote(input([line('1', p)])));
  for (const q of ['0', '-1', '1.00001', '999999999']) assert.throws(() => calculateQuote(input([line(q, '1')])));
  assert.throws(() => calculateQuote(input([line('1', '1')], { discount: '1.01' })));
  assert.throws(() => calculateQuote(input([line('1', '1')], { taxPercent: '100.01' })));
  assert.throws(() => calculateQuote(input([line('2', '999999999999.99')])));
  assert.throws(() => calculateQuote(input(Array.from({ length: 201 }, () => line('1', '1')))));
});
test('unauthenticated, customer, and insufficient staff scope fail closed', () => {
  assert.equal(may(null, 'quotes.issue'), false);
  assert.equal(may({ id: 'c', role: 'CUSTOMER', permissions: ['quotes.issue'] }, 'quotes.issue'), false);
  const staff = { id: 's', role: 'STAFF', permissions: ['quotes.edit'] };
  assert.throws(() => assertQuoteTransition('APPROVED', 'ISSUED', staff));
  assert.throws(() => assertQuoteTransition('DRAFT', 'APPROVED', { id: 'a', role: 'ADMIN', permissions: ['quotes.approve'] }));
  assert.doesNotThrow(() => assertQuoteTransition('PENDING_APPROVAL', 'APPROVED', { id: 'a', role: 'ADMIN', permissions: ['quotes.approve'] }));
});
test('customer visibility requires deliberate grant and officially issued status', () => {
  const customer = { id: 'c', role: 'CUSTOMER', permissions: [] };
  for (const status of ['DRAFT', 'PENDING_APPROVAL', 'APPROVED']) assert.equal(canReadIssuedQuote(customer, 'c', status), false);
  assert.equal(canReadIssuedQuote(customer, 'unrelated', 'ISSUED'), false);
  assert.equal(canReadIssuedQuote(customer, 'c', 'ISSUED'), true);
});
test('claims require verified identity and reference proof with no conflict', () => {
  const good = { verifiedContact: true, referenceProof: true, conflict: false, alreadyOwned: false, expired: false };
  assert.equal(eligibleClaim(good), true);
  for (const key of Object.keys(good)) assert.equal(eligibleClaim({ ...good, [key]: !good[key] }), false);
});
test('documents escape hostile text, reject arbitrary logo URLs, and retain snapshots', () => {
  const draft = { ...emptyQuotation(), client: '<script>alert(1)</script>', items: [line('1', '10')] };
  const snapshot = { ...company, name: 'Original company', logo: 'https://untrusted.example/internal' };
  const html = renderQuotation(draft, snapshot);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>') && !html.includes('https://untrusted'));
  snapshot.name = 'Updated company';
  assert.ok(html.includes('Original company') && !html.includes('Updated company'));
  assert.ok(html.includes('class="document-badge">DRAFT') && html.includes('Not issued'));
  assert.ok(!html.includes('Approval pending'));
  assert.ok(renderLetter({ recipient: '', designation: '', organization: '', address: '', subject: '<img>', body: 'বাংলা', date: '', sender: '', senderDesignation: '' }, company, 'bn').includes('&lt;img&gt;'));
});
test('templates and reviewed emails reject missing variables or stale reviews', () => {
  assert.equal(renderVariables('Hello {{client_name}}', { client_name: 'Test' }), 'Hello Test');
  assert.throws(() => renderVariables('{{company_name}}', {}));
  assert.throws(() => renderVariables('{{constructor}}', {}));
  assert.throws(() => renderVariables('{{Company_name}}', {}));
  assert.throws(() => renderVariables('{{client_name', { client_name: 'Test' }));
  const email = { id: 'e', revision: 2, approvedRevision: 1, approvedBy: 's', to: ['test@example.invalid'], cc: [], bcc: [], subject: 'Test', html: '', attachmentIds: [] };
  assert.throws(() => assertEmailReviewed(email));
  assert.doesNotThrow(() => assertEmailReviewed({ ...email, approvedRevision: 2 }));
});
test('long descriptions split into continued rows without repeating financial values', () => {
  const html = renderQuotation({ ...emptyQuotation(), items: [{ ...line('1', '19.95'), description: 'Long description '.repeat(100) }] }, company);
  assert.ok(html.includes('description continued'));
  assert.equal((html.match(/class="num">19\.95<\/td>/g) || []).length, 2);
  assert.throws(() => renderQuotation({ ...emptyQuotation(), date: '2026-02-30' }, company));
  assert.throws(() => renderQuotation({ ...emptyQuotation(), date: '2026-11-08', validUntil: '2026-11-07' }, company));
});
test('migration proposal preserves existing health table and contains financial/document safeguards', () => {
  const sql = readFileSync('prisma/proposals/phase-a.sql', 'utf8');
  assert.ok(!/\b(DROP|TRUNCATE)\b/i.test(sql));
  assert.ok(!/ALTER TABLE "DatabaseHealthCheck"/i.test(sql));
  for (const marker of ['quotation_financials_valid', 'quotation_version_frozen', 'quotation_items_frozen', 'one_verified_claim_per_request', 'ENABLE ROW LEVEL SECURITY', 'current_quote_belongs_to_quote']) assert.ok(sql.includes(marker));
});
