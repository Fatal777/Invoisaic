# Backend API Connections for Demos

## Demo 1: E-commerce Demo (`/demo/ecommerce`)

**Endpoint:** `POST /autonomous-agent`

**Request Body:**
```json
{
  "event": "order.created",
  "platform": "demo",
  "data": {
    "order_id": "ORD-1234567890",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91 1234567890"
    },
    "items": [
      {
        "id": "prod-1",
        "name": "MacBook Pro",
        "price": 3499,
        "quantity": 1
      }
    ],
    "total": 4128.82
  }
}
```

**Response:**
```json
{
  "success": true,
  "invoiceNumber": "INV-1234567890",
  "invoiceDate": "2025-01-04",
  "orderId": "ORD-1234567890",
  "customer": { ... },
  "items": [ ... ],
  "subtotal": 3499,
  "tax": 629.82,
  "total": 4128.82,
  "pdfUrl": "https://example.com/invoice.pdf"
}
```

**Backend Handler:** Already implemented in `backend/src/lambda/autonomousAgentHandler.ts`

---

## Demo 2: OCR Demo (`/demo/ocr`)

**Endpoint:** `POST /textract/process`

**Request:** FormData with file

**Response:**
```json
{
  "success": true,
  "confidence": 99.8,
  "extractedData": {
    "invoice_number": "INV-001234",
    "date": "2025-01-04",
    "vendor": "Tech Solutions LLC",
    "total_amount": "5234.00",
    "tax": "942.12",
    "items_count": "12"
  },
  "processingTime": 4.2
}
```

**Backend Handler:** `backend/src/lambda/textractHandler.ts`

---

## Demo 3: Onboarding Demo (`/demo/onboarding`)

**Endpoint:** `POST /features/bulk-generate`

**Request Body:**
```json
{
  "company": {
    "name": "My Company",
    "gstin": "29ABCDE1234F1Z5",
    "address": "123 Street",
    "email": "company@example.com",
    "phone": "+91 1234567890"
  },
  "customer": {
    "name": "Customer Name"
  },
  "items": [
    {
      "description": "Software License",
      "hsn": "998314",
      "quantity": 1,
      "rate": 50000,
      "gst": 18
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "invoices": [
    {
      "invoiceNumber": "INV-1234",
      "pdfUrl": "https://..."
    }
  ]
}
```

**Backend Handler:** `backend/src/lambda/featuresHandler.ts`

---

## Demo 4: Agents Demo (`/demo/agents`)

**Endpoint:** `POST /textract/process` (for file upload)

Same as Demo 2, just displays processing in terminal style.

---

## Environment Variables Needed

In `frontend/.env`:
```
VITE_API_URL=https://cfsfx25go8.execute-api.ap-south-1.amazonaws.com/prod
VITE_AGENT_STATUS_URL=https://rdfltllvaskaxsbhd4eefpshvi0tthtz.lambda-url.ap-south-1.on.aws
VITE_ARCHITECTURE_URL=https://ymlbkh3ieeetxlqv4g73efbauu0ibhuw.lambda-url.ap-south-1.on.aws
```

---

## Current Status

✅ **Backend handlers already exist:**
- `autonomousAgentHandler.ts` - handles e-commerce orders
- `textractHandler.ts` - handles OCR
- `featuresHandler.ts` - handles invoice generation

✅ **Backend is deployed and live**

✅ **All demos just need to call these endpoints**

---

## Example API Call (JavaScript)

```javascript
const apiUrl = import.meta.env.VITE_API_URL;

const response = await fetch(`${apiUrl}/autonomous-agent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'order.created',
    data: { /* your data */ }
  })
});

const result = await response.json();
console.log(result);
```
