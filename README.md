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
- [React 19](https://reactjs.org/) + TypeScript – UI library
- [Tailwind CSS v4](https://tailwindcss.com/) – Utility-first CSS
- [lucide-react](https://lucide.dev/) – Icons
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) – Unit/component tests
- ESLint + typescript-eslint – Linting

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
npm run test        # run the test suite once
npm run test:watch  # watch mode
npm run coverage    # run tests with coverage
npm run lint        # lint the codebase
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
│   │                     # UpdateCollectionStatus, Json2SepaPain008, PaymentSchedule2Refund, ...
│   ├── ui.ts              # Shared Tailwind utility-class constants
│   ├── App.tsx            # Tab navigation + tool registry
│   ├── index.css          # Tailwind v4 theme (design tokens)
│   └── main.tsx
├── tests/
│   └── tools/            # One test suite per tool
├── index.html
└── vite.config.ts
```

---

## 📄 License

MIT License © Guilherme Branco Stracini

---

## 🙌 Contributions

Feel free to open issues or submit pull requests! Suggestions and improvements are always welcome.
