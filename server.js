require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'kanosa_secret_key_9822';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// Initialize DB
initDb().then(() => console.log('Database connected')).catch(console.error);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// --- FILE UPLOAD ROUTE ---
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Use relative path so links don't break if the Tunnel URL changes
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM admins WHERE username = ?`, [username], async (err, admin) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!admin) return res.status(400).json({ message: 'Admin not found' });

        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid Password' });

        const token = jwt.sign({ id: admin.id, username: admin.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, message: 'Login successful' });
    });
});

// --- NEWS ROUTES ---
// GET all news
app.get('/api/news', (req, res) => {
    db.all(`SELECT * FROM news ORDER BY date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST new news (Admin)
app.post('/api/news', authenticateToken, (req, res) => {
    const { id, title, excerpt, content, category, imageUrl, videoUrl, date, author } = req.body;
    const query = `INSERT INTO news (id, title, excerpt, content, category, imageUrl, videoUrl, date, author) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [id || Date.now().toString(), title, excerpt, content, category, imageUrl, videoUrl, date, author], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'News added successfully', id: this.lastID });
    });
});

// PUT update news (Admin)
app.put('/api/news/:id', authenticateToken, (req, res) => {
    const { title, excerpt, content, category, imageUrl, videoUrl, date, author } = req.body;
    const query = `UPDATE news SET title = ?, excerpt = ?, content = ?, category = ?, imageUrl = ?, videoUrl = ?, date = ?, author = ? WHERE id = ?`;

    db.run(query, [title, excerpt, content, category, imageUrl, videoUrl, date, author, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'News updated successfully' });
    });
});

// DELETE news (Admin)
app.delete('/api/news/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    // First, find the file paths
    db.get(`SELECT imageUrl, videoUrl FROM news WHERE id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'News not found' });

        const deleteFile = (url) => {
            if (url && url.includes(`${PORT}/uploads/`)) {
                const filename = url.split('/').pop();
                const filePath = path.join(uploadDir, filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        };

        deleteFile(row.imageUrl);
        deleteFile(row.videoUrl);

        db.run(`DELETE FROM news WHERE id = ?`, [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'News and associated files deleted successfully' });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
