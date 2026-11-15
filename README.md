# Zubix WiFi customer portal

The page customers see after joining the Wi-Fi. They pick a pass, pay with mobile money (or enter a voucher), and get connected. English and Swahili, built for phones first.

## Run

```
npm install
npm run dev
```

It opens on http://localhost:5174 and proxies `/api` to the API on port 4000. Start `zubix-api` first.

To try the Omada sign-in details locally, open:

```
http://localhost:5174/?clientMac=AA-BB-CC-DD-EE-FF&apMac=11-22-33-44-55-66&ssidName=Zubix-Guest&radioId=0
```

## What it does

- `/` lists the passes on sale. The cheapest per hour is marked Best value.
- `/buy/:id` takes a phone number and sends a payment request.
- `/pay/:reference` waits for the customer to approve on their phone, checking every 3 seconds, and handles success, failure, expiry and a 5 minute give-up with the reference to show staff.
- `/voucher` redeems a printed voucher code.
- On success it asks the API to let the phone onto the Wi-Fi, using the device details the Omada controller put in the address.

In test mode (the mock payment provider, never available in production) the waiting screen shows Approve and Decline buttons so you can walk the whole flow without a real prompt.

## Production notes

- Build with `npm run build` and serve the `dist` folder. Fonts are bundled, so nothing is fetched from outside, which matters because customers can only reach allowed hosts before they are online.
- Add the portal host and the API host to the controller's walled garden (pre-authentication access list), or the page will not load for new customers.
- Set the controller's External Portal URL to the portal's address. Set `VITE_API_BASE_URL` only if the API is on a different origin.
- Serve it over HTTPS if you can. Some phones' sign-in browsers restrict plain HTTP pages.
- Each pass lets the number of devices set on the package. A second device is refused with a clear message.

## Not done yet

- Customers cannot look up an existing pass by phone number. It would expose purchase history to anyone who knows a number, so it needs an SMS code first.
- No automated browser tests. The flow was walked by hand against a stand-in API.
