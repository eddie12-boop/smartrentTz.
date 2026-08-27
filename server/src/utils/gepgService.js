/**
 * GePG (Government e-Payment Gateway) & Tanzanian Institutional Real Estate Services
 * Provides Control Number generation, digital receipt creation, and NIDA verification helpers.
 */

// Generate a valid 12-digit Tanzanian GePG Control Number
// Standard format usually starts with 99 (e.g., 994200183921)
function generateControlNumber() {
  const prefix = '99';
  let middleAndSuffix = '';
  for (let i = 0; i < 10; i++) {
    middleAndSuffix += Math.floor(Math.random() * 10).toString();
  }
  return `${prefix}${middleAndSuffix}`;
}

// Generate unique digital receipt number (e.g. REC-2026-98214)
function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `REC-${year}-${randomSuffix}`;
}

// Validate and format 20-digit NIDA (National Identification Number)
// NIDA NIN format: 20 continuous digits, e.g., 19940825123450000123
function validateNidaFormat(nidaNumber) {
  if (!nidaNumber) return { isValid: false, message: 'Namba ya NIDA inahitajika.' };
  
  // Clean dashes or spaces
  const cleanNida = nidaNumber.replace(/[\s-]/g, '');
  
  // Tanzanian NIDA is 20 digits, starting with birth year (e.g. 19xx or 20xx)
  const nidaRegex = /^(19|20)\d{18}$/;
  if (!nidaRegex.test(cleanNida)) {
    return {
      isValid: false,
      message: 'Namba ya NIDA si sahihi. Inapaswa kuwa na tarakimu 20 (mfano: 19900101123450000123).'
    };
  }

  // Extract metadata
  const birthYear = cleanNida.substring(0, 4);
  const birthMonth = cleanNida.substring(4, 6);
  const birthDay = cleanNida.substring(6, 8);

  return {
    isValid: true,
    formattedNida: `${cleanNida.substring(0, 8)}-${cleanNida.substring(8, 13)}-${cleanNida.substring(13, 18)}-${cleanNida.substring(18, 20)}`,
    cleanNida,
    birthDate: `${birthYear}-${birthMonth}-${birthDay}`
  };
}

// Format currency into TZS
function formatTZS(amount) {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0
  }).format(amount);
}

module.exports = {
  generateControlNumber,
  generateReceiptNumber,
  validateNidaFormat,
  formatTZS
};
