import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

dotenv.config();

/* -------------------- APP SETUP -------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

/* -------------------- UPLOADS DIRECTORY SETUP -------------------- */

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✓ Created uploads directory");
}

/* -------------------- DATABASE SETUP -------------------- */

const db = new sqlite3.Database("./users.db", (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("✓ Connected to SQLite database");
  }
});

/* -------------------- CREATE TABLES -------------------- */

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Error creating users table:", err.message);
  } else {
    console.log("✓ Users table ready");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    issue TEXT,
    logs TEXT,
    ai_response TEXT,
    image_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`, (err) => {
  if (err) {
    console.error("Error creating support_requests table:", err.message);
  } else {
    console.log("✓ Support requests table ready");
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    compressed_size INTEGER,
    file_path TEXT NOT NULL,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`, (err) => {
  if (err) {
    console.error("Error creating images table:", err.message);
  } else {
    console.log("✓ Images table ready");
  }
});

/* -------------------- VALIDATION HELPERS -------------------- */

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 6;
}

/* -------------------- SIGNUP API -------------------- */

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
 
  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required"
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      message: "Invalid email format"
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long"
    });
  }
 
  const query = `
    INSERT INTO users (name, email, password)
    VALUES (?, ?, ?)
  `;
 
  db.run(query, [name.trim(), email.trim().toLowerCase(), password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({
          message: "Email already exists. Please use a different email or login."
        });
      }
      console.error("Signup error:", err);
      return res.status(500).json({
        message: "Server error. Please try again later."
      });
    }
 
    res.status(201).json({
      message: "User registered successfully",
      userId: this.lastID
    });
  });
});

/* -------------------- GET ALL USERS API -------------------- */

app.get("/users", (req, res) => {
  const query = `
    SELECT id, name, email, created_at
    FROM users
    ORDER BY created_at DESC
  `;
 
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({
        message: "Failed to fetch users"
      });
    }
 
    res.json({
      users: rows || []
    });
  });
});

/* -------------------- LOGIN API -------------------- */

app.post("/login", (req, res) => {
  const { email, password } = req.body;
 
  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }
 
  const query = `
    SELECT id, name, email
    FROM users
    WHERE email = ? AND password = ?
  `;
 
  db.get(query, [email.trim().toLowerCase(), password], (err, user) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({
        message: "Server error. Please try again later."
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }
 
    res.json({
      message: "Login successful",
      user
    });
  });
});

/* -------------------- OPENAI SETUP -------------------- */

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

if (!openai) {
  console.warn("⚠ Warning: OPENAI_API_KEY not found. AI support features will not work.");
}

/* -------------------- SUPPORT AI API -------------------- */
 
