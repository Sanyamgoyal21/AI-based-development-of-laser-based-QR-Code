# Rail QR System

A comprehensive QR code management system for railway infrastructure, built with Node.js, MongoDB, and React.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <your-repo-url>
   cd rail-qr-system
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api
   - Default admin login: `admin` / `admin123`

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+ 
- MongoDB 7.0+
- npm or yarn

#### Backend Setup
```bash
cd backend
npm install
cp config.env .env
# Edit .env with your MongoDB connection string
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Node.js Backend │    │   MongoDB DB    │
│   (Port 5173)   │◄──►│   (Port 8000)   │◄──►│   (Port 27017)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Features

### 🔐 Authentication
- JWT-based authentication
- Role-based access control (Worker/Admin)
- Secure password hashing with bcryptjs

### 📦 Item Management
- Create items with QR codes
- Automatic QR code generation
- GPS location tracking
- Item metadata storage

### 📊 Admin Dashboard
- View all items
- Search and filter functionality
- Pagination support
- Scan history tracking

### 📱 QR Code Scanning
- Mobile-friendly scan interface
- Real-time item details
- Scan event logging
- Location tracking

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **QR Generation**: qrcode
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Build Tool**: Vite

### Database
- **Primary**: MongoDB (NoSQL)
- **ODM**: Mongoose
- **Collections**: Users, Items, QRScanLogs

## 📁 Project Structure

```
rail-qr-system/
├── backend/                 # Node.js API server
│   ├── app.js              # Main Express application
│   ├── database.js         # MongoDB connection
│   ├── models.js           # Mongoose schemas
│   ├── auth.js             # JWT authentication
│   ├── validation.js       # Joi validation schemas
│   ├── utils_qr.js         # QR code utilities
│   ├── routes_auth.js      # Authentication routes
│   ├── routes_items.js     # Item management routes
│   ├── package.json        # Backend dependencies
│   └── Dockerfile          # Backend container config
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/          # React components
│   │   ├── services/       # API service layer
│   │   └── ...
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile          # Frontend container config
├── docker-compose.yml      # Full stack orchestration
├── setup.sh               # Automated setup script
├── run.sh                 # Start services script
└── stop.sh                # Stop services script
```

## 🔧 Configuration

### Environment Variables

#### Backend (`backend/config.env`)
```env
MONGODB_URI=mongodb://localhost:27017/railqr
SECRET_KEY=your-secret-key
JWT_EXPIRES_IN=24h
PORT=8000
NODE_ENV=development
BASE_URL=http://localhost:5173
QR_CODE_DIR=./qrcodes
```

#### Frontend (`.env`)
```env
VITE_API_BASE=http://localhost:8000/api
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Item Management Endpoints
- `POST /api/items/create` - Create new item
- `GET /api/items/by-token/:token` - Get item by QR token
- `GET /api/items/list` - List all items (admin)
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item (admin)
- `POST /api/items/scan/:token` - Log QR scan
- `GET /api/items/:id/scans` - Get scan history

### Utility Endpoints
- `GET /api/health` - API health check

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Remove all data
docker-compose down -v
```

## 👥 User Roles

### Worker
- Create new items with QR codes
- Scan existing QR codes
- View item details

### Admin
- All worker permissions
- View all items in system
- Manage user accounts
- Delete items
- View scan analytics

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- Rate limiting (100 req/15min)
- CORS protection
- Input validation with Joi
- Security headers with Helmet
- SQL injection protection (NoSQL)

## 🚀 Deployment

### Production Deployment
1. Update environment variables for production
2. Use production MongoDB instance
3. Set secure JWT secret
4. Configure proper CORS origins
5. Use HTTPS in production

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 Development

### Adding New Features
1. Create feature branch
2. Update backend API if needed
3. Update frontend components
4. Test thoroughly
5. Submit pull request

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Consistent naming conventions

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in config.env

2. **Port Already in Use**
   - Change ports in docker-compose.yml
   - Or stop conflicting services

3. **CORS Errors**
   - Check BASE_URL in backend config
   - Verify frontend API_BASE URL

4. **QR Code Not Generating**
   - Check qrcodes directory permissions
   - Verify QR_CODE_DIR path

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs: `docker-compose logs -f`
3. Create an issue in the repository

## 📄 License

ISC License - see LICENSE file for details.

---

**Happy Coding! 🚀**
