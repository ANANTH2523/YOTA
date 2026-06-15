const globalAirports = {
  stockholm: { airport: "Stockholm Arlanda (ARN)", region: "Europe", country: "Sweden" },
  arlanda: { airport: "Stockholm Arlanda (ARN)", region: "Europe", country: "Sweden" },
  gothenburg: { airport: "Gothenburg Landvetter (GOT)", region: "Europe", country: "Sweden" },
  malmo: { airport: "Malmo via Copenhagen (CPH)", region: "Europe", country: "Sweden" },
  copenhagen: { airport: "Copenhagen (CPH)", region: "Europe", country: "Denmark" },
  umea: { airport: "Umea Airport (UME)", region: "Europe", country: "Sweden" },
  oslo: { airport: "Oslo Gardermoen (OSL)", region: "Europe", country: "Norway" },
  helsinki: { airport: "Helsinki Vantaa (HEL)", region: "Europe", country: "Finland" },
  london: { airport: "London Heathrow (LHR)", region: "Europe", country: "United Kingdom" },
  paris: { airport: "Paris Charles de Gaulle (CDG)", region: "Europe", country: "France" },
  amsterdam: { airport: "Amsterdam Schiphol (AMS)", region: "Europe", country: "Netherlands" },
  berlin: { airport: "Berlin Brandenburg (BER)", region: "Europe", country: "Germany" },
  barcelona: { airport: "Barcelona El Prat (BCN)", region: "Europe", country: "Spain" },
  madrid: { airport: "Madrid Barajas (MAD)", region: "Europe", country: "Spain" },
  rome: { airport: "Rome Fiumicino (FCO)", region: "Europe", country: "Italy" },
  lisbon: { airport: "Lisbon Humberto Delgado (LIS)", region: "Europe", country: "Portugal" },
  zurich: { airport: "Zurich Airport (ZRH)", region: "Europe", country: "Switzerland" },
  vienna: { airport: "Vienna International (VIE)", region: "Europe", country: "Austria" },
  istanbul: { airport: "Istanbul Airport (IST)", region: "Middle East", country: "Turkey" },
  dubai: { airport: "Dubai International (DXB)", region: "Middle East", country: "United Arab Emirates" },
  doha: { airport: "Doha Hamad (DOH)", region: "Middle East", country: "Qatar" },
  "new york": { airport: "New York JFK (JFK)", region: "North America", country: "United States" },
  "los angeles": { airport: "Los Angeles (LAX)", region: "North America", country: "United States" },
  "san francisco": { airport: "San Francisco (SFO)", region: "North America", country: "United States" },
  miami: { airport: "Miami International (MIA)", region: "North America", country: "United States" },
  toronto: { airport: "Toronto Pearson (YYZ)", region: "North America", country: "Canada" },
  vancouver: { airport: "Vancouver International (YVR)", region: "North America", country: "Canada" },
  "mexico city": { airport: "Mexico City Benito Juarez (MEX)", region: "North America", country: "Mexico" },
  "sao paulo": { airport: "Sao Paulo Guarulhos (GRU)", region: "South America", country: "Brazil" },
  rio: { airport: "Rio de Janeiro Galeao (GIG)", region: "South America", country: "Brazil" },
  "buenos aires": { airport: "Buenos Aires Ezeiza (EZE)", region: "South America", country: "Argentina" },
  tokyo: { airport: "Tokyo Haneda (HND)", region: "Asia", country: "Japan" },
  seoul: { airport: "Seoul Incheon (ICN)", region: "Asia", country: "South Korea" },
  singapore: { airport: "Singapore Changi (SIN)", region: "Asia", country: "Singapore" },
  bangkok: { airport: "Bangkok Suvarnabhumi (BKK)", region: "Asia", country: "Thailand" },
  bali: { airport: "Bali Denpasar (DPS)", region: "Asia", country: "Indonesia" },
  hongkong: { airport: "Hong Kong International (HKG)", region: "Asia", country: "Hong Kong" },
  "hong kong": { airport: "Hong Kong International (HKG)", region: "Asia", country: "Hong Kong" },
  delhi: { airport: "Delhi Indira Gandhi (DEL)", region: "Asia", country: "India" },
  mumbai: { airport: "Mumbai Chhatrapati Shivaji (BOM)", region: "Asia", country: "India" },
  sydney: { airport: "Sydney Kingsford Smith (SYD)", region: "Oceania", country: "Australia" },
  melbourne: { airport: "Melbourne Tullamarine (MEL)", region: "Oceania", country: "Australia" },
  auckland: { airport: "Auckland Airport (AKL)", region: "Oceania", country: "New Zealand" },
  johannesburg: { airport: "Johannesburg OR Tambo (JNB)", region: "Africa", country: "South Africa" },
  "cape town": { airport: "Cape Town International (CPT)", region: "Africa", country: "South Africa" },
  nairobi: { airport: "Nairobi Jomo Kenyatta (NBO)", region: "Africa", country: "Kenya" },
  cairo: { airport: "Cairo International (CAI)", region: "Africa", country: "Egypt" },
  marrakech: { airport: "Marrakech Menara (RAK)", region: "Africa", country: "Morocco" }
};

