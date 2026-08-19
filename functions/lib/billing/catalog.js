/**
 * Katalog produktów Turniejomat — warstwa billing (niezależna od silnika sportowego).
 * productId mapuje: sport(y) + czas trwania + cena.
 */
const PRODUCTS = {
  'football-weekend': {
    id: 'football-weekend',
    app: 'turniejomat',
    label: 'Pakiet weekendowy — piłka nożna',
    sports: ['football'],
    duration: 'weekend',
    typ: 'weekend',
    pricePln: 79,
    priceGrosze: 7900,
    active: true,
  },
  'football-month': {
    id: 'football-month',
    app: 'turniejomat',
    label: 'Pakiet miesięczny — piłka nożna',
    sports: ['football'],
    duration: 'miesiac',
    typ: 'miesiac',
    pricePln: 149,
    priceGrosze: 14900,
    active: true,
  },
  'setka-weekend': {
    id: 'setka-weekend',
    app: 'setka',
    label: 'SETKA — pakiet weekendowy',
    sports: ['setka'],
    duration: 'weekend',
    typ: 'weekend',
    days: 3,
    pricePln: 89,
    priceGrosze: 8900,
    active: true,
  },
  'setka-month': {
    id: 'setka-month',
    app: 'setka',
    label: 'SETKA — pakiet miesięczny',
    sports: ['setka'],
    duration: 'miesiac',
    typ: 'miesiac',
    days: 30,
    pricePln: 199,
    priceGrosze: 19900,
    active: true,
  },
  'setka-year': {
    id: 'setka-year',
    app: 'setka',
    label: 'SETKA — pakiet roczny',
    sports: ['setka'],
    duration: 'rok',
    typ: 'rok',
    days: 365,
    pricePln: 999,
    priceGrosze: 99900,
    active: true,
  },
  // Przyszłe produkty (dart, pool) — dodaj tutaj bez zmiany webhooka
  // 'dart-weekend': { id: 'dart-weekend', sports: ['dart'], ... },
};

/** Mapowanie legacy metadata Stripe `package` → productId */
const LEGACY_PACKAGE_MAP = {
  weekend: 'football-weekend',
  miesiac: 'football-month',
  month: 'football-month',
  'setka-weekend': 'setka-weekend',
  'setka-month': 'setka-month',
  'setka-year': 'setka-year',
};

function getProduct(productId) {
  return PRODUCTS[productId] || null;
}

function getActiveProducts() {
  return Object.values(PRODUCTS).filter((p) => p.active);
}

function resolveProductId({ productId, package: pkg, typ, app }) {
  if (productId && PRODUCTS[productId]) return productId;
  if (app === 'setka') {
    if (typ === 'rok') return 'setka-year';
    if (typ === 'miesiac') return 'setka-month';
    return 'setka-weekend';
  }
  if (pkg && LEGACY_PACKAGE_MAP[pkg]) return LEGACY_PACKAGE_MAP[pkg];
  if (typ === 'miesiac') return 'football-month';
  if (typ === 'weekend') return 'football-weekend';
  return 'football-weekend';
}

function productToPublic(product) {
  return {
    id: product.id,
    app: product.app || 'turniejomat',
    label: product.label,
    sports: product.sports,
    duration: product.duration,
    pricePln: product.pricePln,
  };
}

module.exports = {
  PRODUCTS,
  getProduct,
  getActiveProducts,
  resolveProductId,
  productToPublic,
};
