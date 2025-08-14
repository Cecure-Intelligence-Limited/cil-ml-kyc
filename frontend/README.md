# KYC Verification Frontend 🚀

A modern, responsive frontend for a **Know Your Customer (KYC)** verification flow.  
Built with **Next.js 13+ (App Router)**, **TypeScript**, and **Tailwind CSS**, this application delivers a smooth and guided process.

---

## ✨ Features

- **Step-by-Step Wizard** – Guided, multi-step verification flow for clarity and ease of use.
- **ID Document Upload** – Clean, intuitive interface for submitting identity documents.
- **Liveness Check Screen** – Uses the device’s camera to capture live images (currently a frontend simulation).
- **Component-Based Architecture** – Clean, reusable, and scalable components.
- **Responsive Design** – Optimized for both desktop and mobile devices.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 13+ (App Router)](https://nextjs.org/docs/app)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Context API
- **Icons:** Google Material Symbols

---

## 🏁 Getting Started

Follow these steps to set up the project locally for development or testing.

### Prerequisites

- Node.js **v18+** (recommended)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repository-url>
   cd <your-repository-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

---

## 🖥 Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.  
The page will auto-update as you edit code.

---

## 🤝 Collaboration Guidelines

We follow these practices for smooth teamwork and high code quality.

### Git Workflow

- **Branching:** Create feature branches; never push directly to `main` or `dev`.
  - Format: `feature/<your-name>/<short-description>`  
    Example: `feature/bola/liveness-ui-update`
- **Pull Requests:** Merge all changes into **`dev`** via a PR.
  - `main` is for production; `dev` is staging.
- **Descriptions:** Clearly explain the "what" and "why" in PRs.

### Code Quality

- Run lint checks before PRs:
  ```bash
  npm run lint
  ```
- Follow the existing project structure.
- Discuss before adding new npm packages.

---

## 📂 Project Structure

```
src/
├── app/           # App Router pages and global layout
├── components/    # Reusable components
│   ├── screens/   # Step-by-step KYC flow screens
│   └── ui/        # UI elements (icons, loaders, etc.)
├── context/       # Global state management (React Context)
├── hooks/         # Custom hooks
├── services/      # API calls and client logic
└── types/         # TypeScript type definitions
public/            # Static assets
```
