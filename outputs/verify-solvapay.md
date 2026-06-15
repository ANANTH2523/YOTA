# YOTA SolvaPay Verification

Run the app first:

```bash
npm run start
```

Status and setup:

```bash
curl -i http://localhost:5188/api/solvapay/status
curl -i -X POST http://localhost:5188/api/solvapay/setup
curl -i http://localhost:5188/api/solvapay/status
```

Failure path: checkout without a valid email must stay blocked.

```bash
curl -i -X POST http://localhost:5188/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email":"","travelerName":"Freja Andersson"}'
```

Checkout path after setup: returns a SolvaPay `checkoutUrl` when the account has a valid product and plan.

```bash
curl -i -X POST http://localhost:5188/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"email":"freja.andersson@example.se","travelerName":"Freja Andersson","trip":{"origin":"Stockholm","destination":"Tokyo"},"option":{"price":12044}}'
```
