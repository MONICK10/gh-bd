# MindEase - Discussion Platform

A Node.js Express server with Firebase Firestore for user authentication, discussions, chats, and profile management.

## 📋 Requirements

### Dependencies
All required Node.js packages are listed in `package.json`:

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "body-parser": "^2.2.0", 
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "firebase": "^12.3.0",
    "firebase-admin": "^13.5.0",
    "gpt4all": "^4.0.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.0.2",
    "mysql2": "^3.15.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### System Requirements
- **Node.js**: v14.0.0 or higher
- **npm**: v6.0.0 or higher
- **Firebase Project**: Active Firebase project with Firestore enabled

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd d:\AIAGENT\gh-bd
npm install
```

### 2. Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable **Firestore Database**
4. Go to Project Settings > General > Your Apps
5. Add a web app and copy the configuration
6. Replace the placeholder config in `db.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

### 3. Firestore Security Rules
Set up basic security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development - customize for production
    }
  }
}
```

### 4. Create Upload Directories
```bash
mkdir -p public/uploads
mkdir -p uploads
```

## 🏃‍♂️ Running the Server

### Development Mode (with auto-restart):
```bash
npm start
# or
npx nodemon server.js
```

### Production Mode:
```bash
node server.js
```

Server will run on: `http://localhost:5006`

## 📁 Project Structure

```
gh-bd/
├── db.js                 # Firebase configuration
├── server.js             # Main Express server
├── package.json          # Dependencies and scripts
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── chats.js          # Chat message routes  
│   ├── discussions.js    # Discussion post routes
│   └── profile.js        # User profile routes
├── public/
│   └── uploads/          # Public file uploads
└── uploads/              # Server file uploads
```

## 🗃️ Firestore Collections

The app uses these Firestore collections:

- **`users`** - User accounts (name, email, password, department, batch)
- **`chats`** - Private chat messages
- **`discussions`** - Discussion posts (class/department/public)
- **`post_likes`** - Likes on discussion posts
- **`post_replies`** - Replies to discussion posts
- **`friends`** - Friend relationships and requests

## 🔗 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Chats  
- `GET /chats/:userId` - Get user's chat messages
- `POST /chats` - Send new chat message

### Discussions
- `GET /discussions` - Get class discussions (batch + department)
- `POST /discussions` - Create new discussion
- `GET /discussions/department/:dept` - Get department discussions
- `POST /discussions/department` - Create department discussion
- `GET /discussions/public/all` - Get public discussions
- `POST /:id/like` - Like a discussion
- `GET /:id/likes` - Get like count
- `POST /:id/reply` - Reply to discussion
- `GET /:id/replies` - Get discussion replies

### Profile
- `GET /profile/:id` - Get user profile
- `PUT /profile` - Update profile
- `POST /profile/upload` - Upload avatar

## 🛠️ Development Notes

- CORS enabled for `http://localhost:5500` and `http://127.0.0.1:5500`
- File uploads handled by Multer (stored in `uploads/` directory)
- Static files served from `public/` and `uploads/` directories
- ES6 modules enabled (`"type": "module"` in package.json)

## 🔐 Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- Update Firestore security rules for production
- Consider adding rate limiting
- Validate and sanitize all user inputs
- Implement proper authentication tokens (JWT)

## 🚨 Troubleshooting

### Common Issues:

1. **Firebase Config Error**: Make sure to replace placeholder values in `db.js`
2. **Upload Directory**: Ensure `uploads/` and `public/uploads/` directories exist
3. **Port Conflicts**: Change port in `server.js` if 5006 is in use
4. **CORS Issues**: Update CORS origins in `server.js` for your frontend URL

### Dependencies Installation Issues:
```bash
# Clear npm cache if needed
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```