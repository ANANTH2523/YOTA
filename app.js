import { ChatNlpAgent } from "./agents/nlp-agent.js";
import { PaymentBookingAgent } from "./agents/payment-agent.js";

const intro = document.querySelector("#intro");
const appShell = document.querySelector("#appShell");
const skipIntro = document.querySelector("#skipIntro");
const restartIntro = document.querySelector("#restartIntro");
const messages = document.querySelector("#messages");
const chatForm = document.querySelector("#chatForm");
const chatInput = document.querySelector("#chatInput");
const optionList = document.querySelector("#optionList");
const optionCount = document.querySelector("#optionCount");
const tripTitle = document.querySelector("#tripTitle");
const tripDetails = document.querySelector("#tripDetails");
const preferencesForm = document.querySelector("#preferencesForm");
const travelerNamePreference = document.querySelector("#travelerNamePreference");
const homeAirportPreference = document.querySelector("#homeAirportPreference");
const seatPreference = document.querySelector("#seatPreference");
const cabinPreference = document.querySelector("#cabinPreference");
const priorityPreference = document.querySelector("#priorityPreference");
const emailPreference = document.querySelector("#emailPreference");
const balanceValue = document.querySelector("#balanceValue");
const tripHold = document.querySelector("#tripHold");
const ledger = document.querySelector("#ledger");
const nlpStatus = document.querySelector("#nlpStatus");
const paymentStatus = document.querySelector("#paymentStatus");
const unifiedStatus = document.querySelector("#unifiedStatus");
const billingStatus = document.querySelector("#billingStatus");
const manageBillingButton = document.querySelector("#manageBillingButton");
const setupSolvaPayButton = document.querySelector("#setupSolvaPayButton");
const refreshSolvaPayButton = document.querySelector("#refreshSolvaPayButton");
const solvaPayProduct = document.querySelector("#solvaPayProduct");
const solvaPayPlan = document.querySelector("#solvaPayPlan");
const solvaPayDetails = document.querySelector("#solvaPayDetails");

const nlpAgent = new ChatNlpAgent();
const paymentAgent = new PaymentBookingAgent({ startingBalance: 28500 });

let currentTrip = null;
let currentOptions = [];
let solvapayReady = false;

