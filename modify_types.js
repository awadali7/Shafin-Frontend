const fs = require('fs');

// 1. types.ts
let types = fs.readFileSync('lib/api/types.ts', 'utf8');
types = types.replace(
  /    extra_shipping_charge\?: number;\n    is_active\?: boolean;/g,
  `    extra_shipping_charge?: number;\n    origin_city?: string;\n    origin_state?: string;\n    origin_pincode?: string;\n    is_active?: boolean;`
);
fs.writeFileSync('lib/api/types.ts', types, 'utf8');

// 2. shop/page.tsx
let shopPage = fs.readFileSync('app/shop/page.tsx', 'utf8');
shopPage = shopPage.replace(
  /    extra_shipping_charge\?: number;\n    digitalFile\?: \{/g,
  `    extra_shipping_charge?: number;\n    origin_city?: string;\n    origin_state?: string;\n    origin_pincode?: string;\n    digitalFile?: {`
);
shopPage = shopPage.replace(
  /        extra_shipping_charge: p\.extra_shipping_charge,\n        digitalFile:/g,
  `        extra_shipping_charge: p.extra_shipping_charge,\n        origin_city: p.origin_city,\n        origin_state: p.origin_state,\n        origin_pincode: p.origin_pincode,\n        digitalFile:`
);
shopPage = shopPage.replace(
  /            extra_shipping_charge: product\.extra_shipping_charge,\n            quantity_pricing: product\.quantity_pricing,/g,
  `            extra_shipping_charge: product.extra_shipping_charge,\n            origin_city: product.origin_city,\n            origin_state: product.origin_state,\n            origin_pincode: product.origin_pincode,\n            quantity_pricing: product.quantity_pricing,`
);
fs.writeFileSync('app/shop/page.tsx', shopPage, 'utf8');

// 3. shop/[slug]/page.tsx
let slugPage = fs.readFileSync('app/shop/[slug]/page.tsx', 'utf8');
slugPage = slugPage.replace(
  /    extra_shipping_charge\?: number;\n    description: string;/g,
  `    extra_shipping_charge?: number;\n    origin_city?: string;\n    origin_state?: string;\n    origin_pincode?: string;\n    description: string;`
);
slugPage = slugPage.replace(
  /        extra_shipping_charge: p\.extra_shipping_charge,\n        description:/g,
  `        extra_shipping_charge: p.extra_shipping_charge,\n        origin_city: p.origin_city,\n        origin_state: p.origin_state,\n        origin_pincode: p.origin_pincode,\n        description:`
);
slugPage = slugPage.replace(
  /            extra_shipping_charge: product\.extra_shipping_charge,\n            quantity_pricing: product\.quantity_pricing,/g,
  `            extra_shipping_charge: product.extra_shipping_charge,\n            origin_city: product.origin_city,\n            origin_state: product.origin_state,\n            origin_pincode: product.origin_pincode,\n            quantity_pricing: product.quantity_pricing,`
);
fs.writeFileSync('app/shop/[slug]/page.tsx', slugPage, 'utf8');

console.log("Updated typescript interfaces perfectly.");
