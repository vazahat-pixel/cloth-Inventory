# Clothing ERP Backend Documentation

## 1. MongoDB Schemas

### Group Schema (`models/group.model.js`)
Recursive schema for unlimited nesting.
```javascript
{
  name: String,
  parentId: ObjectId (ref: Group),
  level: Number,
  type: String (enum: fabric/type/design/vendor/etc.)
}
```

### Item Schema (`models/item.model.js`)
Supports dynamic attributes and multi-size pricing matrix.
```javascript
{
  itemCode: String (Unique),
  name: String,
  brand: String,
  shade: String,
  description: String,
  groupIds: [ObjectId],
  attributes: Mixed, // Dynamic fields
  sizes: [
    {
      size: String,
      basicRate: Number,
      saleRate: Number,
      mrp: Number
    }
  ],
  hsCode: String,
  gst: Number,
  vendor: String,
  session: String
}
```

## 2. API Endpoints

### Groups
- `POST /api/groups`: Create a new group.
- `GET /api/groups/tree`: Get recursive tree structure (Unlimited nesting).

### Items
- `POST /api/items`: Create a new item (validates group and at least one size).
- `GET /api/items`: List items with filters (brand, vendor, session, etc.).
- `POST /items/:id/allocate-group`: Assign multiple groups (prevents duplicates).

### Import
- `POST /api/import/items`: Bulk import via Excel. Supports field mapping and auto-barcode.

---

## 3. Sample JSON Payloads

### Create Group
```json
{
  "name": "Men's Wear",
  "type": "category"
}
```

### Create Sub-Group (Recursive)
```json
{
  "name": "Shirts",
  "parentId": "60d0fe4f5311236168a109ca",
  "type": "type"
}
```

### Create Item (with Dynamic Attributes & Size Matrix)
```json
{
  "itemCode": "SHIRT-001",
  "name": "Classic White Shirt",
  "brand": "Polo",
  "shade": "White",
  "groupIds": ["60d0fe4f5311236168a109ca"],
  "attributes": {
    "fabric": "COTTON",
    "design": "CASUAL",
    "fabricType": "PRINT",
    "sleeve": "FULL"
  },
  "sizes": [
    { "size": "M", "basicRate": 500, "saleRate": 800, "mrp": 1200 },
    { "size": "L", "basicRate": 550, "saleRate": 850, "mrp": 1300 }
  ],
  "hsCode": "6105",
  "gst": 12,
  "vendor": "Textile Corp",
  "session": "Spring 2026"
}
```

### Group Allocation (POST /api/items/:id/allocate-group)
```json
{
  "groupIds": ["60d0fe4f5311236168a109cb", "60d0fe4f5311236168a109cc"]
}
```

### Excel Import Mapping Example
Send as multipart form data:
- `file`: (The Excel File)
- `autoBarcode`: "true"
- `mapping`:
```json
{
  "Item Code": "itemCode",
  "Name": "name",
  "Basic Rate": "basicRate",
  "Sale Rate": "saleRate",
  "MRP": "mrp",
  "Size": "size",
  "attributes.fabric": "Fabric",
  "attributes.design": "Design"
}
```
