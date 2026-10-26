# TripSplit ✈️💸

**TripSplit** is a modern, responsive, offline-first group travel expense and debt settlement tracker. Designed for road trips, weekend getaways, group vacations, and shared household living, TripSplit takes the stress out of splitting group costs.

---

## ✨ Features

- **Multi-Trip Management**  
  Create, organize, and manage multiple trips with custom destinations, dates, descriptions, and member rosters.

- **Expense Tracking & Smart Splitting**  
  Log expenses with custom categories, payers, and flexible beneficiary selections with real-time per-person split preview.

- **Automated Debt Simplification (Minimum Cash Flow)**  
  Proprietary greedy debt simplification algorithm calculates net balances and minimizes total peer-to-peer transactions required to settle up completely.

- **Interactive Analytics & Visualizations**  
  Rich visual overview featuring 6 key financial metric cards and interactive category distribution donut charts powered by Recharts.

- **Member Detail & Pairwise Debt Offsets**  
  Inspect individual financial profiles, viewing exact amounts paid, fair share, net balance, and direct pairwise debtor/creditor offsets.

- **Custom Expense Categories**  
  Add, edit, and organize custom trip categories with distinct color badges alongside built-in categories (Food, Stay, Travel, Tickets, Shopping, etc.).

- **Printable Financial Reports & Data Export**  
  Comprehensive trip summary breakdown with printable expense receipts, transaction tables, CSV spreadsheet export, and quick text copy for group chats.

- **Offline-First Local Storage & Revisions**  
  Instant persistence via browser `localStorage` with built-in revision tracking, preventing data loss without requiring external database setup.

- **Data Backup & Restore**  
  Export all trip data to a portable JSON backup file and restore anytime with merge or overwrite support.

- **Fully Responsive Design**  
  Tailored layouts for phones (320px+), tablets, laptops, and 4K displays with iOS safe-area notch support and touch-friendly controls.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite, Oxlint
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Data Visualization**: Recharts
- **Celebration Effects**: Canvas Confetti
- **Testing**: Vitest unit testing suite (100% pass rate on calculation engine and storage)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/joyelshajii/TripSplit.git

# Navigate into the project folder
cd TripSplit

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### Running Tests

```bash
# Run unit test suite
npm run test
```

### Building for Production

```bash
# Compile TypeScript and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📐 Settlement Algorithm

TripSplit implements a greedy minimum cash flow algorithm to resolve group debts:
1. Calculates each participant's **net balance** (`total paid - total share owed`).
2. Separates participants into **creditors** (net positive) and **debtors** (net negative).
3. Successively matches the largest debtor with the largest creditor, transferring `min(|debtor balance|, |creditor balance|)`.
4. Continues iteratively until all balances reach zero, eliminating unnecessary cyclical money transfers.

---

## 📄 License

MIT License. Designed and developed with ❤️ for hassle-free group travel.
