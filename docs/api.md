# API Endpoint Reference

## Endpoints

### 1. Create Inspection
`POST /api/inspections`

**Request Body:**
```json
{
  "orderNumber": "PO-2026-001",
  "sku": "BLUE-BOTTLE-001",
  "productName": "Eco Steel Water Bottle",
  "expectedQuantity": 24,
  "expectedVariant": "Blue",
  "images": [
    {
      "type": "RECEIVING",
      "storageKey": "uploads/1700000-box.jpg",
      "url": "/uploads/1700000-box.jpg"
    }
  ]
}
```

### 2. List Inspections
`GET /api/inspections`

### 3. Get Inspection Details
`GET /api/inspections/:id`

### 4. Run Inspection Pipeline
`POST /api/inspections/:id/inspect`

**Response:**
```json
{
  "success": true,
  "data": {
    "inspectionId": "cmuo3ohhk0000mxmq633o6eam",
    "overallDecision": "PASS",
    "checks": [...]
  }
}
```

### 5. File Upload
`POST /api/uploads` (multipart/form-data with `file` field)

### 6. Quick Scenario Seed
`POST /api/seed` (Optional `{ "scenarioId": "scenario-1-pass" }`)
