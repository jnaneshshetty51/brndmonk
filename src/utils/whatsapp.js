import { Linking } from 'react-native';
import { formatCurrency } from './formatters';

export async function shareViaWhatsApp(phone, message) {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encoded}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL(`https://wa.me/?text=${encoded}`);
  }
}

export function buildQuoteWhatsAppMessage(quoteData) {
  const { client, quoteNumber, selectedServices, pricing, business } = quoteData;
  const total = formatCurrency(pricing?.grandTotal || 0);

  const serviceList = (selectedServices || [])
    .map((s) => `  • ${s.name} — ${formatCurrency(s.totalPrice || s.price || 0)}`)
    .join('\n');

  return `*Digital Growth Proposal — Brnd Monk*
━━━━━━━━━━━━━━━━━━

📋 *Quote #:* ${quoteNumber || 'BM-2026-0001'}
👤 *Client:* ${client?.name || ''}${client?.company ? ` (${client.company})` : ''}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

*Selected Services:*
${serviceList}

━━━━━━━━━━━━━━━━━━
💰 *Grand Total: ${total}*
━━━━━━━━━━━━━━━━━━

Ready to grow your business? Let's get started! 🚀

_Brnd Monk — Brndmonk.com_
📞 6361229218`;
}

export function buildInvoiceWhatsAppMessage(invoiceData) {
  const { client, invoiceNumber, lineItems, pricing } = invoiceData;
  const total = formatCurrency(pricing?.grandTotal || 0);

  return `*Invoice from Brnd Monk*
━━━━━━━━━━━━━━━━━━

🧾 *Invoice #:* ${invoiceNumber || 'INV-2026-0001'}
👤 *To:* ${client?.name || ''}${client?.company ? ` (${client.company})` : ''}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}
📅 *Due:* ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('en-IN') : 'On Receipt'}

━━━━━━━━━━━━━━━━━━
💰 *Amount Due: ${total}*
━━━━━━━━━━━━━━━━━━

Please make payment at your earliest convenience.

_ASTRAVEDA | Brnd Monk_
📞 6361229218
📧 jnaneshshetty08@gmail.com`;
}
