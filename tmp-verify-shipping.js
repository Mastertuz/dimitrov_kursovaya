const API = 'http://localhost:54001/api';

async function req(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@example.com', password: 'Admin123' }),
  });

  if (!login.ok || !login.body?.token) {
    console.log(JSON.stringify({ step: 'login', login }, null, 2));
    process.exit(1);
  }

  const token = login.body.token;
  const auth = { Authorization: `Bearer ${token}` };

  const productsRes = await req('/products');
  if (!productsRes.ok || !Array.isArray(productsRes.body) || productsRes.body.length === 0) {
    console.log(JSON.stringify({ step: 'products', productsRes }, null, 2));
    process.exit(1);
  }

  const sorted = [...productsRes.body].sort((a, b) => b.price - a.price);
  const chosen = sorted.find((p) => p.stock > 0);
  if (!chosen) {
    console.log(JSON.stringify({ step: 'choose-product', message: 'No in-stock products' }, null, 2));
    process.exit(1);
  }

  const cartBefore = await req('/cart', { headers: auth });
  if (!cartBefore.ok) {
    console.log(JSON.stringify({ step: 'cart-before', cartBefore }, null, 2));
    process.exit(1);
  }

  for (const item of cartBefore.body.items || []) {
    await req(`/cart/${item.productId}`, { method: 'DELETE', headers: auth });
  }

  const targetQty = Math.max(1, Math.ceil(5500 / chosen.price));
  const add = await req('/cart', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ productId: chosen.id, quantity: targetQty }),
  });

  if (!add.ok) {
    console.log(JSON.stringify({ step: 'add-to-cart', add, chosen, targetQty }, null, 2));
    process.exit(1);
  }

  const cartNoPromo = await req('/cart', { headers: auth });
  if (!cartNoPromo.ok) {
    console.log(JSON.stringify({ step: 'cart-no-promo', cartNoPromo }, null, 2));
    process.exit(1);
  }

  const applyPromo = await req('/cart/apply-promo', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ code: 'WELCOME10' }),
  });

  if (!applyPromo.ok) {
    console.log(JSON.stringify({ step: 'apply-promo', applyPromo }, null, 2));
    process.exit(1);
  }

  const cartWithPromo = await req('/cart', { headers: auth });
  if (!cartWithPromo.ok) {
    console.log(JSON.stringify({ step: 'cart-with-promo', cartWithPromo }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({
    chosen: { id: chosen.id, sku: chosen.sku, price: chosen.price, qty: targetQty },
    beforePromo: {
      subtotal: cartNoPromo.body.summary.subtotal,
      discount: cartNoPromo.body.summary.discount,
      delivery: cartNoPromo.body.summary.delivery,
      total: cartNoPromo.body.summary.total,
    },
    afterPromo: {
      subtotal: cartWithPromo.body.summary.subtotal,
      discount: cartWithPromo.body.summary.discount,
      delivery: cartWithPromo.body.summary.delivery,
      total: cartWithPromo.body.summary.total,
      promoCode: cartWithPromo.body.summary.promoCode,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
