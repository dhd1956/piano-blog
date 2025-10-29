# Venue API - Postman Testing Guide

## Base URL

```
http://localhost:3000
```

## Endpoints

### 1. GET /api/venues - List All Venues

**Method**: GET
**URL**: `http://localhost:3000/api/venues`

**Query Parameters** (all optional):

- `city` - Filter by city name
- `hasPiano` - Filter by piano availability (true/false)
- `verified` - Filter by verification status (true/false)
- `search` - Search in venue name and description
- `limit` - Results per page (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)
- `orderBy` - Sort field: name, rating, createdAt (default: createdAt)
- `orderDirection` - Sort direction: asc, desc (default: desc)

**Example Request**:

```bash
GET http://localhost:3000/api/venues?city=Toronto&hasPiano=true&limit=10
```

**Response**: 200 OK

```json
{
  "success": true,
  "venues": [...],
  "totalCount": 14,
  "hasMore": false,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "currentPage": 1,
    "totalPages": 1
  },
  "timestamp": "2025-10-29T16:40:17.272Z"
}
```

---

### 2. POST /api/venues - Create New Venue

**Method**: POST
**URL**: `http://localhost:3000/api/venues`
**Headers**:

```
Content-Type: application/json
```

**Required Fields**:

- `name` (string) - Venue name
- `city` (string) - City name
- `submittedBy` (string) - Wallet address (Ethereum format: 0x...)
- At least ONE contact method: `contactInfo`, `email`, `phone`, or `website`

**Optional Fields**:

- `contactInfo` (string) - Primary contact information
- `contactType` (string) - Type of contact: email, phone, website (default: email)
- `hasPiano` (boolean) - Has piano available (default: false)
- `hasJamSession` (boolean) - Hosts jam sessions (default: false)
- `venueType` (number) - 0=Cafe, 1=Restaurant, 2=Bar, 3=Club, 4=Community Center (default: 0)
- `description` (string) - Venue description
- `address` or `fullAddress` (string) - Street address
- `phone` (string) - Phone number
- `website` (string) - Website URL
- `amenities` (string[]) - List of amenities
- `tags` (string[]) - List of tags

**Example Request Body**:

```json
{
  "name": "Test Jazz Cafe",
  "city": "Toronto",
  "submittedBy": "0x1234567890123456789012345678901234567890",
  "contactInfo": "jazz@example.com",
  "contactType": "email",
  "hasPiano": true,
  "hasJamSession": true,
  "venueType": 0,
  "description": "A cozy jazz cafe with live piano",
  "address": "123 Main St, Toronto, ON M5V 3A8",
  "phone": "(416) 555-1234",
  "website": "https://testjazzcafe.com",
  "amenities": ["WiFi", "Parking", "Wheelchair Accessible"],
  "tags": ["jazz", "live-music", "piano"]
}
```

**Success Response**: 201 Created

```json
{
  "success": true,
  "venue": {
    "id": 23,
    "slug": "test-jazz-cafe",
    "name": "Test Jazz Cafe",
    "city": "Toronto",
    "contactInfo": "jazz@example.com",
    "contactType": "email",
    "submittedBy": "0x1234567890123456789012345678901234567890",
    "hasPiano": true,
    "hasJamSession": true,
    "verified": false,
    "createdAt": "2025-10-29T16:49:38.641Z",
    ...
  },
  "message": "Venue submitted successfully! It will be reviewed by our curators."
}
```

**Error Responses**:

**400 Bad Request** - Missing required fields:

```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

**400 Bad Request** - Missing contact method:

```json
{
  "success": false,
  "error": "Please provide at least one contact method (email, phone, or website)"
}
```

**409 Conflict** - Duplicate venue:

```json
{
  "success": false,
  "error": "This venue appears to be a duplicate...",
  "errorCode": "DUPLICATE_VENUE"
}
```

---

### 3. GET /api/venues/[id] - Get Single Venue

**Method**: GET
**URL**: `http://localhost:3000/api/venues/22`

**Response**: 200 OK

