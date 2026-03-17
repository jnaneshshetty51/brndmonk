import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatDate } from './formatters';

export async function generateAndSharePDF(htmlContent, filename) {
  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${filename}`,
        UTI: 'com.adobe.pdf',
      });
    }
    return uri;
  } catch (error) {
    throw error;
  }
}

export function buildQuoteHTML(quoteData) {
  const { client, quoteNumber, date, salesperson, selectedServices, pricing, business } = quoteData;
  const biz = business || {};
  const p = pricing || {};
  const symbol = biz.currency || '₹';

  const serviceRows = (selectedServices || []).map((s) => `
    <tr>
      <td>${s.name}</td>
      <td>${s.description || ''}</td>
      <td>${s.priceType === 'monthly' ? `${s.selectedDuration || 1} month(s)` : s.selectedTier || '1 unit'}</td>
      <td style="text-align:right;font-weight:600;">${formatCurrency(s.totalPrice || s.price || 0, symbol)}</td>
    </tr>
  `).join('');

  const deliverablesList = (selectedServices || []).map((s) => {
    const delivs = Array.isArray(s.deliverables)
      ? s.deliverables.map((d) => `<li>${d}</li>`).join('')
      : '';
    return delivs ? `<div class="del-section"><strong>${s.name}</strong><ul>${delivs}</ul></div>` : '';
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1a1a2e; background:#fff; }

  /* COVER PAGE */
  .cover { background:linear-gradient(135deg,#0a0a0f 0%,#16161f 50%,#1e1e2e 100%); min-height:100vh; display:flex; flex-direction:column; justify-content:space-between; padding:60px; page-break-after:always; }
  .cover-logo { font-size:32px; font-weight:800; color:#fff; letter-spacing:-1px; }
  .cover-logo span { background:linear-gradient(135deg,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .cover-tag { color:#94a3b8; font-size:13px; margin-top:4px; letter-spacing:2px; text-transform:uppercase; }
  .cover-main { text-align:left; }
  .cover-label { color:#f59e0b; font-size:13px; letter-spacing:3px; text-transform:uppercase; margin-bottom:16px; }
  .cover-title { font-size:52px; font-weight:800; color:#fff; line-height:1.1; margin-bottom:24px; }
  .cover-title span { background:linear-gradient(135deg,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .cover-client { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:24px 32px; display:inline-block; margin-top:8px; }
  .cover-client-label { color:#94a3b8; font-size:11px; letter-spacing:2px; text-transform:uppercase; }
  .cover-client-name { color:#fff; font-size:22px; font-weight:700; margin-top:4px; }
  .cover-client-company { color:#94a3b8; font-size:14px; margin-top:2px; }
  .cover-footer { display:flex; justify-content:space-between; color:#475569; font-size:12px; }
  .cover-meta { display:flex; gap:32px; }
  .cover-meta-item label { display:block; color:#64748b; font-size:10px; letter-spacing:1px; text-transform:uppercase; }
  .cover-meta-item span { color:#94a3b8; font-size:13px; font-weight:500; }

  /* CONTENT PAGES */
  .page { padding:48px 56px; page-break-after:always; }
  .section { margin-bottom:40px; }
  .section-label { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#f59e0b; font-weight:600; margin-bottom:12px; }
  .section-title { font-size:26px; font-weight:800; color:#0f172a; margin-bottom:8px; }
  .section-body { font-size:14px; color:#475569; line-height:1.8; }

  /* ABOUT */
  .about-card { background:linear-gradient(135deg,#f8f4ff,#eff6ff); border-radius:16px; padding:32px; border-left:4px solid #f59e0b; }

  /* SERVICES TABLE */
  table { width:100%; border-collapse:collapse; margin-top:16px; }
  th { background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; padding:12px 16px; text-align:left; font-size:12px; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
  td { padding:14px 16px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#374151; }
  tr:hover td { background:#fafbff; }
  .amount-col { font-weight:700; color:#f59e0b; font-size:14px; }

  /* DELIVERABLES */
  .del-section { margin-bottom:20px; }
  .del-section strong { font-size:14px; color:#1e293b; display:block; margin-bottom:8px; }
  .del-section ul { margin-left:20px; }
  .del-section ul li { font-size:13px; color:#475569; margin-bottom:4px; }

  /* PRICING SUMMARY */
  .pricing-card { background:#0a0a0f; border-radius:16px; padding:32px; color:#fff; }
  .pricing-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:14px; }
  .pricing-row:last-child { border-bottom:none; padding-top:20px; }
  .pricing-row .label { color:#94a3b8; }
  .pricing-row .value { font-weight:600; color:#f8fafc; }
  .pricing-total { font-size:20px; font-weight:800; }
  .pricing-total .value { background:linear-gradient(135deg,#f59e0b,#d97706); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }

  /* TERMS */
  .terms { background:#f8fafc; border-radius:12px; padding:24px; }
  .terms ol { margin-left:20px; }
  .terms ol li { font-size:12px; color:#64748b; margin-bottom:6px; line-height:1.6; }

  /* SIGNATURE */
  .sig-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; margin-top:24px; }
  .sig-box { border-top:2px solid #e2e8f0; padding-top:12px; }
  .sig-box .name { font-weight:700; font-size:14px; color:#1e293b; }
  .sig-box .role { font-size:12px; color:#94a3b8; margin-top:2px; }
  .sig-line { height:48px; }

  /* HEADER BAR */
  .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; padding-bottom:20px; border-bottom:1px solid #f1f5f9; }
  .page-logo { font-size:18px; font-weight:800; color:#f59e0b; }
  .page-quote-ref { font-size:12px; color:#94a3b8; text-align:right; }

  .divider { height:1px; background:linear-gradient(to right,#f59e0b,#d97706,transparent); margin:32px 0; }
  .badge { display:inline-block; background:linear-gradient(135deg,#f59e0b22,#d9770622); border:1px solid #f59e0b44; color:#f59e0b; border-radius:999px; padding:4px 12px; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div>
    <div class="cover-logo">Brnd<span>Monk</span></div>
    <div class="cover-tag">Digital Growth Agency</div>
  </div>
  <div class="cover-main">
    <div class="cover-label">Digital Growth Proposal</div>
    <div class="cover-title">Built to<br/><span>Scale Your</span><br/>Business</div>
    <div class="cover-client">
      <div class="cover-client-label">Prepared for</div>
      <div class="cover-client-name">${client?.name || 'Valued Client'}</div>
      <div class="cover-client-company">${client?.company || ''}</div>
    </div>
  </div>
  <div class="cover-footer">
    <div class="cover-meta">
      <div class="cover-meta-item"><label>Quote Ref</label><span>${quoteNumber || 'BM-2026-0001'}</span></div>
      <div class="cover-meta-item"><label>Date</label><span>${formatDate(date) || formatDate(new Date())}</span></div>
      <div class="cover-meta-item"><label>Prepared by</label><span>${salesperson || 'Brnd Monk Team'}</span></div>
    </div>
    <div style="text-align:right">
      <div style="color:#475569">${biz.email || 'jnaneshshetty08@gmail.com'}</div>
      <div style="color:#475569">+91 ${biz.phone || '6361229218'}</div>
    </div>
  </div>
</div>

<!-- PAGE 2: ABOUT + SERVICES -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">BrndMonk</div>
    <div class="page-quote-ref">
      <div>${quoteNumber}</div>
      <div>${formatDate(date) || formatDate(new Date())}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">About Us</div>
    <div class="section-title">Who We Are</div>
    <div class="about-card">
      <div class="section-body">
        Brnd Monk is a full-service digital marketing and technology agency operating under ASTRAVEDA. We partner with ambitious businesses to build powerful digital ecosystems — from stunning websites and mobile apps to performance marketing and intelligent automation. Our strategic, ROI-focused approach has helped businesses across India scale faster and smarter.
      </div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-label">Scope of Work</div>
    <div class="section-title">Selected Services</div>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Description</th>
          <th>Duration / Qty</th>
          <th style="text-align:right">Price</th>
        </tr>
      </thead>
      <tbody>${serviceRows}</tbody>
    </table>
  </div>
</div>

<!-- PAGE 3: DELIVERABLES + TIMELINE -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">BrndMonk</div>
    <div class="page-quote-ref"><div>${quoteNumber}</div></div>
  </div>

  <div class="section">
    <div class="section-label">What You Get</div>
    <div class="section-title">Deliverables</div>
    ${deliverablesList || '<div class="section-body">Custom deliverables as discussed.</div>'}
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-label">Project Timeline</div>
    <div class="section-title">Expected Milestones</div>
    <div class="section-body">
      <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;"><div style="background:#f59e0b;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">1</div><div><strong>Week 1–2:</strong> Strategy, onboarding & initial setup</div></div>
      <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;"><div style="background:#d97706;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">2</div><div><strong>Week 3–4:</strong> Core development / campaign launch</div></div>
      <div style="margin-bottom:12px;display:flex;align-items:center;gap:12px;"><div style="background:#10b981;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">3</div><div><strong>Month 2:</strong> Review, optimize & scale</div></div>
      <div style="display:flex;align-items:center;gap:12px;"><div style="background:#f59e0b;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">4</div><div><strong>Ongoing:</strong> Monthly reporting & continuous improvement</div></div>
    </div>
  </div>
</div>

<!-- PAGE 4: PRICING + TERMS + SIGNATURE -->
<div class="page">
  <div class="page-header">
    <div class="page-logo">BrndMonk</div>
    <div class="page-quote-ref"><div>${quoteNumber}</div></div>
  </div>

  <div class="section">
    <div class="section-label">Investment Summary</div>
    <div class="section-title">Pricing Breakdown</div>
    <div class="pricing-card">
      <div class="pricing-row"><span class="label">Subtotal</span><span class="value">${formatCurrency(p.subtotal, symbol)}</span></div>
      ${p.discountAmount > 0 ? `<div class="pricing-row"><span class="label">Discount</span><span class="value" style="color:#10b981;">- ${formatCurrency(p.discountAmount, symbol)}</span></div>` : ''}
      ${p.otherCharges > 0 ? `<div class="pricing-row"><span class="label">Additional Charges</span><span class="value">${formatCurrency(p.otherCharges, symbol)}</span></div>` : ''}
      ${p.igst > 0 ? `<div class="pricing-row"><span class="label">IGST (18%)</span><span class="value">${formatCurrency(p.igst, symbol)}</span></div>` : ''}
      ${p.cgst > 0 ? `<div class="pricing-row"><span class="label">CGST (9%)</span><span class="value">${formatCurrency(p.cgst, symbol)}</span></div>` : ''}
      ${p.sgst > 0 ? `<div class="pricing-row"><span class="label">SGST (9%)</span><span class="value">${formatCurrency(p.sgst, symbol)}</span></div>` : ''}
      <div class="pricing-row"><span class="label pricing-total">Grand Total</span><span class="value pricing-total">${formatCurrency(p.grandTotal, symbol)}</span></div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-label">Legal</div>
    <div class="section-title">Terms & Conditions</div>
    <div class="terms">
      <ol>
        <li>Advance payment is non-refundable once work has commenced.</li>
        <li>Project timeline is subject to timely client feedback and approvals.</li>
        <li>Advertising/media budget is separate and not included in service fees.</li>
        <li>Payment is due within agreed terms. Late payments attract 2% monthly interest.</li>
        <li>Brnd Monk retains the right to showcase the project in portfolio unless restricted in writing.</li>
        <li>All deliverables remain property of client upon full payment.</li>
        <li>Quote is valid for 30 days from the date of issue.</li>
      </ol>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Authorization</div>
    <div class="section-title">Signatures</div>
    <div class="sig-grid">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="name">${salesperson || 'Jnanesh Shetty'}</div>
        <div class="role">Authorized Signatory — Brnd Monk</div>
        <div class="role" style="margin-top:4px;">${biz.email || 'jnaneshshetty08@gmail.com'}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="name">${client?.name || '_____________________'}</div>
        <div class="role">Client Signature — ${client?.company || ''}</div>
        <div class="role" style="margin-top:4px;">Date: _______________</div>
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #f1f5f9;">
    <div style="font-size:14px;color:#f59e0b;font-weight:600;margin-bottom:4px;">Thank you for choosing Brnd Monk</div>
    <div style="font-size:12px;color:#94a3b8;">Let's build something extraordinary together</div>
    <div style="font-size:11px;color:#cbd5e1;margin-top:8px;">ASTRAVEDA | Udyam: UDYAM-KR-26-0057710 | Udupi, Karnataka</div>
  </div>
</div>

</body>
</html>`;
}

