# Rail QR System - Backend API

A Node.js backend API for the Rail QR System using Express.js and MongoDB.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Item Management**: Create, read, update, and delete items with QR codes
- **QR Code Generation**: Automatic QR code generation for items
- **Scan Logging**: Track QR code scans with location data
- **NoSQL Database**: MongoDB with Mongoose ODM
- **Input Validation**: Joi-based request validation
- **Security**: Helmet, CORS, rate limiting, and password hashing

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **QR Code Generation**: qrcode
- **Security**: helmet, cors, express-rate-limit

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `config.env` and update the values:
   ```bash
   cp config.env .env
   ```

3. **Start MongoDB**:
   Make sure MongoDB is running on your system or use MongoDB Atlas.

4. **Run the application**:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/railqr

# JWT
SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=8000
NODE_ENV=development

# Frontend URL
BASE_URL=http://localhost:5173

# QR Code
QR_CODE_DIR=./qrcodes
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Items
- `POST /api/items/create` - Create new item (requires auth)
- `GET /api/items/by-token/:token` - Get item by token (requires auth)
- `GET /api/items/list` - List all items (admin only)
- `PUT /api/items/:id` - Update item (requires auth)
- `DELETE /api/items/:id` - Delete item (admin only)
- `POST /api/items/scan/:token` - Log QR scan (requires auth)
- `GET /api/items/:id/scans` - Get scan history (requires auth)

### Health Check
- `GET /api/health` - API health status

## Database Schema

### User
```javascript
{
  username: String (unique, required),
  password: String (hashed, required),
  fullName: String,
  role: String (enum: ['worker', 'admin'], default: 'worker'),
  createdAt: Date,
  updatedAt: Date
}
```

### Item
```javascript
{
  uuidToken: String (unique, required),
  itemType: String (required),
  vendor: String,
  lotNumber: String,
  dateOfSupply: Date,
  warrantyMonths: Number,
  geoLat: Number,
  geoLng: Number,
  dynamicData: Object,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### QRScanLog
```javascript
{
  itemId: ObjectId (ref: Item, required),
  scannedBy: ObjectId (ref: User, required),
  location: String,
  scannedAt: Date
}
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All API responses follow this format:

```javascript
{
  success: boolean,
  message: string,
  data?: any,
  errors?: string[]
}
```

## Development

- **Linting**: ESLint configuration included
- **Hot Reload**: Nodemon for development
- **Logging**: Morgan for HTTP request logging
- **Error Handling**: Global error handler with proper HTTP status codes

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet for security headers
- Input validation with Joi
- SQL injection protection (NoSQL)

## QR Code Generation

QR codes are automatically generated when items are created and saved to the `qrcodes` directory. The QR code contains a URL that points to the frontend scan page.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC
