import { createReadStream, existsSync, readFileSync } from "fs";
import { extname, join, normalize, resolve } from "path";
import { createServer } from "http";
import { createSolvaPayClient } from "@solvapay/server";

const root = resolve(".");
const port = Number(process.env.PORT || 5188);
const env = loadEnv();
const solvaPay = env.SOLVAPAY_SECRET_KEY
  ? createSolvaPayClient({
      apiKey: env.SOLVAPAY_SECRET_KEY,
      apiBaseUrl: env.SOLVAPAY_API_BASE_URL
    })
  : null;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function loadEnv() {
  const values = { ...process.env };
  if (!existsSync(".env")) return values;

  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return values;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100000) {
        req.destroy();
        rejectBody(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(body));
      } catch {
        rejectBody(new Error("Invalid JSON body"));
      }
    });
    req.on("error", rejectBody);
  });
}

function customerRefFromEmail(email) {
  return `yota_${email.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/No products found|List products failed|Get product failed|Create checkout session failed|Create product failed|Create plan failed/i.test(message)) {
    return message;
  }
  return "SolvaPay request failed";
}

async function listSolvaPayProducts() {
  if (!solvaPay) return [];
  try {
    const products = await solvaPay.listProducts();
    return products.map((product) => ({
      reference: product.reference,
      name: product.name,
      status: product.status,
      planCount: product.plans?.length || 0
    }));
  } catch {
    return [];
  }
}

async function getConfiguredProduct() {
  if (!solvaPay) {
    return {
      ok: false,
      status: 503,
      code: "missing_secret",
      message: "SOLVAPAY_SECRET_KEY is missing. Run npx -y solvapay@latest init."
    };
  }

  const envProductRef = env.SOLVAPAY_PRODUCT_REF || env.SOLVAPAY_PRODUCT;
  const envPlanRef = env.SOLVAPAY_PLAN_REF || env.SOLVAPAY_PLAN;

  try {
    if (envProductRef) {
      const product = await solvaPay.getProduct(envProductRef);
      const plans = product.plans?.length ? product.plans : await solvaPay.listPlans(envProductRef);
      const planRef = envPlanRef || plans.find((plan) => plan.status === "active")?.reference || plans[0]?.reference || "";
      if (!planRef) {
        return {
          ok: false,
          status: 503,
          code: "missing_plan",
          productRef: product.reference || envProductRef,
          productName: product.name || "YOTA booking",
          message: "SolvaPay product exists, but no active plan is connected. Use Set up YOTA product to create the booking plan."
        };
      }
      return {
        ok: true,
        productRef: product.reference || envProductRef,
        productName: product.name || "YOTA booking",
        planRef,
        planCount: plans.length
      };
    }

    const products = await solvaPay.listProducts();
    const product = products.find((item) => item.status === "active") || products[0];
    if (!product) {
      return {
        ok: false,
        status: 503,
        code: "missing_product",
        message: "No SolvaPay products found. Create a YOTA product and plan in SolvaPay, then restart the server."
      };
    }

    const plans = product.plans?.length ? product.plans : await solvaPay.listPlans(product.reference);
    const planRef = envPlanRef || plans.find((plan) => plan.status === "active")?.reference || plans[0]?.reference || "";
    if (!planRef) {
      return {
        ok: false,
        status: 503,
        code: "missing_plan",
        productRef: product.reference,
        productName: product.name || "YOTA booking",
        message: "SolvaPay product exists, but no active plan is connected. Use Set up YOTA product to create the booking plan."
      };
    }
    return {
      ok: true,
      productRef: product.reference,
      productName: product.name || "YOTA booking",
      planRef,
      planCount: plans.length
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      code: "solvapay_unavailable",
      message: safeError(error)
    };
  }
}

async function ensureCustomer({ email, travelerName }) {
  const externalRef = customerRefFromEmail(email);
  try {
    const customer = await solvaPay.getCustomer({ externalRef });
    return customer.customerRef;
  } catch {
    const created = await solvaPay.createCustomer({
      email,
      name: travelerName || email,
      externalRef,
      metadata: {
        app: "YOTA",
        country: "SE",
        currency: "SEK"
      }
    });
    return created.customerRef;
  }
}

async function handleStatus(res) {
  const product = await getConfiguredProduct();
  const products = await listSolvaPayProducts();
  sendJson(res, 200, {
    configured: product.ok,
    productRef: product.productRef || "",
    productName: product.productName || "",
    planRef: product.planRef || "",
    planCount: product.planCount || 0,
    message: product.ok ? "SolvaPay checkout is ready." : product.message,
    code: product.code || "ready",
    products
  });
}

async function handleSetup(res) {
  if (!solvaPay) {
    sendJson(res, 503, {
      error: "missing_secret",
      message: "SOLVAPAY_SECRET_KEY is missing. Run npx -y solvapay@latest init."
    });
    return;
  }

  try {
    const products = await solvaPay.listProducts();
    const existing = products.find((product) => /yota/i.test(product.name || ""));
    const product =
      existing ||
      (await solvaPay.createProduct({
        name: "YOTA Travel Booking",
        description: "Hosted checkout product for the YOTA Sweden-based travel assistant.",
        productType: "travel-assistant",
        config: {
          fulfillmentType: "digital",
          deliveryMethod: "api",
          validityPeriod: 30
        },
        metadata: {
          app: "YOTA",
          country: "SE",
          currency: "SEK"
        }
      }));

    const productRef = product.reference || product.product?.reference;
    if (!productRef) {
      sendJson(res, 502, { error: "setup_failed", message: "SolvaPay did not return a product reference." });
      return;
    }

    const plans = await solvaPay.listPlans(productRef).catch(() => []);
    const existingPlan = plans.find((plan) => /booking/i.test(plan.name || "")) || plans[0];
    const plan =
      existingPlan ||
      (await solvaPay.createPlan({
        productRef,
        name: "YOTA Booking Pass",
        description: "One-time hosted checkout access for a YOTA assisted booking.",
        type: "one-time",
        price: 9900,
        currency: "SEK",
        usageTracking: {
          method: "manual",
          granularity: "daily"
        },
        limits: {
          bookings: 1
        },
        metadata: {
          app: "YOTA",
          kind: "booking-pass"
        },
        features: {
          flightSearch: true,
          bookingAssistance: true,
          emailConfirmation: true
        },
        status: "active"
      }));

    sendJson(res, 200, {
      configured: true,
      productRef,
      productName: product.name || "YOTA Travel Booking",
      planRef: plan.reference || plan.plan?.reference || "",
      planName: plan.name || "YOTA Booking Pass",
      message: existing ? "Existing YOTA SolvaPay product connected." : "YOTA SolvaPay product and plan created."
    });
  } catch (error) {
    sendJson(res, 502, { error: "setup_failed", message: safeError(error) });
  }
}

async function handleCheckout(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim();
  const travelerName = String(body.travelerName || "").trim();
  const returnUrl = String(body.returnUrl || "").trim();
  const option = body.option || {};
  const trip = body.trip || {};

  if (!email || !email.includes("@")) {
    sendJson(res, 400, { error: "valid_email_required", message: "A valid email is required before checkout." });
    return;
  }

  const product = await getConfiguredProduct();
  if (!product.ok) {
    sendJson(res, product.status, { error: product.code, message: product.message });
    return;
  }

  try {
    const customerRef = await ensureCustomer({ email, travelerName });
    const session = await solvaPay.createCheckoutSession({
      customerRef,
      productRef: product.productRef,
      planRef: product.planRef || undefined,
      returnUrl: returnUrl || undefined
    });

    sendJson(res, 200, {
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
      customerRef,
      productRef: product.productRef,
      planRef: product.planRef,
      route: `${trip.origin || "Origin"} to ${trip.destination || "Destination"}`,
      amountSek: option.price || 0
    });
  } catch (error) {
    sendJson(res, 502, { error: "checkout_failed", message: safeError(error) });
  }
}

async function handlePortal(req, res) {
  const body = await readJson(req);
  const email = String(body.email || "").trim();
  const travelerName = String(body.travelerName || "").trim();

  if (!email || !email.includes("@")) {
    sendJson(res, 400, { error: "valid_email_required", message: "A valid email is required before opening billing." });
    return;
  }

  const product = await getConfiguredProduct();
  if (!product.ok) {
    sendJson(res, product.status, { error: product.code, message: product.message });
    return;
  }

  try {
    const customerRef = await ensureCustomer({ email, travelerName });
    const session = await solvaPay.createCustomerSession({
      customerRef,
      productRef: product.productRef
    });
    sendJson(res, 200, {
      customerUrl: session.customerUrl || session.url,
      customerRef,
      productRef: product.productRef
    });
  } catch (error) {
    sendJson(res, 502, { error: "portal_failed", message: safeError(error) });
  }
}

async function handleAccess(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const email = String(url.searchParams.get("email") || "").trim();
  if (!email || !email.includes("@")) {
    sendJson(res, 400, { hasAccess: false, error: "valid_email_required" });
    return;
  }

  const product = await getConfiguredProduct();
  if (!product.ok) {
    sendJson(res, product.status, { hasAccess: false, error: product.code, message: product.message });
    return;
  }

  try {
    const customerRef = await ensureCustomer({ email, travelerName: email });
    const limits = await solvaPay.checkLimits({
      customerRef,
      productRef: product.productRef,
      includeCheckoutSession: true
    });
    sendJson(res, limits.withinLimits ? 200 : 402, {
      hasAccess: Boolean(limits.withinLimits),
      remaining: limits.remaining,
      checkoutUrl: limits.checkoutUrl || "",
      customerRef,
      productRef: product.productRef
    });
  } catch (error) {
    sendJson(res, 502, { hasAccess: false, error: "access_check_failed", message: safeError(error) });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, requestPath));
  const relativePath = filePath.slice(root.length + 1);

  if (
    !filePath.startsWith(root) ||
    !existsSync(filePath) ||
    relativePath.startsWith(".") ||
    relativePath.startsWith("node_modules") ||
    relativePath.includes("/.") ||
    relativePath.startsWith("package-lock")
  ) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  const type = contentTypes[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url.startsWith("/api/solvapay/status")) {
      await handleStatus(res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/solvapay/setup") {
      await handleSetup(res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/create-checkout-session") {
      await handleCheckout(req, res);
      return;
    }
    if (req.method === "POST" && req.url === "/api/create-customer-session") {
      await handlePortal(req, res);
      return;
    }
    if (req.method === "GET" && req.url.startsWith("/api/check-access")) {
      await handleAccess(req, res);
      return;
    }
    if (req.method === "GET" || req.method === "HEAD") {
      serveStatic(req, res);
      return;
    }
    sendJson(res, 405, { error: "method_not_allowed" });
  } catch (error) {
    sendJson(res, 500, { error: "server_error", message: safeError(error) });
  }
});

server.listen(port, () => {
  console.log(`YOTA server running at http://localhost:${port}`);
});