/* -------------------- MULTER CONFIGURATION -------------------- */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg', '.jfif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Check if extension is allowed
  const isExtensionValid = allowedExtensions.includes(fileExt);
  
  // For MIME type, be more lenient - accept any image/* type or common image MIME types
  const isMimeTypeValid = file.mimetype.startsWith('image/') || 
                         ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                          'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml', 
                          'image/jfif', 'image/x-ms-bmp', 'image/x-png'].includes(file.mimetype.toLowerCase());
  
  // Accept if extension is valid OR if it's an image MIME type
  // JFIF files might have various MIME types, so we primarily check extension
  if (isExtensionValid || (isMimeTypeValid && fileExt)) {
    console.log(`File accepted: ${file.originalname}, MIME: ${file.mimetype}, Ext: ${fileExt}`);
    cb(null, true);
  } else {
    console.error(`File rejected: ${file.originalname}, MIME type: ${file.mimetype}, Extension: ${fileExt}`);
    cb(new Error(`File type not allowed. Only image files (JPEG, JPG, PNG, GIF, WebP, BMP, TIFF, SVG, JFIF) are allowed. Received: ${fileExt || 'unknown'} with MIME type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

/* -------------------- IMAGE UPLOAD API -------------------- */

app.post("/upload-image", (req, res) => {
  upload.single('image')(req, res, (err) => {
    // Handle multer errors first
    if (err) {
      console.error("Multer error:", err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: "File too large. Maximum size is 10MB."
          });
        }
        return res.status(400).json({
          message: `Upload error: ${err.message}`
        });
      }
      
      // File filter error
      return res.status(400).json({
        message: err.message || "File upload failed. Please check file type and size."
      });
    }
    
    // If no file and no error, it means no file was sent
    if (!req.file) {
      return res.status(400).json({
        message: "No image file provided"
      });
    }
    
    try {

      const { originalSize, compressedSize, mimeType } = req.body;
      const userId = req.headers['x-user-id'] || req.headers['X-User-ID'] || null;

      // Normalize MIME type for jfif files
      let finalMimeType = mimeType || req.file.mimetype || 'image/jpeg';
      if (req.file.originalname.toLowerCase().endsWith('.jfif')) {
        finalMimeType = 'image/jpeg'; // JFIF is essentially JPEG
      }

      console.log(`Processing upload: ${req.file.originalname}, Size: ${req.file.size}, MIME: ${finalMimeType}`);

      const query = `
        INSERT INTO images (filename, original_filename, mime_type, size, compressed_size, file_path, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        query,
        [
          req.file.filename,
          req.file.originalname,
          finalMimeType,
          parseInt(originalSize || req.file.size) || req.file.size,
          parseInt(compressedSize || req.file.size) || req.file.size,
          req.file.path,
          userId || null
        ],
        function (dbErr) {
          if (dbErr) {
            console.error("Error saving image to database:", dbErr);
            // Delete uploaded file if database insert fails
            if (fs.existsSync(req.file.path)) {
              try {
                fs.unlinkSync(req.file.path);
              } catch (unlinkErr) {
                console.error("Error deleting uploaded file:", unlinkErr);
              }
            }
            return res.status(500).json({
              message: "Failed to save image to database",
              error: process.env.NODE_ENV === 'development' ? dbErr.message : undefined
            });
          }

          console.log(`Image saved successfully with ID: ${this.lastID}`);
          res.json({
            imageId: this.lastID,
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            size: parseInt(originalSize || req.file.size) || req.file.size,
            compressedSize: parseInt(compressedSize || req.file.size) || req.file.size,
            previewUrl: `http://localhost:3000/image/${this.lastID}`,
            message: "Image uploaded successfully"
          });
        }
      );
    } catch (err) {
      console.error("Image upload processing error:", err);
      
      // Clean up uploaded file if it exists
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("Error deleting file after error:", unlinkErr);
        }
      }
      
      res.status(500).json({
        message: "Image upload failed",
        error: process.env.NODE_ENV === 'development' ? err.message : "Internal server error. Please try again."
      });
    }
  });
});

/* -------------------- GET IMAGE API -------------------- */