```json
{
  "venue": {
    "id": 22,
    "name": "the4",
    "city": "Toronto",
    ...
  },
  "timestamp": "2025-10-29T16:40:17.272Z"
}
```

**Error Response**: 404 Not Found

```json
{
  "error": "Venue not found"
}
```

---

### 4. PUT /api/venues/[id] - Update Venue (Curator Only)

**Method**: PUT
**URL**: `http://localhost:3000/api/venues/22?address=YOUR_WALLET_ADDRESS`
**Headers**:

```
Content-Type: application/json
```

**Authentication**: Requires CURATOR or BLOG_OWNER role

- Add wallet address as query parameter: `?address=0xYOUR_WALLET_ADDRESS`
- The wallet must be authorized in the database

**Request Body** (all fields optional, only send what you want to update):

```json
{
  "name": "Updated Venue Name",
  "description": "Updated description",
  "fullAddress": "New address",
  "contactInfo": "new@email.com",
  "phone": "(416) 555-9999",
  "website": "https://newsite.com",
  "hasPiano": true,
  "pianoType": "grand",
  "pianoCondition": "excellent",
  "verified": true,
  "curatorNotes": "Verified in person",
  "curatorRating": 5
}
```

**Success Response**: 200 OK

```json
{
  "venue": { ... },
  "message": "Venue updated successfully."
}
```

**Error Responses**:

**401 Unauthorized**:

```json
{
  "error": "Unauthorized: No wallet address provided"
}
```

**403 Forbidden**:

```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

---

### 5. DELETE /api/venues/[id] - Delete Venue (Blog Owner Only)

**Method**: DELETE
**URL**: `http://localhost:3000/api/venues/22`
**Headers**:

```
x-wallet-address: 0xYOUR_BLOG_OWNER_WALLET_ADDRESS
```

**Authentication**: Requires BLOG_OWNER role only

**Success Response**: 200 OK

```json
{
  "success": true,
  "message": "Venue deleted successfully",
  "deletedVenue": {
    "id": 22,
    "name": "the4"
  }
}
```

**Error Responses**:

**401 Unauthorized**:

```json
{
  "error": "Unauthorized: No wallet address provided"
}
```

**403 Forbidden**:

```json
{
  "error": "Forbidden: Only blog owner can delete venues"
}
```

**404 Not Found**:

```json
{
  "error": "Venue not found"
}
```

---

## Common Issues & Solutions

### Issue: 400 Bad Request on POST /api/venues

**Problem**: Missing required fields or contact information

**Solution**: Ensure your request includes:

1. `name` - The venue name
2. `city` - The city where the venue is located
3. `submittedBy` - A valid Ethereum wallet address (0x...)
4. At least ONE of: `contactInfo`, `email`, `phone`, or `website`

**Minimal Valid Request**:

```json
{
  "name": "My Venue",
  "city": "Toronto",
  "submittedBy": "0x1234567890123456789012345678901234567890",
  "contactInfo": "contact@venue.com"
}
```

### Issue: 401 Unauthorized on PUT/DELETE

**Problem**: Missing authentication

**Solution**:

- For PUT: Add wallet address as query param: `?address=0xYOUR_WALLET`
- For DELETE: Add header: `x-wallet-address: 0xYOUR_WALLET`
- Ensure your wallet is authorized in the database

### Issue: 405 Method Not Allowed

**Problem**: Using wrong HTTP method on endpoint

**Solution**:

- `/api/venues` - Only supports GET and POST
- `/api/venues/[id]` - Only supports GET, PUT, and DELETE

---

## Testing Tips

1. **Start with GET requests** - Verify the server is running
2. **Test POST with minimal fields first** - Then add optional fields
3. **Save venue IDs from responses** - Use them for GET/PUT/DELETE tests
4. **Use environment variables in Postman** - Store base URL and wallet addresses
5. **Check server logs** - Run `yarn dev` and watch for errors in terminal

## Authentication Setup

To test curator/admin endpoints:

1. Get your wallet address from MetaMask
2. Add it to the database with appropriate role
3. Use it in requests as shown above
