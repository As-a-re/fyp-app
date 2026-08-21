# AI-Assisted Prenatal Monitoring System

A comprehensive mobile healthcare platform designed to support pregnant women through continuous health monitoring, AI-driven risk prediction, and real-time consultation using an AI video assistant.

## System Architecture

```
Mobile App (React Native/Expo)
    ↓
Backend API (Express.js)
    ↓
AI Services (Tavus AI) + ML Service (FastAPI)
    ↓
Database (Supabase)
```

## Technology Stack

### Mobile Application

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: React Context/Hooks

### Backend Server

- **Framework**: Express.js
- **Authentication**: JWT tokens
- **Database**: Supabase (PostgreSQL)
- **Security**: bcrypt, helmet, cors

### AI & Machine Learning

- **Video Assistant**: Tavus AI
- **ML Framework**: FastAPI with scikit-learn
- **Algorithms**: Random Forest, XGBoost, Logistic Regression

### Database

- **Provider**: Supabase
- **Database**: PostgreSQL
- **Features**: Row Level Security, Real-time subscriptions

## Project Structure

```
MyApp/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Helper functions
│   ├── database/
│   │   └── schema.sql        # Database schema
│   ├── .env.example          # Environment variables template
│   └── package.json
├── ml-service/                # FastAPI ML service
│   ├── main.py              # ML API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── model.joblib         # Trained model (auto-generated)
├── app/                      # React Native mobile app
├── components/               # Reusable components
├── hooks/                   # Custom hooks
├── constants/               # App constants
└── assets/                  # Static assets
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- Python 3.8 or higher
- npm or yarn
- Git
- Supabase account
- Tavus AI API key (optional for demo)

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_ANON_KEY: Your Supabase anonymous key
# - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
# - JWT_SECRET: Generate a secure secret
# - TAVUS_API_KEY: Your Tavus AI API key (optional)
```

### 3. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the SQL schema from `backend/database/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (included in schema)
4. Update your `.env` file with Supabase credentials

### 4. ML Service Setup

```bash
# Navigate to ML service directory
cd ml-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the ML service
python main.py
```

The ML service will start on `http://localhost:8000`

### 5. Backend Startup

```bash
# From the backend directory
npm run dev
```

The backend API will start on `http://localhost:5000`

### 6. Mobile App Setup

```bash
# From the root directory
npm install

# Start the Expo development server
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Health Monitoring

- `POST /api/health/record` - Record health data
- `GET /api/health/history` - Get health history
- `GET /api/health/latest` - Get latest health record

### AI Prediction

- `POST /api/predict/risk` - Predict pregnancy risk
- `GET /api/predict/history` - Get prediction history

### AI Assistant

- `POST /api/ai/start-session` - Start AI video session
- `POST /api/ai/end-session` - End AI session
- `GET /api/ai/sessions` - Get session history
- `POST /api/ai/analyze-symptom` - Analyze symptoms with AI

### Messaging

- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/:userId` - Get conversation
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/unread-count` - Get unread count

## Database Schema

### Core Tables

- **users**: User accounts and profiles
- **pregnancy_profiles**: Pregnancy-specific information
- **health_records**: Maternal health indicators
- **symptoms**: User-reported symptoms
- **ai_predictions**: ML risk predictions
- **ai_sessions**: AI assistant sessions
- **messages**: Doctor-patient messaging
- **emergency_alerts**: Emergency notifications

### Security Features

- Row Level Security (RLS) enabled
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization

## ML Model Features

### Input Features

- Maternal age
- Gestational age
- Blood pressure (systolic/diastolic)
- Blood sugar levels
- Heart rate
- Body temperature

### Risk Categories

- **Low**: Normal pregnancy parameters
- **Medium**: Some risk factors present
- **High**: Significant risk factors detected

### Model Performance

- Accuracy: ~85-90% (with sufficient training data)
- Real-time prediction capability
- Continuous learning with new data

## AI Assistant Integration

The system integrates with Tavus AI for:

- Real-time video consultations
- Conversational maternal health guidance
- Symptom analysis and explanation
- Multilingual support (including Twi)

**Demo Mode**: If Tavus API key is not provided, the system operates in demo mode with mock sessions.

## Emergency Alert System

Automatic alerts triggered when:

- High-risk prediction with confidence > 80%
- Critical health thresholds exceeded
- User reports severe symptoms

Alert delivery methods:

- In-app notifications
- Email notifications to doctors
- SMS alerts (configurable)

## Development Guidelines

### Code Standards

- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Git hooks for pre-commit checks

### Testing

- Unit tests for backend services
- Integration tests for API endpoints
- Model validation tests

### Security Best Practices

- Environment variables for sensitive data
- Input validation on all endpoints
- Rate limiting on APIs
- HTTPS in production

## Deployment

### Backend Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### ML Service Deployment

```bash
# Plain Python (no containers)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Deploy this the same way to any plain Python host (Railway, Render, a VPS, etc.)
by running the same `uvicorn` command as the start command — no Dockerfile
needed.

### Mobile App Deployment

- Build with Expo EAS Build
- Deploy to App Store/Play Store
- Configure production API endpoints

## Monitoring and Maintenance

### Health Checks

- `/api/health` - Backend health status
- `http://localhost:8000/health` - ML service health

### Logging

- Structured logging with Winston
- Error tracking and monitoring
- Performance metrics collection

## Future Enhancements

### Planned Features

- Wearable device integration
- Hospital EHR integration
- Fetal monitoring sensors
- Ultrasound AI analysis
- Additional African language support

### Scalability Improvements

- Microservices architecture
- Load balancing
- Database optimization
- CDN integration

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase credentials in `.env`
   - Check network connectivity
   - Ensure database schema is applied

2. **ML Service Unavailable**
   - Ensure Python dependencies are installed
   - Check if port 8000 is available
   - Verify model files exist

3. **Authentication Failures**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Ensure proper password hashing

4. **AI Assistant Issues**
   - Verify Tavus API key (if using production)
   - Check internet connectivity
   - Enable demo mode for testing

## Support

For technical support or questions:

- Check the troubleshooting section
- Review API documentation
- Contact development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Note**: This system is designed for educational and demonstration purposes. For production use, ensure compliance with healthcare regulations (HIPAA, GDPR, etc.) and conduct thorough security audits.
