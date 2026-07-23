# 💰🧰 Finance Ops Toolbox

An internal **Vite + React** toolbox that bundles a handful of small, focused converters used by Finance Operations to reshape collection, resubmission, refund, and SEPA payment data between the shapes different downstream systems expect. Everything runs client-side — paste or upload JSON, get back the transformed document.

---

## ✨ Features

- **↻ Resubmission:** Transform rejected collection items into resubmission documents.
- **⊞ Shadow Ledger:** Convert Collection Items into Shadow Ledger requests.
- **⇄ Process Collection:** Generate historic and new collection documents for any target status.
- **⌁ SEPA XML:** Convert Direct Debit JSON into SEPA `pain.008.001.08` XML.
- **↩ Refund Schedule:** Generate refund schedule items and collection documents from a payment schedule.

Each tool lives in its own tab, works entirely in the browser, and expects no backend connection.

---

## 🧱 Tech Stack

- [Vite](https://vitejs.dev/) – Frontend build tool
- [React 19](https://reactjs.org/) – UI library
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) – Unit/component tests
- Hand-rolled CSS design system (`src/App.css`) – no CSS framework at runtime

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`; run `nvm use` if you use nvm)

### Installation

```bash
git clone https://github.com/guibranco/finance-ops.git
cd finance-ops
npm install
```

### Run locally

```bash
npm run dev
```

Open the printed local URL (default [http://localhost:5173](http://localhost:5173)) to use the toolbox in your browser.

---

## 🧪 Testing

```bash
npm run test         # watch mode
npm run test:run     # run the test suite once (CI)
npm run test:coverage # run tests with coverage
```

---

## 📦 Build for Production

```bash
npm run build
```

The static site will be available in the `dist/` folder. Preview it locally with `npm run preview`.

---

## 📂 Folder Structure

```
finance-ops/
├── public/
├── src/
│   ├── components/
│   │   └── tools/       # CollectionItem2ResubmissionItem, CollectionItem2ShadowLedger,
│   │                     # UpdateCollectionStatus, Json2SepaPain008, PaymentSchedule2Refund
│   ├── App.jsx           # Tab navigation + tool registry
│   ├── App.css           # Design system / styling
│   └── main.jsx
├── tests/
│   └── tools/            # One test suite per tool
├── index.html
└── vite.config.js
```

---

## 📄 License

MIT License © Guilherme Branco Stracini

---

## 🙌 Contributions

Feel free to open issues or submit pull requests! Suggestions and improvements are always welcome.
