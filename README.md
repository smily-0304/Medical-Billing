# Medical Billing System

MERN stack application for hospital invoice management with GST and insurance support.

## Features

- **Generate invoices** — Create bills with multiple line items
- **Insurance details** — Provider, policy number, coverage % and claim status
- **Payment status** — Track pending, partial, paid, and overdue
- **GST calculation** — Automatic 18% GST on subtotal (configurable)
- **Receipt generation** — Printable receipt with full breakdown

## Tech Stack

- **MongoDB** — Invoice storage
- **Express.js** — REST API
- **React + Vite** — Frontend UI
- **Node.js** — Backend runtime

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas connection string

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed    # Load sample invoices
npm run dev     # Runs on http://localhost:5002
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # Runs on http://localhost:3002
```

Open http://localhost:3002 in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices (`?paymentStatus=paid&search=rahul`) |
| POST | `/api/invoices` | Create invoice |
| POST | `/api/invoices/preview` | Preview GST calculation |
| GET | `/api/invoices/:id` | Get invoice by ID |
| GET | `/api/invoices/:id/receipt` | Generate receipt data |
| PATCH | `/api/invoices/:id/payment` | Update payment status |

## Deployment

### Backend (Render)

1. Create a new Web Service on Render.
2. Connect the repository and choose the `main` branch.
3. Set build and start commands:
   - Build command: `npm install`
   - Start command: `npm start`
4. Set environment variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `PORT` = `5002` (optional; Render provides its own port automatically)
5. Deploy the service. Copy the service URL after deployment, for example `https://your-app.onrender.com`.

### Frontend (Vercel)

1. Create a new project on Vercel and connect the same repository.
2. Use the `frontend` folder as the root of the project.
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add an environment variable in Vercel:
   - `VITE_API_BASE_URL` = `https://your-app.onrender.com`
6. Deploy the frontend.

> When Vercel builds the frontend, it will embed `VITE_API_BASE_URL` into the app so API requests go to your Render backend.

## GST Logic

```
Subtotal = sum(item.quantity × item.unitPrice)
GST Amount = Subtotal × GST_RATE / 100
Total = Subtotal + GST Amount
Insurance Covered = Total × Coverage% / 100
Patient Payable = Total - Insurance Covered
```

Default GST rate: **18%** (set via `GST_RATE` in `.env`).
