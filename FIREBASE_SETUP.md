# SmartPOS — Firebase Setup & Deployment Guide

A modern, full-stack Point of Sale system built with React + Vite + Tailwind CSS and powered by Firebase.

## 🔥 Firebase Configuration

The app is preconfigured with the following Firebase project (in `src/firebase.ts`):

```js
const firebaseConfig = {
  apiKey: "AIzaSyA5aqIQNLAEuSWm5kaPNR7OiFTUQ66AOtI",
  authDomain: "juice-app-d5be7.firebaseapp.com",
  databaseURL: "https://juice-app-d5be7-default-rtdb.firebaseio.com",
  projectId: "juice-app-d5be7",
  storageBucket: "juice-app-d5be7.firebasestorage.app",
  messagingSenderId: "767495141095",
  appId: "1:767495141095:web:1b0bcc822e3144a0a69442",
  measurementId: "G-GJG4BWDF1M"
};
```

## 🔑 Enable Firebase Services

In the [Firebase Console](https://console.firebase.google.com/), open the project and enable:

1. **Authentication** → Sign-in method → **Email/Password** (enable).
2. **Cloud Firestore** → Create database → Production mode → Choose location.
3. **Storage** → Get started → Production mode.
4. **(Optional) Hosting** if you want to deploy with `firebase deploy`.

## 🗄️ Firestore Collection Schema

| Collection        | Purpose                                                   |
|-------------------|-----------------------------------------------------------|
| `users`           | User profile docs keyed by Firebase Auth UID. Fields: `name, email, role ("admin" | "cashier"), active, createdAt` |
| `products`        | `name, category, price, cost, stock, barcode, image, lowStockAt, status` |
| `categories`      | `name` |
| `orders`          | Full sale snapshots: `orderNo, items[], subtotal, discount, tax, total, payment, customerId, customerName, cashierId, cashierName, createdAt` |
| `customers`       | `name, phone, email, loyaltyPoints, totalSpent, visits, createdAt` |
| `suppliers`       | `name, phone, email, notes` |
| `purchases`       | Purchase entries / restock: `productId, productName, supplierId, supplierName, qty, cost, createdAt` |
| `inventory`       | Stock movement history: `productId, productName, type ("sale"|"purchase"), change, orderNo, createdAt` |
| `activity_logs`   | `userId, userName, action, meta, createdAt` |
| `settings`        | Single doc `settings/store` with store config |

The **first user** to sign up is automatically promoted to **admin**. Subsequent users created via the Employees page get the role you choose.

## 🛡️ Recommended Firestore Security Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function isAdmin() { return isSignedIn() && userRole() == 'admin'; }
    function isStaff() { return isSignedIn() && (userRole() == 'admin' || userRole() == 'cashier'); }

    // Users — admins manage everything, users can read their own profile
    match /users/{uid} {
      allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if request.auth.uid == uid; // first-login self-create
      allow update, delete: if isAdmin();
    }

    // Products / Categories — staff can read, admin can write
    match /products/{id}   { allow read: if isStaff(); allow write: if isAdmin() || (isStaff() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stock','status'])); }
    match /categories/{id} { allow read: if isStaff(); allow write: if isAdmin(); }
    match /suppliers/{id}  { allow read, write: if isAdmin(); }
    match /purchases/{id}  { allow read, write: if isAdmin(); }
    match /inventory/{id}  { allow read: if isStaff(); allow create: if isStaff(); allow update, delete: if isAdmin(); }

    // Orders & Customers — both roles can create / read
    match /orders/{id}    { allow read, create: if isStaff(); allow update, delete: if isAdmin(); }
    match /customers/{id} { allow read, create, update: if isStaff(); allow delete: if isAdmin(); }
    match /activity_logs/{id} { allow read: if isAdmin(); allow create: if isStaff(); }
    match /settings/{id}  { allow read: if isStaff(); allow write: if isAdmin(); }
  }
}
```

## 🛡️ Recommended Storage Rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{file=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🚀 Run & Build

```bash
npm install
npm run dev          # local dev server
npm run build        # production build → dist/
npm run preview      # preview built output
```

## 🌐 Deploy to Firebase Hosting

```bash
npm i -g firebase-tools
firebase login
firebase init hosting   # choose existing project, public dir: dist, SPA: yes
npm run build
firebase deploy --only hosting
```

## ⌨️ Keyboard Shortcuts (POS)

| Key | Action |
|----|--------|
| `F2` | Focus search bar |
| `F4` / `F5` / `F6` | Switch payment: Cash / Card / UPI |
| `F9` | Complete sale |
| `Esc` | Clear cart |
| `Enter` (in search) | Add scanned barcode or first matching product |

## 🧱 Tech & Folder Structure

```
src/
├── App.tsx                # Root + hash-based routing
├── firebase.ts            # Firebase init
├── types.ts               # Shared TS types
├── index.css              # Tailwind + animations + print styles
├── components/
│   ├── Layout.tsx         # Sidebar + topbar
│   ├── ui.tsx             # Reusable UI primitives
│   └── icons.tsx          # Inline SVG icon set
├── contexts/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ToastContext.tsx
├── lib/helpers.ts
└── pages/
    ├── Login.tsx
    ├── Dashboard.tsx
    ├── POS.tsx
    ├── Orders.tsx
    ├── Products.tsx
    ├── Customers.tsx
    ├── Employees.tsx
    ├── Inventory.tsx
    ├── Reports.tsx
    └── Settings.tsx
```

## ✨ Feature Highlights

- Role-based auth (admin / cashier) with secure protected routes
- Real-time Firestore sync via `onSnapshot`
- Atomic stock-update transactions on checkout
- Auto loyalty points (1 pt per ₹10 spent)
- Barcode-friendly product search (Enter to add)
- Printable invoice with dedicated print CSS
- CSV + printable PDF reports with date filters
- Dark / light mode with system preference detection
- Mobile-responsive sidebar
- Full JSON backup of all collections
- Inventory history, low-stock alerts, supplier & purchase tracking
