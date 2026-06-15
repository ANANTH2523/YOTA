export class PaymentBookingAgent {
  constructor({ startingBalance = 28500 } = {}) {
    this.name = "Payment and bank agent";
    this.startingBalance = startingBalance;
    this.currentBalance = startingBalance;
    this.currentHold = 0;
    this.lastTransaction = null;
  }

  getSnapshot() {
    return {
      balance: this.currentBalance,
      hold: this.currentHold,
      transaction: this.lastTransaction
    };
  }

  bookTrip({ trip, option, email, travelerName }) {
    const transactionId = this.createTransactionId();
    const recipient = email || "freja.andersson@example.se";
    const customer = travelerName || "Freja Andersson";
    const hold = option.price;
    this.currentHold = hold;
    this.currentBalance = this.startingBalance - hold;
    this.lastTransaction = {
      transactionId,
      airline: option.airline,
      route: `${trip.origin} to ${trip.destination}`,
      amount: hold,
      email: recipient,
      travelerName: customer,
      createdAt: new Date().toISOString()
    };

    return {
      transactionId,
      email: recipient,
      hold,
      balance: this.currentBalance,
      ledger: this.createLedger(option, transactionId, recipient),
      messages: [
        {
          text: `I reserved the ${option.label.toLowerCase()} option with ${option.airline} for ${customer}.`,
          detail: `Payment agent authorized a demo SEK hold. Transaction ID: ${transactionId}.`
        },
        {
          text: "I also checked the Swedish spending guard and prepared the confirmation email.",
          detail: `Confirmation and booking details are queued for ${recipient}.`
        }
      ],
      status: this.currentBalance < 3500 ? "Low SEK balance warning" : "Payment and SEK balance check complete"
    };
  }

  createLedger(option, transactionId, email) {
    return [
      {
        title: "Card authorization",
        detail: `${this.formatCurrency(option.price)} held for ${option.airline}`
      },
      {
        title: "Balance check",
        detail:
          this.currentBalance < 3500
            ? "Warning: low remaining SEK balance after booking."
            : "SEK balance impact is within your normal travel budget."
      },
      {
        title: "Email queued",
        detail: `Confirmation and transaction ${transactionId} sent to ${email}.`
      }
    ];
  }

  createTransactionId() {
    return `YOTA-SE-${Math.random().toString(36).slice(2, 7).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(value);
  }
}