const regionAirlines = {
  Europe: ["SAS", "Norwegian", "Finnair", "KLM", "Lufthansa", "Ryanair"],
  "North America": ["SAS + Delta", "United", "Air Canada", "KLM + JetBlue"],
  "South America": ["KLM + LATAM", "Air France + GOL", "Lufthansa + LATAM"],
  Asia: ["Finnair", "Qatar Airways", "Emirates", "Turkish Airlines", "Singapore Airlines"],
  "Middle East": ["Qatar Airways", "Emirates", "Turkish Airlines", "SAS + Etihad"],
  Africa: ["KLM", "Turkish Airlines", "Qatar Airways", "Ethiopian Airlines"],
  Oceania: ["Qatar Airways", "Emirates", "Finnair + Qantas", "Singapore Airlines"]
};

const routeProfiles = {
  Europe: { base: 1450, shortest: 165, balanced: 205, cheapest: 265, stops: ["Nonstop", "1 stop", "1 stop"] },
  "Middle East": { base: 3600, shortest: 360, balanced: 430, cheapest: 520, stops: ["Nonstop", "1 stop", "1 stop"] },
  "North America": { base: 5200, shortest: 500, balanced: 620, cheapest: 760, stops: ["Nonstop", "1 stop", "1 stop"] },
  Asia: { base: 5900, shortest: 610, balanced: 760, cheapest: 910, stops: ["1 stop", "1 stop", "2 stops"] },
  Africa: { base: 4700, shortest: 520, balanced: 650, cheapest: 800, stops: ["1 stop", "1 stop", "2 stops"] },
  "South America": { base: 6800, shortest: 820, balanced: 980, cheapest: 1120, stops: ["1 stop", "1 stop", "2 stops"] },
  Oceania: { base: 9600, shortest: 1180, balanced: 1370, cheapest: 1540, stops: ["1 stop", "2 stops", "2 stops"] },
  Unknown: { base: 4100, shortest: 450, balanced: 560, cheapest: 690, stops: ["1 stop", "1 stop", "2 stops"] }
};

const bookingWords = /\b(book|reserve|buy|confirm)\b/i;
const optionWords = /\b(cheapest|fastest|best|balanced|balance|lowest|quickest)\b/i;

export class ChatNlpAgent {
  constructor() {
    this.name = "NLP travel agent";
  }

  getOpeningMessages(preferences = {}) {
    const travelerName = preferences.travelerName || "Freja";
    const homeAirport = preferences.homeAirport || "Stockholm Arlanda (ARN)";

    return [
      {
        text: `Hello ${travelerName}, I am YOTA. How was your day?`,
        detail: `Your profile is Sweden-based from ${homeAirport}. I can still search worldwide routes and show every fare in SEK.`
      },
      {
        text: "Tell me a destination, date, and comfort preference. I will keep asking useful follow-ups until the trip is ready.",
        detail: "The NLP sub-agent handles the conversation and flight ranking; the payment sub-agent handles booking, transaction ID, email, and bank-monitor status."
      }
    ];
  }

  savePreferenceReply(preferences) {
    return {
      text: "Preferences saved.",
      detail: `${preferences.travelerName} - ${preferences.homeAirport}, ${preferences.seat}, ${preferences.cabin}, ${preferences.priority}, SEK`
    };
  }

