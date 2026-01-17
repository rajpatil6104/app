# 💰 Expense Tracker - Full Stack Application

A modern, full-stack expense tracking application built with FastAPI, React, and MongoDB. Track your expenses, manage budgets, and visualize your spending patterns with ease.

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure login with Google
- 💵 **Expense Management** - Add, edit, and delete expenses
- 📊 **Budget Tracking** - Set and monitor category budgets
- 📈 **Statistics & Analytics** - Visualize spending patterns
- 🏷️ **Custom Categories** - Create personalized expense categories
- 📥 **CSV Export** - Export your expense data
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Motor** - Async MongoDB driver
- **Python 3.11+** - Latest Python features
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - Latest React features
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization

### Database
- **MongoDB** - NoSQL database for flexible data storage

## 📁 Project Structure

```
/app
├── backend/              # FastAPI backend
│   ├── server.py        # Main application file
│   ├── requirements.txt # Python dependencies
│   ├── .env            # Environment variables (not in git)
│   └── .env.render.example  # Template for Render deployment
├── frontend/            # React frontend
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   ├── package.json    # Node dependencies
│   └── .env            # Frontend environment variables
├── render.yaml         # Render deployment blueprint
└── README.md          # This file
```

## 🚀 Deployment

### Deploy to Render

This application is ready to deploy to Render with one click!

#### Quick Start (15 minutes)
1. **[RENDER_QUICK_START.md](./RENDER_QUICK_START.md)** - Fast deployment guide

#### Detailed Guide
2. **[RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)** - Complete step-by-step instructions

#### Additional Resources
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Track your deployment progress
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

### Prerequisites for Deployment
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (free tier available)
- Google OAuth credentials (optional, for authentication)

### One-Click Deploy
1. Push this code to your GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Blueprint"
4. Select your repository
5. Add environment variables
6. Click "Apply"

🎉 Your app will be live in 10-15 minutes!

## 💻 Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)
- Yarn package manager

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URL and other settings

# Run the server
uvicorn server:app --reload --port 8001
```

Backend will be available at `http://localhost:8001`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
yarn install

# Create .env file
cp .env.example .env
# Edit .env with your backend URL

# Run the development server
yarn start
```

Frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=expense_tracker_db
CORS_ORIGINS=*
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

See `backend/.env.render.example` for production settings.

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

See `frontend/.env.render.example` for production settings.

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

### Main Endpoints

- `POST /api/auth/google` - Google OAuth login
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/{id}` - Update expense
- `DELETE /api/expenses/{id}` - Delete expense
- `GET /api/categories` - Get categories
- `POST /api/budgets` - Create/update budget
- `GET /api/stats/monthly` - Get monthly statistics
- `GET /api/export/csv` - Export expenses as CSV
- `GET /api/health` - Health check endpoint

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
yarn test
```

## 📦 Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn build
# Build output will be in the 'build' directory
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Enable HTTPS in production (Render provides this automatically)
- Restrict CORS origins in production
- Use strong passwords for MongoDB
- Rotate API keys regularly

## 🐛 Troubleshooting

Having issues? Check our [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide for common problems and solutions.

Common issues:
- **MongoDB connection failed**: Check connection string and IP whitelist
- **CORS errors**: Verify CORS_ORIGINS environment variable
- **Build fails**: Check all dependencies are in requirements.txt/package.json
- **Blank frontend page**: Verify REACT_APP_BACKEND_URL is set before build

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Review [Render Documentation](https://render.com/docs)
- Check [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

## 🎯 Roadmap

- [ ] Add receipt image uploads
- [ ] Multi-currency support
- [ ] Recurring expenses
- [ ] Budget alerts
- [ ] Mobile app
- [ ] Data visualization improvements
- [ ] Export to PDF
- [ ] Shared expenses (for families/roommates)

## 🌟 Acknowledgments

- FastAPI for the amazing web framework
- React team for the frontend library
- MongoDB for the flexible database
- Render for easy deployment
- All open-source contributors

---

**Made with ❤️ using FastAPI, React, and MongoDB**