const defaultPreferences = {
  travelerName: "Freja Andersson",
  homeAirport: "Stockholm Arlanda (ARN)",
  seat: "Window",
  cabin: "Economy",
  priority: "Best balance",
  email: "freja.andersson@example.se"
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(value);

const delay = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed with ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function showApp() {
  intro.classList.add("hidden");
  appShell.classList.add("ready");
  chatInput.focus();
}

function replayIntro() {
  intro.classList.remove("hidden");
  appShell.classList.remove("ready");
  const plane = document.querySelector("#introPlane");
  plane.style.animation = "none";
  plane.offsetHeight;
  plane.style.animation = "";
  window.setTimeout(showApp, 5400);
}

function addMessage(role, text, detail = "") {
  const bubble = document.createElement("div");
  bubble.className = `message ${role}`;
  const main = document.createElement("span");
  main.textContent = text;
  bubble.appendChild(main);
  if (detail) {
    const small = document.createElement("small");
    small.textContent = detail;
    bubble.appendChild(small);
  }
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function loadPreferences() {
  const stored = localStorage.getItem("yotaPreferences");
  const preferences = stored ? JSON.parse(stored) : defaultPreferences;
  travelerNamePreference.value = preferences.travelerName || defaultPreferences.travelerName;
  homeAirportPreference.value = preferences.homeAirport || defaultPreferences.homeAirport;
  seatPreference.value = preferences.seat || defaultPreferences.seat;
  cabinPreference.value = preferences.cabin || defaultPreferences.cabin;
  priorityPreference.value = preferences.priority || defaultPreferences.priority;
  emailPreference.value = preferences.email || defaultPreferences.email;
}

function getPreferences() {
  return {
    travelerName: travelerNamePreference.value.trim() || defaultPreferences.travelerName,
    homeAirport: homeAirportPreference.value || defaultPreferences.homeAirport,
    seat: seatPreference.value,
    cabin: cabinPreference.value,
    priority: priorityPreference.value,
    email: emailPreference.value.trim()
  };
}

function savePreferences() {
  localStorage.setItem("yotaPreferences", JSON.stringify(getPreferences()));
}

function setSubAgentStatus(agent, text) {
  const target = agent === "nlp" ? nlpStatus : paymentStatus;
  target.textContent = text;
}

function setUnifiedStatus(text) {
  unifiedStatus.textContent = text;
}

function setBillingStatus(text, isReady = false) {
  solvapayReady = isReady;
  billingStatus.textContent = text;
  billingStatus.classList.toggle("ready", isReady);
  billingStatus.classList.toggle("warning", !isReady);
  manageBillingButton.disabled = !isReady;
}

function renderSolvaPayManager(status) {
  solvaPayProduct.textContent = status.productName || status.productRef || "Not connected";
  solvaPayPlan.textContent = status.planRef || "Not connected";
  solvaPayDetails.textContent = status.message || "SolvaPay status unavailable.";
  setupSolvaPayButton.disabled = status.configured;
  setupSolvaPayButton.textContent = status.configured ? "YOTA product connected" : "Set up YOTA product";
}

function renderOptions() {
  optionCount.textContent = `${currentOptions.length} found`;
  optionList.innerHTML = "";

  currentOptions.forEach((option) => {
    const card = document.createElement("article");
    card.className = "flight-option";
    card.innerHTML = `
      <h4>${option.label}: ${option.airline}</h4>
      <div class="flight-meta">
        <span>${option.depart} to ${option.arrive}</span>
        <span>${option.duration}</span>
        <span>${option.stops}</span>
        <span>${option.fit}</span>
      </div>
      <div class="flight-price">
        <span>${formatCurrency(option.price)}</span>
        <button class="book-button" type="button" data-book="${option.id}">Book</button>
      </div>
    `;
    optionList.appendChild(card);
  });
}

function updateTripSummary() {
  if (!currentTrip) return;
  tripTitle.textContent = `${currentTrip.origin} to ${currentTrip.destination}`;
  tripDetails.textContent = `${currentTrip.dateHint} - ${currentTrip.originAirport} to ${currentTrip.destinationAirport} - ${currentTrip.cabin}, ${currentTrip.seat}, SEK fares`;
}

async function handleTravelRequest(text) {
  setUnifiedStatus("YOTA is routing your message");
  setSubAgentStatus("nlp", "Reading request");
  setSubAgentStatus("payment", "Standing by");

  const analysis = nlpAgent.understandTravelRequest(text, getPreferences(), currentTrip);
  setSubAgentStatus("nlp", analysis.status);
  addMessage("agent", analysis.message.text, analysis.message.detail);

  if (analysis.intent === "book_option") {
    if (!currentOptions.length) {
      addMessage("agent", "I need to search flights before I can book.", "Send a route first, for example: Stockholm to Tokyo next month.");
      setUnifiedStatus("Waiting for route details");
      return;
    }

    await delay(450);
    await bookOption(analysis.optionId || currentOptions[0].id);
    return;
  }

  if (analysis.intent !== "travel_search") {
    setUnifiedStatus("Waiting for route details");
    return;
  }

  currentTrip = analysis.trip;
  updateTripSummary();
  await delay(650);

  currentOptions = nlpAgent.searchFlights(currentTrip);
  const reply = nlpAgent.searchReply(currentTrip);
  addMessage("agent", reply.text, reply.detail);
  renderOptions();

  setSubAgentStatus("nlp", "Options ranked");
  setSubAgentStatus("payment", "Ready to book selected option");
  setUnifiedStatus("YOTA is ready to book");
}

async function bookOption(optionId) {
  const option = currentOptions.find((item) => item.id === optionId);
  if (!option || !currentTrip) return;

  setUnifiedStatus("YOTA is starting checkout");
  setSubAgentStatus("payment", "Creating SolvaPay checkout");

  try {
    const preferences = getPreferences();
    const checkout = await requestJson("/api/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({
        trip: currentTrip,
        option,
        email: preferences.email,
        travelerName: preferences.travelerName,
        returnUrl: `${window.location.origin}${window.location.pathname}?checkout=return`
      })
    });

    localStorage.setItem(
      "yotaPendingBooking",
      JSON.stringify({
        trip: currentTrip,
        option,
        email: preferences.email,
        travelerName: preferences.travelerName,
        checkoutSessionId: checkout.sessionId,
        customerRef: checkout.customerRef
      })
    );

    addLedgerItem("SolvaPay checkout", `Session ${checkout.sessionId || "created"} for ${formatCurrency(option.price)}`);
    addMessage("agent", "SolvaPay checkout is ready. I am redirecting you to complete payment.", "After payment, YOTA returns here and verifies access from the server.");
    setSubAgentStatus("payment", "Redirecting to SolvaPay");
    setUnifiedStatus("YOTA is waiting for payment");
    await delay(900);
    window.location.href = checkout.checkoutUrl;
  } catch (error) {
    const detail = error.data?.message || error.message;
    addMessage("agent", "SolvaPay checkout is not ready yet.", detail);
    addLedgerItem("Checkout blocked", detail);
    setSubAgentStatus("payment", "SolvaPay setup required");
    setUnifiedStatus("Create a SolvaPay product before live checkout");
  }
}

function finalizeLocalBooking({ trip, option, email, travelerName }) {
  const booking = paymentAgent.bookTrip({
    trip,
    option,
    email,
    travelerName
  });

  balanceValue.textContent = formatCurrency(booking.balance);
  tripHold.textContent = formatCurrency(booking.hold);
  ledger.innerHTML = "";
  booking.ledger.forEach((item) => addLedgerItem(item.title, item.detail));
  booking.messages.forEach((message) => addMessage("agent", message.text, message.detail));

  setSubAgentStatus("payment", booking.status);
  setUnifiedStatus("YOTA completed the verified booking");
}

