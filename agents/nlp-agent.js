const airlines = ["SAS", "Norwegian", "Finnair", "KLM", "Lufthansa", "Ryanair"];

const europeanAirports = {
  amsterdam: "Amsterdam Schiphol (AMS)",
  arlanda: "Stockholm Arlanda (ARN)",
  barcelona: "Barcelona El Prat (BCN)",
  berlin: "Berlin Brandenburg (BER)",
  copenhagen: "Copenhagen (CPH)",
  gothenburg: "Gothenburg Landvetter (GOT)",
  london: "London Heathrow (LHR)",
  malmo: "Malmo via Copenhagen (CPH)",
  paris: "Paris Charles de Gaulle (CDG)",
  rome: "Rome Fiumicino (FCO)",
  stockholm: "Stockholm Arlanda (ARN)",
  umea: "Umea Airport (UME)"
};

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
        detail: `I am set up for Sweden-based travel from ${homeAirport}, with SEK pricing and European airport defaults.`
      },
      {
        text: "Tell me where you are flying from in Sweden, where you want to go, and what matters most.",
        detail: "A payment sub-agent will handle booking, transaction ID, email, and balance monitoring."
      }
    ];
  }

  savePreferenceReply(preferences) {
    return {
      text: "Preferences saved.",
      detail: `${preferences.travelerName} - ${preferences.homeAirport}, ${preferences.seat}, ${preferences.cabin}, ${preferences.priority}`
    };
  }

  understandTravelRequest(text, preferences) {
    const trip = this.extractTrip(text, preferences);

    if (!trip.origin || !trip.destination || trip.origin === trip.destination) {
      return {
        intent: "clarify_route",
        status: "Needs route details",
        message: {
          text: "I can help with that. Please tell me both places in one line, for example: from Stockholm to Barcelona next Friday.",
          detail: `The NLP agent can also use your saved Swedish home airport: ${preferences.homeAirport}.`
        }
      };
    }

    return {
      intent: "travel_search",
      status: "Route and preferences parsed",
      trip,
      message: {
        text: `Got it. I am checking ${trip.origin} to ${trip.destination}.`,
        detail: `${trip.dateHint} - ${trip.cabin}, ${trip.seat}, ${trip.baggage} - prices in SEK`
      }
    };
  }

  searchFlights(trip) {
    return this.makeFlightOptions(trip);
  }

  searchReply() {
    return {
      text: "I compared European carriers, SEK fares, duration, stops, and your saved comfort preferences.",
      detail: "The NLP agent ranked cheapest, fastest, and best-fit options for YOTA."
    };
  }

  extractTrip(text, preferences) {
    const clean = text.replace(/[.?!]/g, " ").replace(/\s+/g, " ").trim();
    const routePatterns = [
      /from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please)\b|$)/i,
      /([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please)\b|$)/i,
      /to\s+([a-zA-Z\s]+?)(?:\s+(?:on|next|this|tomorrow|today|in|with|and|i|fastest|cheapest|best|book|please)\b|$)/i
    ];

    let origin = "";
    let destination = "";

    for (const pattern of routePatterns) {
      const match = clean.match(pattern);
      if (match) {
        if (match.length === 3) {
          origin = this.tidyPlace(match[1]);
          destination = this.tidyPlace(match[2]);
        } else {
          origin = this.originFromHomeAirport(preferences.homeAirport);
          destination = this.tidyPlace(match[1]);
        }
        break;
      }
    }

    const dateHint =
      clean.match(/\b(today|tomorrow|next\s+\w+|this\s+weekend|next\s+week|in\s+\d+\s+days?)\b/i)?.[0] ||
      "flexible dates";

    return {
      origin,
      destination,
      originAirport: this.airportFor(origin, preferences.homeAirport),
      destinationAirport: this.airportFor(destination),
      dateHint,
      priority: this.extractPriority(clean, preferences.priority),
      seat: this.extractSeat(clean, preferences.seat),
      cabin: this.extractCabin(clean, preferences.cabin),
      meal: /vegetarian/i.test(clean) ? "Vegetarian meal" : "Standard meal",
      baggage: /carry-on only|carry on only/i.test(clean) ? "Carry-on only" : "Standard baggage"
    };
  }

  tidyPlace(value) {
    return value
      .trim()
      .replace(/\b(i want|i need|book me|fly|travel|go|from|please|can you)\b/gi, "")
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

  airportFor(place, fallback = "") {
    const key = place.toLowerCase().split(" ")[0];
    return europeanAirports[key] || fallback || `${place} airport`;
  }

  extractPriority(clean, fallback) {
    if (/fastest/i.test(clean)) return "Fastest";
    if (/cheapest|low(?:est)? price|budget/i.test(clean)) return "Cheapest";
    if (/fewest stops|direct|nonstop/i.test(clean)) return "Fewest stops";
    if (/best|balance/i.test(clean)) return "Best balance";
    return fallback;
  }

  extractSeat(clean, fallback) {
    if (/aisle/i.test(clean)) return "Aisle";
    if (/extra legroom|leg space|legroom/i.test(clean)) return "Extra legroom";
    if (/window/i.test(clean)) return "Window";
    return fallback;
  }

  extractCabin(clean, fallback) {
    if (/business/i.test(clean)) return "Business";
    if (/premium economy/i.test(clean)) return "Premium economy";
    if (/economy/i.test(clean)) return "Economy";
    return fallback;
  }

  makeFlightOptions(trip) {
    const routeSeed = (trip.origin.length + trip.destination.length) * 17;
    const base = 950 + routeSeed * 9;
    const longHaul = trip.origin.length + trip.destination.length > 18 ? 1600 : 700;
    const cabinMultiplier = trip.cabin === "Business" ? 3.4 : trip.cabin === "Premium economy" ? 1.7 : 1;
    const seatFee = trip.seat === "Extra legroom" ? 420 : trip.seat === "Window" || trip.seat === "Aisle" ? 120 : 0;

    return [
      {
        id: "cheapest",
        label: "Cheapest",
        airline: airlines[routeSeed % airlines.length],
        depart: "07:35",
        arrive: "21:10",
        stops: "1 stop",
        duration: "12h 35m",
        fit: `Lowest fare - ${trip.originAirport} to ${trip.destinationAirport}`,
        price: Math.round((base + longHaul + seatFee) * cabinMultiplier)
      },
      {
        id: "fastest",
        label: "Fastest",
        airline: airlines[(routeSeed + 2) % airlines.length],
        depart: "10:15",
        arrive: "19:40",
        stops: "Nonstop",
        duration: "9h 25m",
        fit: `Shortest time - ${trip.originAirport} to ${trip.destinationAirport}`,
        price: Math.round((base + longHaul + 180 + seatFee) * cabinMultiplier)
      },
      {
        id: "best",
        label: "Best fit",
        airline: airlines[(routeSeed + 4) % airlines.length],
        depart: "13:20",
        arrive: "23:05",
        stops: "1 short stop",
        duration: "10h 45m",
        fit: `Best balance - ${trip.originAirport} to ${trip.destinationAirport}`,
        price: Math.round((base + longHaul + 95 + seatFee) * cabinMultiplier)
      }
    ].sort((a, b) => this.rankOption(a, trip.priority) - this.rankOption(b, trip.priority));
  }

  rankOption(option, priority) {
    if (priority === "Cheapest") return option.id === "cheapest" ? 0 : option.price;
    if (priority === "Fastest") return option.id === "fastest" ? 0 : option.price;
    if (priority === "Fewest stops") return option.stops === "Nonstop" ? 0 : 1;
    return option.id === "best" ? 0 : option.price;
  }
}