app.get("/image/:imageId", (req, res) => {
  const { imageId } = req.params;

  if (!imageId || isNaN(imageId)) {
    return res.status(400).json({
      message: "Invalid image ID"
    });
  }

  const query = `
    SELECT filename, mime_type, file_path
    FROM images
    WHERE id = ?
  `;

  db.get(query, [imageId], (err, image) => {
    if (err) {
      console.error("Error fetching image:", err);
      return res.status(500).json({
        message: "Failed to fetch image"
      });
    }

    if (!image || !fs.existsSync(image.file_path)) {
      return res.status(404).json({
        message: "Image not found"
      });
    }

    res.setHeader('Content-Type', image.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${image.filename}"`);
    
    const fileStream = fs.createReadStream(image.file_path);
    fileStream.pipe(res);
  });
});

/* -------------------- GET IMAGE INFO API -------------------- */

app.get("/image-info/:imageId", (req, res) => {
  const { imageId } = req.params;

  if (!imageId || isNaN(imageId)) {
    return res.status(400).json({
      message: "Invalid image ID"
    });
  }

  const query = `
    SELECT id, original_filename, mime_type, size, compressed_size, created_at
    FROM images
    WHERE id = ?
  `;

  db.get(query, [imageId], (err, image) => {
    if (err) {
      console.error("Error fetching image info:", err);
      return res.status(500).json({
        message: "Failed to fetch image info"
      });
    }

    if (!image) {
      return res.status(404).json({
        message: "Image not found"
      });
    }

    res.json(image);
  });
});

/* -------------------- SUPPORT AI API -------------------- */
 
app.post("/support", async (req, res) => {
  try {
    const { userId, issue, logs, imageIds } = req.body;
 
    if (!userId || !issue) {
      return res.status(400).json({
        solution: "User ID and issue description are required"
      });
    }

    if (!openai) {
      return res.status(503).json({
        solution: "AI service is currently unavailable. Please contact support manually."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        solution: "OpenAI API key not configured. Please contact administrator."
      });
    }
 
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional technical support expert. Diagnose issues efficiently and provide clear, step-by-step troubleshooting solutions in plain language, explaining each step and guiding users from basic to advanced fixes. Format your response in a clear, easy-to-read manner with proper spacing."
        },
        {
          role: "user",
          content: `Issue: ${issue}\n\nLogs/Context: ${logs || "No additional context provided"}`
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });
 
    const aiReply = completion.choices?.[0]?.message?.content?.trim() || "No response generated.";
 
    // Save to SQLite
    const imageIdsStr = imageIds && Array.isArray(imageIds) ? imageIds.join(',') : '';
    const insertQuery = `
      INSERT INTO support_requests (user_id, issue, logs, ai_response, image_ids)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      insertQuery,
      [userId, issue.trim(), logs ? logs.trim() : "", aiReply, imageIdsStr],
      (err) => {
        if (err) {
          console.error("Error saving support request:", err);
          // Still return the response even if saving fails
        }
      }
    );
 
    res.json({ 
      solution: aiReply,
      imageIds: imageIds || []
    });
 
  } catch (err) {
    console.error("OpenAI error:", err);
 
    let message = "AI service error. Please try again.";
    let status = 500;
 
    if (err.status === 401) {
      message = "Invalid OpenAI API key. Please contact administrator.";
      status = 503;
    } else if (err.status === 429) {
      message = "Rate limit exceeded. Please try again in a few moments.";
      status = 429;
    } else if (err.status === 500) {
      message = "OpenAI service error. Please try again later.";
      status = 503;
    } else if (err.message) {
      message = `Error: ${err.message}`;
    }
 
    res.status(status).json({ solution: message });
  }
});

/* -------------------- GET SUPPORT ISSUES -------------------- */

app.get("/support-issues/:userId", (req, res) => {
  const { userId } = req.params;
 
  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      message: "Invalid user ID"
    });
  }

  const query = `
    SELECT
      MIN(id) AS id,
      issue,
      ai_response,
      MAX(created_at) AS created_at
    FROM support_requests
    WHERE user_id = ?
    GROUP BY issue
    ORDER BY MAX(created_at) DESC
    LIMIT 50
  `;
 
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Error fetching support issues:", err);
      return res.status(500).json({
        message: "Failed to fetch support issues"
      });
    }
 
    res.json({ 
      issues: rows || []
    });
  });
});

/* -------------------- HEALTH CHECK -------------------- */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

/* -------------------- ERROR HANDLING -------------------- */

// Multer-specific error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large. Maximum size is 10MB."
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`
    });
  }
  
  // If error message indicates file filter rejection
  if (err && err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json({
      message: err.message
    });
  }
  
  next(err);
});

// General error handler (must be last)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/* -------------------- SERVER START -------------------- */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Tech Support AI backend running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ OpenAI configured: ${!!process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
});