  understandTravelRequest(text, preferences, activeTrip = null) {
    const clean = this.cleanText(text);

    if (this.isSmallTalk(clean)) {
      return {
        intent: "smalltalk",
        status: "Conversational follow-up",
        message: {
          text: this.smallTalkReply(clean, preferences),
          detail: "When you are ready, tell me something like: Stockholm to Tokyo next month, cheapest, window seat."
        }
      };
    }

    if (bookingWords.test(clean) && activeTrip && !this.hasRoute(clean)) {
      return {
        intent: "book_option",
        status: "Booking instruction parsed",
        optionId: this.extractBookOption(clean),
        message: {
          text: "Understood. I will send the selected flight to the payment sub-agent.",
          detail: "You can say cheapest, fastest, or best fit. If no option is named, I use the top-ranked choice."
        }
      };
    }

    const trip = this.extractTrip(clean, preferences, activeTrip);

    if (!trip.origin && !trip.destination) {
      return {
        intent: "clarify_route",
        status: "Needs destination",
        message: {
          text: "Where would you like to go?",
          detail: `I can start from your saved Swedish home airport, ${preferences.homeAirport}, and search worldwide in SEK.`
        }
      };
    }

    if (!trip.origin) {
      return {
        intent: "clarify_origin",
        status: "Needs origin",
        message: {
          text: `I have ${trip.destination}. Should I start from your saved Swedish airport?`,
          detail: `Saved origin: ${preferences.homeAirport}. Reply yes, or say another city like from Gothenburg.`
        }
      };
    }

    if (!trip.destination || trip.origin === trip.destination) {
      return {
        intent: "clarify_destination",
        status: "Needs destination",
        message: {
          text: `I have ${trip.origin}. Where are you flying to?`,
          detail: "You can name any major city worldwide, for example Tokyo, New York, Dubai, Cape Town, or Sydney."
        }
      };
    }

    const mode = activeTrip && !this.hasRoute(clean) ? "Updated" : "Got it";

    return {
      intent: "travel_search",
      status: "Route and preferences parsed",
      trip,
      message: {
        text: `${mode}. I am checking ${trip.origin} to ${trip.destination}.`,
        detail: `${trip.dateHint} - ${trip.cabin}, ${trip.seat}, ${trip.baggage}, ${trip.priority} - all prices in SEK`
      }
    };
  }

  searchFlights(trip) {
    return this.makeFlightOptions(trip);
  }

  searchReply(trip) {
    const region = trip.destinationRegion || "worldwide";
    return {
      text: `I compared worldwide carriers for ${region} travel and ranked the choices for your Swedish profile.`,
      detail: "You can now say book cheapest, book fastest, book best, or reply with changes like aisle seat, business class, direct only, or carry-on only."
    };
  }

  extractTrip(clean, preferences, activeTrip = null) {
    const parsedRoute = this.parseRoute(clean, preferences);
    const fallbackOrigin = activeTrip?.origin || "";
    const fallbackDestination = activeTrip?.destination || "";
    const origin = parsedRoute.origin || fallbackOrigin;
    const destination = parsedRoute.destination || fallbackDestination;
    const originInfo = this.airportInfoFor(origin, preferences.homeAirport);
    const destinationInfo = this.airportInfoFor(destination);

    return {
      origin,
      destination,
      originAirport: originInfo.airport,
      destinationAirport: destinationInfo.airport,
      originRegion: originInfo.region,
      destinationRegion: destinationInfo.region,
      dateHint: this.extractDate(clean, activeTrip?.dateHint),
      priority: this.extractPriority(clean, activeTrip?.priority || preferences.priority),
      seat: this.extractSeat(clean, activeTrip?.seat || preferences.seat),
      cabin: this.extractCabin(clean, activeTrip?.cabin || preferences.cabin),
      meal: this.extractMeal(clean, activeTrip?.meal),
      baggage: this.extractBaggage(clean, activeTrip?.baggage)
    };
  }

