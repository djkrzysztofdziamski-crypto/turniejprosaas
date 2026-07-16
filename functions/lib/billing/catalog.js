/**
 * Katalog produktów Turniejomat — warstwa billing (niezależna od silnika sportowego).
 * productId mapuje: sport(y) + czas trwania + cena.
 */
const PRODUCTS = {
  'football-weekend': {
    id: 'football-weekend',
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
    label: 'Pakiet miesięczny — piłka nożna',
    sports: ['football'],
    duration: 'miesiac',
    typ: 'miesiac',
    pricePln: 149,
    priceGrosze: 14900,
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
};

function getProduct(productId) {
  return PRODUCTS[productId] || null;
}

function getActiveProducts() {
  return Object.values(PRODUCTS).filter((p) => p.active);
}

function resolveProductId({ productId, package: pkg, typ }) {
  if (productId && PRODUCTS[productId]) return productId;
  if (pkg && LEGACY_PACKAGE_MAP[pkg]) return LEGACY_PACKAGE_MAP[pkg];
  if (typ === 'miesiac') return 'football-month';
  if (typ === 'weekend') return 'football-weekend';
  return 'football-weekend';
}

function productToPublic(product) {
  return {
    id: product.id,
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