export function buildInvoiceHTML(invoiceData) {
  const { header, client, lineItems, pricing, payment, business, status } = invoiceData;
  const biz = business || {};
  const p = pricing || {};
  const symbol = (biz.currency || '₹');

  const itemRows = (lineItems || []).map((item, i) => {
    const amount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const discAmt = item.itemDiscount ? (amount * parseFloat(item.itemDiscount)) / 100 : 0;
    const net = amount - discAmt;
    return `
      <tr>
        <td>${i + 1}</td>
        <td>
          <strong>${item.name || ''}</strong>
          ${item.description ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">${item.description}</div>` : ''}
          ${item.sacCode ? `<div style="font-size:10px;color:#94a3b8;">SAC: ${item.sacCode}</div>` : ''}
        </td>
        <td style="text-align:center;">${item.qty || 1} ${item.unit || ''}</td>
        <td style="text-align:right;">${formatCurrency(item.rate || 0, symbol)}</td>
        ${item.itemDiscount ? `<td style="text-align:center;">${item.itemDiscount}%</td>` : '<td style="text-align:center;">—</td>'}
        <td style="text-align:right;font-weight:700;">${formatCurrency(net, symbol)}</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; color:#1a1a2e; background:#fff; padding:48px 56px; }

  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; }
  .logo { font-size:28px; font-weight:800; color:#f59e0b; }
  .logo-sub { font-size:11px; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; margin-top:2px; }
  .inv-title { text-align:right; }
  .inv-title h1 { font-size:36px; font-weight:800; color:#0f172a; letter-spacing:-1px; }
  .inv-title .inv-num { font-size:14px; color:#f59e0b; font-weight:600; margin-top:4px; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-top:6px; }
  .status-paid { background:#d1fae5; color:#065f46; }
  .status-sent { background:#dbeafe; color:#1e40af; }
  .status-overdue { background:#fee2e2; color:#991b1b; }
  .status-draft { background:#f1f5f9; color:#475569; }

  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin-bottom:36px; }
  .meta-box { background:#f8fafc; border-radius:12px; padding:20px 24px; }
  .meta-box h3 { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#f59e0b; font-weight:700; margin-bottom:12px; }
  .meta-box p { font-size:13px; color:#374151; line-height:1.7; }
  .meta-box strong { color:#0f172a; }

  .inv-details { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:36px; }
  .inv-detail-item { background:#f8fafc; border-radius:8px; padding:12px 16px; }
  .inv-detail-item label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px; }
  .inv-detail-item span { font-size:13px; font-weight:600; color:#1e293b; }

  table { width:100%; border-collapse:collapse; margin-bottom:32px; }
  thead tr { background:linear-gradient(135deg,#f59e0b,#d97706); }
  th { color:#fff; padding:12px 14px; font-size:11px; font-weight:600; letter-spacing:1px; text-transform:uppercase; text-align:left; }
  td { padding:12px 14px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#374151; vertical-align:top; }
  tr:last-child td { border-bottom:none; }

  .totals { display:flex; justify-content:flex-end; margin-bottom:36px; }
  .totals-box { width:320px; }
  .total-row { display:flex; justify-content:space-between; padding:8px 0; font-size:13px; border-bottom:1px solid #f1f5f9; }
  .total-row:last-child { border-bottom:none; padding-top:14px; font-size:18px; font-weight:800; color:#f59e0b; }
  .total-row .label { color:#64748b; }
  .total-row .val { font-weight:600; }

  .payment-section { background:#0a0a0f; border-radius:16px; padding:28px 32px; margin-bottom:32px; display:grid; grid-template-columns:1fr 1fr; gap:32px; }
  .payment-section h3 { color:#f59e0b; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; font-weight:700; }
  .payment-section p { font-size:13px; color:#94a3b8; line-height:1.8; }
  .payment-section strong { color:#f8fafc; }

  .footer { text-align:center; padding-top:24px; border-top:1px solid #f1f5f9; }
  .footer-msg { font-size:14px; font-weight:600; color:#f59e0b; margin-bottom:4px; }
  .footer-sub { font-size:12px; color:#94a3b8; }
  .footer-legal { font-size:11px; color:#cbd5e1; margin-top:8px; }

  .notes { background:#fffbeb; border-left:4px solid #f59e0b; border-radius:8px; padding:16px 20px; margin-bottom:24px; }
  .notes h3 { font-size:11px; color:#92400e; letter-spacing:1px; text-transform:uppercase; font-weight:700; margin-bottom:6px; }
  .notes p { font-size:13px; color:#78350f; line-height:1.6; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">BrndMonk</div>
    <div class="logo-sub">${biz.businessName || 'ASTRAVEDA'}</div>
    <div style="font-size:12px;color:#94a3b8;margin-top:8px;line-height:1.6;">
      ${biz.address || 'Kunjibettu, Udupi, Karnataka – 576102'}<br/>
      +91 ${biz.phone || '6361229218'} | ${biz.email || 'jnaneshshetty08@gmail.com'}<br/>
      ${biz.gstNumber ? `GST: ${biz.gstNumber}` : 'Udyam: UDYAM-KR-26-0057710'}
    </div>
  </div>
  <div class="inv-title">
    <h1>INVOICE</h1>
    <div class="inv-num">${header?.invoiceNumber || 'INV-2026-0001'}</div>
    <div class="status-badge status-${status || 'draft'}">${(status || 'Draft').toUpperCase()}</div>
  </div>
</div>

<div class="inv-details">
  <div class="inv-detail-item"><label>Invoice Date</label><span>${formatDate(header?.date) || formatDate(new Date())}</span></div>
  <div class="inv-detail-item"><label>Due Date</label><span>${formatDate(header?.dueDate) || 'On Receipt'}</span></div>
  <div class="inv-detail-item"><label>Payment Terms</label><span>${header?.paymentTermsLabel || 'Net 30 Days'}</span></div>
  <div class="inv-detail-item"><label>Place of Supply</label><span>${header?.placeOfSupply || biz.supplierState || 'Karnataka'}</span></div>
</div>

<div class="meta-grid">
  <div class="meta-box">
    <h3>Bill From</h3>
    <p>
      <strong>${biz.brandName || 'Brnd Monk'}</strong><br/>
      ${biz.businessName || 'ASTRAVEDA'}<br/>
      ${biz.address || 'Kunjibettu, Udupi, Karnataka'}<br/>
      ${biz.gstNumber ? `GST: ${biz.gstNumber}` : ''}
    </p>
  </div>
  <div class="meta-box">
    <h3>Bill To</h3>
    <p>
      <strong>${client?.name || ''}</strong><br/>
      ${client?.company || ''}<br/>
      ${client?.address || ''}${client?.city ? `, ${client.city}` : ''}${client?.state ? `, ${client.state}` : ''} ${client?.pincode || ''}<br/>
      ${client?.gstNumber ? `GST: ${client.gstNumber}` : ''}${client?.pan ? `&nbsp;| PAN: ${client.pan}` : ''}
    </p>
  </div>
</div>

${header?.projectName || header?.poNumber || header?.salesperson ? `
<div style="display:flex;gap:16px;margin-bottom:24px;">
  ${header?.projectName ? `<div style="background:#f0f4ff;border-radius:8px;padding:10px 16px;font-size:12px;"><span style="color:#94a3b8;text-transform:uppercase;font-size:10px;letter-spacing:1px;display:block;">Project</span><strong>${header.projectName}</strong></div>` : ''}
  ${header?.poNumber ? `<div style="background:#f0f4ff;border-radius:8px;padding:10px 16px;font-size:12px;"><span style="color:#94a3b8;text-transform:uppercase;font-size:10px;letter-spacing:1px;display:block;">PO Number</span><strong>${header.poNumber}</strong></div>` : ''}
  ${header?.salesperson ? `<div style="background:#f0f4ff;border-radius:8px;padding:10px 16px;font-size:12px;"><span style="color:#94a3b8;text-transform:uppercase;font-size:10px;letter-spacing:1px;display:block;">Sales Rep</span><strong>${header.salesperson}</strong></div>` : ''}
</div>` : ''}

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Service / Description</th>
      <th style="text-align:center;">Qty</th>
      <th style="text-align:right;">Rate</th>
      <th style="text-align:center;">Disc %</th>
      <th style="text-align:right;">Amount</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals">
  <div class="totals-box">
    <div class="total-row"><span class="label">Subtotal</span><span class="val">${formatCurrency(p.subtotal, symbol)}</span></div>
    ${p.discountAmount > 0 ? `<div class="total-row"><span class="label">Discount</span><span class="val" style="color:#10b981;">- ${formatCurrency(p.discountAmount, symbol)}</span></div>` : ''}
    ${p.otherCharges > 0 ? `<div class="total-row"><span class="label">Other Charges</span><span class="val">${formatCurrency(p.otherCharges, symbol)}</span></div>` : ''}
    ${p.cgst > 0 ? `<div class="total-row"><span class="label">CGST (9%)</span><span class="val">${formatCurrency(p.cgst, symbol)}</span></div>` : ''}
    ${p.sgst > 0 ? `<div class="total-row"><span class="label">SGST (9%)</span><span class="val">${formatCurrency(p.sgst, symbol)}</span></div>` : ''}
    ${p.igst > 0 ? `<div class="total-row"><span class="label">IGST (18%)</span><span class="val">${formatCurrency(p.igst, symbol)}</span></div>` : ''}
    ${p.tdsAmount > 0 ? `<div class="total-row"><span class="label">TDS Deduction</span><span class="val" style="color:#ef4444;">- ${formatCurrency(p.tdsAmount, symbol)}</span></div>` : ''}
    <div class="total-row"><span class="label">Grand Total</span><span class="val">${formatCurrency(p.grandTotal, symbol)}</span></div>
  </div>
</div>

${payment ? `
<div class="payment-section">
  <div>
    <h3>Bank Details</h3>
    <p>
      <strong>Account Name:</strong> ${payment.accountName || biz.businessName || 'ASTRAVEDA'}<br/>
      <strong>Account No:</strong> ${payment.accountNumber || '—'}<br/>
      <strong>IFSC:</strong> ${payment.ifsc || '—'}<br/>
      <strong>Bank:</strong> ${payment.bankName || '—'}, ${payment.branch || '—'}
    </p>
  </div>
  <div>
    <h3>UPI & Payment</h3>
    <p>
      ${payment.upiId ? `<strong>UPI ID:</strong> ${payment.upiId}<br/>` : ''}
      ${payment.paymentTerms ? `<br/>${payment.paymentTerms}` : ''}
    </p>
  </div>
</div>` : ''}

${payment?.termsText ? `
<div class="notes">
  <h3>Terms & Conditions</h3>
  <p>${payment.termsText}</p>
</div>` : ''}

<div class="footer">
  <div class="footer-msg">Thank you for choosing Brnd Monk</div>
  <div class="footer-sub">We value your business and look forward to serving you</div>
  <div class="footer-legal">ASTRAVEDA | Udyam: UDYAM-KR-26-0057710 | Udupi, Karnataka – 576102</div>
</div>

</body>
</html>`;
}
