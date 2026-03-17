/**
 * Calculate totals for a quote based on selected services
 */
export function calculateQuoteTotal(selectedServices) {
  let total = 0;
  selectedServices.forEach((s) => {
    const price = parseFloat(s.totalPrice || s.price || 0);
    total += price;
  });
  return total;
}

/**
 * Apply discount and GST to get final breakdown
 * @param {number} subtotal
 * @param {string} discountType - 'percent' | 'flat'
 * @param {number} discountValue
 * @param {string} gstType - 'igst' | 'cgst_sgst' | 'none'
 * @param {number} otherCharges
 * @param {number} tdsPercent
 */
export function calculatePricing({
  subtotal = 0,
  discountType = 'percent',
  discountValue = 0,
  gstType = 'none',
  otherCharges = 0,
  tdsPercent = 0,
}) {
  const sub = parseFloat(subtotal) || 0;
  const disc = parseFloat(discountValue) || 0;
  const other = parseFloat(otherCharges) || 0;

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (sub * disc) / 100;
  } else {
    discountAmount = Math.min(disc, sub);
  }

  const taxableAmount = sub - discountAmount + other;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (gstType === 'igst') {
    igst = taxableAmount * 0.18;
  } else if (gstType === 'cgst_sgst') {
    cgst = taxableAmount * 0.09;
    sgst = taxableAmount * 0.09;
  }

  const totalTax = igst + cgst + sgst;
  const tdsAmount = (taxableAmount * (parseFloat(tdsPercent) || 0)) / 100;
  const grandTotal = taxableAmount + totalTax - tdsAmount;

  return {
    subtotal: sub,
    discountAmount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    otherCharges: other,
    tdsAmount,
    grandTotal,
  };
}

/**
 * Suggest GST type based on client state vs supplier state
 */
export function suggestGSTType(clientState, supplierState = 'Karnataka') {
  if (!clientState) return 'none';
  if (clientState.toLowerCase() === supplierState.toLowerCase()) {
    return 'cgst_sgst';
  }
  return 'igst';
}

/**
 * Calculate service price including duration
 */
export function getServiceTotal(service) {
  if (service.priceType === 'monthly') {
    const months = service.selectedDuration || 1;
    return (parseFloat(service.price) || 0) * months;
  }
  if (service.priceType === 'hybrid') {
    const months = service.selectedDuration || 1;
    return (parseFloat(service.setupCost) || 0) + (parseFloat(service.monthlyCost) || 0) * months;
  }
  if (service.priceType === 'tier') {
    return parseFloat(service.tierPrice) || 0;
  }
  return parseFloat(service.price) || 0;
}

/**
 * Detect smart package suggestion based on selected service IDs
 */
export function detectPackageSuggestion(selectedIds) {
  const ids = selectedIds.map((id) => id.toLowerCase());
  const hasWeb = ids.some((id) => id.startsWith('web_'));
  const hasMarketing = ids.some((id) => id.startsWith('dm_'));
  const hasApp = ids.some((id) => id.startsWith('app_'));
  const hasAuto = ids.some((id) => id.startsWith('auto_'));

  if (hasApp && hasAuto) {
    return {
      name: 'Startup Tech Package',
      description: 'You\'ve selected App + Automation — combine them for a complete tech startup solution!',
      color: ['#10b981', '#3b82f6'],
    };
  }
  if (hasWeb && hasMarketing) {
    return {
      name: 'Growth Package',
      description: 'Website + Marketing — the perfect combo to attract and convert clients.',
      color: ['#7c3aed', '#3b82f6'],
    };
  }
  if (hasMarketing && hasAuto) {
    return {
      name: 'Lead Machine Package',
      description: 'Marketing + Automation = automated lead generation powerhouse!',
      color: ['#f59e0b', '#ef4444'],
    };
  }
  return null;
}

/**
 * Get upsell suggestions based on what's NOT selected
 */
export function getUpsellSuggestions(selectedIds) {
  const suggestions = [];
  if (!selectedIds.some((id) => id.startsWith('dm_seo'))) {
    suggestions.push({ id: 'dm_seo', label: '+ SEO', subtext: 'Rank on Google' });
  }
  if (!selectedIds.some((id) => id.startsWith('dm_ads'))) {
    suggestions.push({ id: 'dm_ads', label: '+ Performance Ads', subtext: 'Instant traffic' });
  }
  if (!selectedIds.some((id) => id.startsWith('auto_'))) {
    suggestions.push({ id: 'auto_chatbot', label: '+ AI Chatbot', subtext: '24/7 leads' });
  }
  if (!selectedIds.some((id) => id.startsWith('web_maintenance') || id.startsWith('app_maintenance'))) {
    suggestions.push({ id: 'web_maintenance', label: '+ Maintenance', subtext: 'Stay live & secure' });
  }
  return suggestions.slice(0, 3);
}