function addLedgerItem(title, detail) {
  const item = document.createElement("div");
  item.className = "ledger-item";
  const label = document.createElement("strong");
  const note = document.createElement("span");
  label.textContent = title;
  note.textContent = detail;
  item.append(label, note);
  ledger.appendChild(item);
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  chatInput.value = "";
  await handleTravelRequest(text);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.prompt;
    chatInput.focus();
  });
});

optionList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-book]");
  if (button) await bookOption(button.dataset.book);
});

preferencesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const preferences = getPreferences();
  savePreferences();
  const reply = nlpAgent.savePreferenceReply(preferences);
  addMessage("agent", reply.text, reply.detail);
  setSubAgentStatus("nlp", "Preferences updated");
});

manageBillingButton.addEventListener("click", async () => {
  setSubAgentStatus("payment", "Opening SolvaPay billing");
  try {
    const preferences = getPreferences();
    const session = await requestJson("/api/create-customer-session", {
      method: "POST",
      body: JSON.stringify({
        email: preferences.email,
        travelerName: preferences.travelerName
      })
    });
    if (!session.customerUrl) {
      throw new Error("SolvaPay did not return a customer portal URL.");
    }
    window.location.href = session.customerUrl;
  } catch (error) {
    const detail = error.data?.message || error.message;
    addMessage("agent", "I cannot open SolvaPay billing yet.", detail);
    setSubAgentStatus("payment", "Billing portal unavailable");
  }
});

setupSolvaPayButton.addEventListener("click", async () => {
  setupSolvaPayButton.disabled = true;
  setupSolvaPayButton.textContent = "Setting up...";
  setSubAgentStatus("payment", "Setting up SolvaPay product");
  try {
    const result = await requestJson("/api/solvapay/setup", { method: "POST" });
    renderSolvaPayManager(result);
    setBillingStatus("SolvaPay ready", true);
    addMessage("agent", "SolvaPay is now connected for YOTA.", `${result.productName} - ${result.planName || result.planRef}`);
    addLedgerItem("SolvaPay manager", result.message);
    setSubAgentStatus("payment", "SolvaPay checkout ready");
  } catch (error) {
    setupSolvaPayButton.disabled = false;
    setupSolvaPayButton.textContent = "Retry SolvaPay setup";
    solvaPayDetails.textContent = error.data?.message || error.message;
    addMessage("agent", "SolvaPay setup failed.", error.data?.message || error.message);
    setSubAgentStatus("payment", "SolvaPay setup failed");
  }
});

refreshSolvaPayButton.addEventListener("click", async () => {
  refreshSolvaPayButton.disabled = true;
  await initSolvaPay();
  refreshSolvaPayButton.disabled = false;
});

skipIntro.addEventListener("click", showApp);
restartIntro.addEventListener("click", replayIntro);

loadPreferences();
balanceValue.textContent = formatCurrency(paymentAgent.getSnapshot().balance);
tripHold.textContent = formatCurrency(paymentAgent.getSnapshot().hold);
nlpAgent.getOpeningMessages(getPreferences()).forEach((message) => addMessage("agent", message.text, message.detail));
setUnifiedStatus("YOTA unified assistant online");
setSubAgentStatus("nlp", "Ready for travel request");
setSubAgentStatus("payment", "Ready for booking");
initSolvaPay();
handleCheckoutReturn();
window.setTimeout(showApp, 5400);

async function initSolvaPay() {
  try {
    const status = await requestJson("/api/solvapay/status");
    renderSolvaPayManager(status);
    if (status.configured) {
      setBillingStatus("SolvaPay ready", true);
      addLedgerItem("SolvaPay", `${status.productName || status.productRef} connected`);
      setSubAgentStatus("payment", "SolvaPay checkout ready");
    } else {
      setBillingStatus("Setup needed", false);
      addLedgerItem("SolvaPay setup", status.message);
      setSubAgentStatus("payment", "SolvaPay product needed");
    }
  } catch (error) {
    setBillingStatus("Setup needed", false);
    renderSolvaPayManager({
      configured: false,
      message: error.data?.message || error.message
    });
    addLedgerItem("SolvaPay setup", error.data?.message || error.message);
    setSubAgentStatus("payment", "SolvaPay product needed");
  }
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") !== "return") return;

  const pending = JSON.parse(localStorage.getItem("yotaPendingBooking") || "null");
  if (!pending) {
    addMessage("agent", "Welcome back from SolvaPay.", "I could not find a pending YOTA booking in this browser.");
    return;
  }

  setUnifiedStatus("YOTA is verifying payment");
  setSubAgentStatus("payment", "Checking server-side access");

  try {
    const access = await requestJson(`/api/check-access?email=${encodeURIComponent(pending.email)}`);
    if (!access.hasAccess) {
      throw new Error("Payment is not active yet.");
    }
    finalizeLocalBooking(pending);
    localStorage.removeItem("yotaPendingBooking");
    addMessage("agent", "Payment verified. I completed the YOTA booking record.", `Customer ${access.customerRef} has access for product ${access.productRef}.`);
    window.history.replaceState({}, "", window.location.pathname);
  } catch (error) {
    addMessage("agent", "Welcome back. I could not verify payment access yet.", error.data?.message || error.message);
    setSubAgentStatus("payment", "Payment verification pending");
  }
}
