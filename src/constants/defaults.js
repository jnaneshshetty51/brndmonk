export const BUSINESS_DEFAULTS = {
  businessName: 'ASTRAVEDA',
  brandName: 'Brnd Monk',
  unit: 'Head Office',
  address: 'No. 5-457 A1, Jnanesh Building, Budnar Block, MGM Diana Road, Kunjibettu, Udupi, Karnataka – 576102',
  phone: '6361229218',
  email: 'jnaneshshetty08@gmail.com',
  udyamNumber: 'UDYAM-KR-26-0057710',
  businessType: 'Micro Enterprise (Services)',
  industry: 'Advertising, programming, consultancy, production',
  supplierState: 'Karnataka',
  currency: '₹',
  gstNumber: '',
  pan: '',
  logo: null,
  bankDetails: {
    accountName: 'ASTRAVEDA',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
  },
  upiId: '',
  razorpayLink: '',
  stripeLink: '',
  defaultPaymentTerms: '50% advance to start. Remaining 50% on project delivery.',
  defaultTerms: `1. Advance payment is non-refundable once work has commenced.
2. Project timeline is subject to timely client feedback and approvals.
3. Advertising/media budget is separate and not included in service fees.
4. Payment is due within the agreed terms. Late payments attract 2% monthly interest.
5. Brnd Monk retains the right to showcase project in portfolio unless restricted in writing.
6. All deliverables remain property of client upon full payment.`,
  thankYouNote: 'Thank you for choosing Brnd Monk. We look forward to delivering exceptional results for your business.',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Due on Receipt', value: 0 },
  { label: 'Net 7 Days', value: 7 },
  { label: 'Net 15 Days', value: 15 },
  { label: 'Net 30 Days', value: 30 },
  { label: 'Net 45 Days', value: 45 },
  { label: 'Net 60 Days', value: 60 },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

export const QUOTE_STATUSES = {
  draft: { label: 'Draft', color: '#94a3b8' },
  sent: { label: 'Sent', color: '#3b82f6' },
  won: { label: 'Won', color: '#10b981' },
  lost: { label: 'Lost', color: '#ef4444' },
};

export const INVOICE_STATUSES = {
  draft: { label: 'Draft', color: '#94a3b8' },
  sent: { label: 'Sent', color: '#3b82f6' },
  viewed: { label: 'Viewed', color: '#a855f7' },
  paid: { label: 'Paid', color: '#10b981' },
  partial: { label: 'Partial', color: '#f59e0b' },
  overdue: { label: 'Overdue', color: '#ef4444' },
};
