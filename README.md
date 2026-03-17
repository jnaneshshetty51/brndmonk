# Brnd Monk — Quote & Invoice App

A professional mobile app for **ASTRAVEDA / Brnd Monk** to create, manage, and share quotations and invoices with clients. Built with React Native (Expo).

---

## Features

### Quotes
- Create multi-service proposals with pricing tiers and durations
- Auto-calculated subtotal, GST (IGST / CGST+SGST), and discounts
- Track quote status: **Draft → Sent → Won / Lost**
- Export as a branded multi-page PDF (cover page, services, deliverables, pricing, T&C, signatures)
- Share directly via WhatsApp

### Invoices
- Line-item invoices with SAC codes, per-item discounts, and units
- TDS deduction support
- Payment tracking: record partial / full payments
- Track invoice status: **Draft → Sent → Viewed → Paid / Partial / Overdue**
- Export as PDF and share via WhatsApp

### Clients
- Save client profiles (name, company, address, GST, PAN, phone)
- Reuse across quotes and invoices

### Settings
- Configure business details (name, address, GST, UPI, bank details)
- Multi-currency support: INR, USD, AED, GBP, EUR
- Default payment terms and T&C

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5 + React 19 |
| Platform | Expo ~54 |
| Navigation | React Navigation (Bottom Tabs + Stack) |
| State | Context API + useReducer |
| Database | Firebase Firestore |
| PDF Export | expo-print + expo-sharing |
| Fonts | Inter (Google Fonts) |
| Icons | Ionicons |

---

## Project Structure

```
src/
├── components/
│   ├── common/        # Badge, Card, GradientButton, Input, StepIndicator
│   ├── quote/         # Quote-specific UI components
│   └── invoice/       # Invoice-specific UI components
├── screens/
│   ├── HomeScreen.js
│   ├── ClientsScreen.js
│   ├── SettingsScreen.js
│   ├── quote/         # QuoteListScreen, CreateQuoteScreen, QuotePreviewScreen
│   └── invoice/       # InvoiceListScreen, CreateInvoiceScreen, InvoicePreviewScreen
├── navigation/        # AppNavigator.js
├── context/           # AppContext.js — global state + Firebase sync
├── firebase/          # quotes.js, invoices.js, clients.js
├── utils/             # formatters, pricing, pdfGenerator, whatsapp
└── constants/         # theme.js, defaults.js, services.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator or the Expo Go app

### Install

```bash
git clone https://github.com/jnaneshshetty51/brndmonk-quote.git
cd brndmonk-quote
npm install
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Cloud Firestore**
3. Copy your Firebase config into `firebase.js`

### Run

```bash
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) or press `i` / `a` to open in a simulator.

---

## PDF Output

Quotations generate a **4-page branded PDF**:
1. Cover page (dark, gold-accented)
2. About + Services table
3. Deliverables + Timeline
4. Pricing breakdown + T&C + Signatures

Invoices generate a **single-page PDF** with line items, tax breakdown, bank details, and payment terms.

---

## Development Scripts

```bash
npm run android   # Launch on Android emulator/device
npm run ios       # Launch on iOS simulator/device
npm run web       # Launch in browser
```

---

## Brand

Built for **Brnd Monk**, the digital growth brand of **ASTRAVEDA**
Udyam: UDYAM-KR-26-0057710 | Udupi, Karnataka

Developed by [Jnanesh Shetty](https://github.com/jnaneshshetty51)

---

## License

Private — All rights reserved © ASTRAVEDA
