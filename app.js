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

const nlpAgent = new ChatNlpAgent();
const paymentAgent = new PaymentBookingAgent({ startingBalance: 28500 });

let currentTrip = null;
let currentOptions = [];

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
    bookOption(analysis.optionId || currentOptions[0].id);
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

function bookOption(optionId) {
  const option = currentOptions.find((item) => item.id === optionId);
  if (!option || !currentTrip) return;

  setUnifiedStatus("YOTA is booking");
  setSubAgentStatus("payment", "Authorizing payment");

  const booking = paymentAgent.bookTrip({
    trip: currentTrip,
    option,
    email: getPreferences().email,
    travelerName: getPreferences().travelerName
  });

  balanceValue.textContent = formatCurrency(booking.balance);
  tripHold.textContent = formatCurrency(booking.hold);
  ledger.innerHTML = "";
  booking.ledger.forEach((item) => addLedgerItem(item.title, item.detail));
  booking.messages.forEach((message) => addMessage("agent", message.text, message.detail));

  setSubAgentStatus("payment", booking.status);
  setUnifiedStatus("YOTA completed the demo booking");
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

optionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (button) bookOption(button.dataset.book);
});

preferencesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const preferences = getPreferences();
  savePreferences();
  const reply = nlpAgent.savePreferenceReply(preferences);
  addMessage("agent", reply.text, reply.detail);
  setSubAgentStatus("nlp", "Preferences updated");
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
window.setTimeout(showApp, 5400);
