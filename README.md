# Tech Support AI

A professional, intelligent troubleshooting platform powered by AI to help users diagnose and resolve technical issues efficiently.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 🤖 **AI-Powered Support** - OpenAI integration for intelligent issue diagnosis
- 📸 **Image Upload** - Upload and compress images with support for multiple formats
- 📊 **Dashboard** - User-friendly dashboard with statistics
- 🔍 **Issue Tracking** - View and manage previous support requests
- 🎨 **Modern UI** - Professional, responsive design with animations
- 💾 **SQLite Database** - Persistent data storage for users and support requests

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Modern CSS with CSS Variables
- Responsive Design
- Client-side Image Compression

### Backend
- Node.js with Express
- SQLite3 Database
- OpenAI API Integration
- Multer for File Uploads

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API Key (optional, for AI features)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

   The server will start on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Open any HTML file in a browser or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js http-server
   npx http-server -p 8000
   ```

3. Access the application at `http://localhost:8000`

## Project Structure

```
Tech_Support_AI/
├── backend/
│   ├── server.js          # Express server with API endpoints
│   ├── package.json       # Backend dependencies
│   ├── users.db          # SQLite database (auto-created)
│   └── uploads/          # Image uploads directory (auto-created)
│
├── frontend/
│   ├── index.html        # Login page
│   ├── signup.html       # Registration page
│   ├── dashboard.html    # User dashboard
│   ├── support-hub.html  # View previous issues
│   ├── troubleshooting.html # Create new support request
│   ├── app.js            # Frontend JavaScript logic
│   ├── style.css         # Main stylesheet
│   ├── login.css         # Login/Signup styles
│   └── images/           # Static images
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /signup` - User registration
- `POST /login` - User login
- `GET /users` - Get all users (optional)

### Support
- `POST /support` - Create AI support request
- `GET /support-issues/:userId` - Get user's support issues

### Image Upload
- `POST /upload-image` - Upload and compress image
- `GET /image/:imageId` - Retrieve image binary data
- `GET /image-info/:imageId` - Get image metadata

### Health
- `GET /health` - Health check endpoint

## Features in Detail

### Image Upload
- Supports multiple formats: JPG, PNG, GIF, WebP, BMP, TIFF, SVG, JFIF
- Automatic client-side compression (max 1920x1080, 85% quality)
- Maximum file size: 10MB per image
- Images are stored in `backend/uploads/` directory
- Metadata stored in SQLite database

### AI Support
- Integrated with OpenAI GPT-4o-mini
- Provides step-by-step troubleshooting solutions
- Context-aware issue diagnosis
- Saves solutions for future reference

## Environment Variables

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

## Database Schema

### Users Table
- `id` - Primary key
- `name` - User's full name
- `email` - Unique email address
- `password` - User password (plain text - consider hashing in production)
- `created_at` - Registration timestamp

### Support Requests Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `issue` - Issue description
- `logs` - Additional context/logs
- `ai_response` - AI-generated solution
- `image_ids` - Comma-separated image IDs
- `created_at` - Request timestamp

### Images Table
- `id` - Primary key
- `filename` - Stored filename
- `original_filename` - Original filename
- `mime_type` - Image MIME type
- `size` - Original file size
- `compressed_size` - Compressed file size
- `file_path` - File system path
- `user_id` - Foreign key to users
- `created_at` - Upload timestamp

## Deployment

🚀 **Want to make your application publicly accessible?**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed step-by-step instructions on deploying to:
- **Backend**: Render (free tier available)
- **Frontend**: Vercel or Netlify (free tier available)

### Quick Deployment Summary

1. **Backend (Render)**:
   - Push code to GitHub
   - Connect repository to Render
   - Set environment variables (`OPENAI_API_KEY`, `NODE_ENV`, `PORT`)
   - Deploy → Get backend URL: `https://your-backend.onrender.com`

2. **Frontend (Vercel/Netlify)**:
   - Connect GitHub repository
   - Set root directory to `frontend`
   - Optionally set `API_URL` environment variable to your backend URL
   - Deploy → Get frontend URL: `https://your-app.vercel.app`

3. **Share the Frontend URL** with your collaborators - that's the public URL everyone can use!

For complete instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Usage

1. **Sign Up**: Create a new account
2. **Login**: Access your dashboard
3. **Create Issue**: Go to "New Issue" and describe your problem
4. **Upload Images**: Attach screenshots or relevant images (optional)
5. **Get AI Solution**: Click "Run Support Agent" to get AI-powered diagnosis
6. **View History**: Check "Support Hub" to view previous issues and solutions

## Security Notes

⚠️ **Important**: This is a development application. For production:

- Hash passwords using bcrypt or similar
- Use environment variables for sensitive data
- Implement proper session management
- Add rate limiting
- Use HTTPS
- Validate and sanitize all inputs
- Implement proper CORS policies

## Troubleshooting

### Backend won't start
- Check if Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is available
- Verify `.env` file exists with required variables

### Image upload fails
- Ensure `backend/uploads/` directory exists (auto-created)
- Check file size (max 10MB)
- Verify file format is supported
- Check backend logs for detailed error messages

### AI features not working
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key is valid and has credits
- Review backend console for API errors

## License

ISC

## Author

Tech Support AI Team