  parseRoute(clean, preferences) {
    const routePatterns = [
      /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please|for|direct|nonstop|window|aisle|economy|business|premium|carry)\b|$)/i,
      /([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please|for|direct|nonstop|window|aisle|economy|business|premium|carry)\b|$)/i,
      /to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please|for|direct|nonstop|window|aisle|economy|business|premium|carry)\b|$)/i
    ];

    for (const pattern of routePatterns) {
      const match = clean.match(pattern);
      if (!match) continue;

      if (match.length === 3) {
        return {
          origin: this.tidyPlace(match[1]),
          destination: this.tidyPlace(match[2])
        };
      }

      return {
        origin: this.originFromHomeAirport(preferences.homeAirport),
        destination: this.tidyPlace(match[1])
      };
    }

    const knownDestination = this.findKnownDestination(clean);
    if (knownDestination) {
      return {
        origin: this.originFromHomeAirport(preferences.homeAirport),
        destination: this.tidyPlace(knownDestination)
      };
    }

    return { origin: "", destination: "" };
  }

  cleanText(text) {
    return text.replace(/[.?!]/g, " ").replace(/\s+/g, " ").trim();
  }

  tidyPlace(value) {
    return value
      .trim()
      .replace(/\b(i want|i need|book me|fly|travel|go|from|please|can you|could you|me|a flight)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  originFromHomeAirport(homeAirport) {
    if (homeAirport.includes("Gothenburg")) return "Gothenburg";
    if (homeAirport.includes("Malmo")) return "Malmo";
    if (homeAirport.includes("Bromma")) return "Stockholm";
    if (homeAirport.includes("Umea")) return "Umea";
    return "Stockholm";
  }

  airportInfoFor(place, fallback = "") {
    if (!place) {
      return { airport: fallback || "", region: "Unknown", country: "" };
    }

    const key = this.placeKey(place);
    const match = globalAirports[key] || globalAirports[key.split(" ")[0]];
    if (match) return match;
    return { airport: fallback || `${place} International Airport`, region: "Unknown", country: "" };
  }

  placeKey(place) {
    return place
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  findKnownDestination(clean) {
    const lowered = this.placeKey(clean);
    return Object.keys(globalAirports)
      .sort((a, b) => b.length - a.length)
      .find((city) => new RegExp(`\\b${city}\\b`, "i").test(lowered));
  }

  hasRoute(clean) {
    return /\bfrom\b.+\bto\b/i.test(clean) || /\bto\b\s+[a-zA-Z]/i.test(clean);
  }

  extractDate(clean, fallback = "flexible dates") {
    return (
      clean.match(/\b(today|tomorrow|next\s+\w+|this\s+weekend|next\s+week|next\s+month|in\s+\d+\s+days?|in\s+\d+\s+weeks?|on\s+\d{1,2}\s+\w+)\b/i)?.[0] ||
      fallback ||
      "flexible dates"
    );
  }

  extractPriority(clean, fallback) {
    if (/fastest|quickest|shortest/i.test(clean)) return "Fastest";
    if (/cheapest|lowest price|low price|budget/i.test(clean)) return "Cheapest";
    if (/fewest stops|direct|nonstop|non-stop/i.test(clean)) return "Fewest stops";
    if (/best|balance|balanced/i.test(clean)) return "Best balance";
    return fallback || "Best balance";
  }

  extractSeat(clean, fallback) {
    if (/aisle/i.test(clean)) return "Aisle";
    if (/extra legroom|leg space|legroom/i.test(clean)) return "Extra legroom";
    if (/window/i.test(clean)) return "Window";
    return fallback || "Window";
  }

  extractCabin(clean, fallback) {
    if (/business/i.test(clean)) return "Business";
    if (/premium economy|premium/i.test(clean)) return "Premium economy";
    if (/economy/i.test(clean)) return "Economy";
    return fallback || "Economy";
  }

  extractMeal(clean, fallback = "Standard meal") {
    if (/vegetarian|veggie/i.test(clean)) return "Vegetarian meal";
    if (/vegan/i.test(clean)) return "Vegan meal";
    if (/halal/i.test(clean)) return "Halal meal";
    if (/kosher/i.test(clean)) return "Kosher meal";
    return fallback;
  }

  extractBaggage(clean, fallback = "Standard baggage") {
    if (/carry-on only|carry on only|no checked/i.test(clean)) return "Carry-on only";
    if (/checked bag|checked baggage|luggage|suitcase/i.test(clean)) return "Checked baggage";
    return fallback;
  }

  extractBookOption(clean) {
    if (/fastest|quickest|shortest/i.test(clean)) return "fastest";
    if (/cheapest|lowest|budget/i.test(clean)) return "cheapest";
    if (/best|balance|balanced/i.test(clean)) return "best";
    return "";
  }

  isSmallTalk(clean) {
    return /^(hi|hello|hey|good|great|fine|bad|tired|ok|okay|how are you|not bad|doing good)\b/i.test(clean);
  }

  smallTalkReply(clean, preferences) {
    if (/bad|tired/i.test(clean)) {
      return "I understand. I will keep this simple: give me the city you want to visit and I will do the sorting.";
    }
    if (/how are you/i.test(clean)) {
      return "I am ready to help with a trip from Sweden to anywhere in the world.";
    }
    return `Good to hear. Where should I search from ${this.originFromHomeAirport(preferences.homeAirport)}?`;
  }

  makeFlightOptions(trip) {
    const profile = routeProfiles[trip.destinationRegion] || routeProfiles.Unknown;
    const airlines = regionAirlines[trip.destinationRegion] || ["SAS", "KLM", "Lufthansa", "Qatar Airways"];
    const routeSeed = (trip.origin.length + trip.destination.length + trip.destinationAirport.length) * 17;
    const cabinMultiplier = trip.cabin === "Business" ? 3.4 : trip.cabin === "Premium economy" ? 1.75 : 1;
    const seatFee = trip.seat === "Extra legroom" ? 520 : trip.seat === "Window" || trip.seat === "Aisle" ? 140 : 0;
    const baggageFee = trip.baggage === "Checked baggage" ? 360 : 0;
    const unknownSurcharge = trip.destinationRegion === "Unknown" ? 900 : 0;
    const base = profile.base + (routeSeed % 900) + seatFee + baggageFee + unknownSurcharge;

    return [
      {
        id: "cheapest",
        label: "Cheapest",
        airline: airlines[routeSeed % airlines.length],
        depart: "06:45",
        arrive: this.arrivalTime("06:45", profile.cheapest),
        stops: profile.stops[2],
        duration: this.durationLabel(profile.cheapest),
        fit: `Lowest SEK fare - ${trip.originAirport} to ${trip.destinationAirport}`,
        price: Math.round((base + profile.cheapest * 6) * cabinMultiplier)
      },
      {
        id: "fastest",
        label: "Fastest",
        airline: airlines[(routeSeed + 2) % airlines.length],
        depart: "10:10",
        arrive: this.arrivalTime("10:10", profile.shortest),
        stops: profile.stops[0],
        duration: this.durationLabel(profile.shortest),
        fit: `Shortest total journey - ${trip.originAirport} to ${trip.destinationAirport}`,
        price: Math.round((base + profile.shortest * 9 + 950) * cabinMultiplier)
      },
      {
        id: "best",
        label: "Best fit",
        airline: airlines[(routeSeed + 4) % airlines.length],
        depart: "13:25",
        arrive: this.arrivalTime("13:25", profile.balanced),
        stops: profile.stops[1],
        duration: this.durationLabel(profile.balanced),
        fit: `${trip.priority} with ${trip.seat.toLowerCase()} preference - ${trip.meal}`,
        price: Math.round((base + profile.balanced * 7 + 420) * cabinMultiplier)
      }
    ].sort((a, b) => this.rankOption(a, trip.priority) - this.rankOption(b, trip.priority));
  }

  durationLabel(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  arrivalTime(depart, durationMinutes) {
    const [hours, minutes] = depart.split(":").map(Number);
    const total = hours * 60 + minutes + durationMinutes;
    const dayOffset = Math.floor(total / 1440);
    const arrivalHours = String(Math.floor((total % 1440) / 60)).padStart(2, "0");
    const arrivalMinutes = String(total % 60).padStart(2, "0");
    return `${arrivalHours}:${arrivalMinutes}${dayOffset ? " +1" : ""}`;
  }

  rankOption(option, priority) {
    if (priority === "Cheapest") return option.id === "cheapest" ? 0 : option.price;
    if (priority === "Fastest") return option.id === "fastest" ? 0 : option.price;
    if (priority === "Fewest stops") return option.stops === "Nonstop" ? 0 : 1;
    return option.id === "best" ? 0 : option.price;
  }
}
