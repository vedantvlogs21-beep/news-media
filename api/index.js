import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'kanosa_secret_key_9822';
const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || '').trim().replace(/^["']|["']$/g, '');
const GITHUB_REPO = (process.env.GITHUB_REPO || '').trim().replace(/^["']|["']$/g, ''); // Format: username/repo
const FILE_PATH = 'news.json';

app.use(cors());
app.use(express.json());

// Multi-part form data handler (Memory storage for Vercel)
const upload = multer({ storage: multer.memoryStorage() });

// Helper for GitHub API
async function githubRequest(method, body = null) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`;
    const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Kanosa-Portal'
    };

    const response = await fetch(url, { headers });
    let sha = null;
    let currentContent = [];

    if (response.status === 200) {
        const data = await response.json();
        sha = data.sha;
        currentContent = JSON.parse(Buffer.from(data.content, 'base64').toString());
    }

    if (method === 'GET') return currentContent;

    const newContent = body(currentContent);
    const putResponse = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
            message: `Update ${FILE_PATH}`,
            content: Buffer.from(JSON.stringify(newContent, null, 2)).toString('base64'),
            sha: sha
        })
    });

    if (!putResponse.ok) {
        const err = await putResponse.json();
        throw new Error(err.message);
    }
    return newContent;
}

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

// --- FILE UPLOAD ROUTE (GITHUB STORAGE) ---
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    try {
        const fileName = `uploads/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`;
        const content = req.file.buffer.toString('base64');

        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Kanosa-Portal'
            },
            body: JSON.stringify({
                message: `Upload ${fileName}`,
                content: content
            })
        });

        if (!putResponse.ok) {
            const err = await putResponse.json();
            return res.status(putResponse.status).json({
                error: err.message,
                details: 'GitHub API error during file upload'
            });
        }

        // Return the RAW github URL for the image
        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${fileName}`;
        res.json({ url: rawUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USER = (process.env.ADMIN_USERNAME || 'admin2407').trim().replace(/^["']|["']$/g, '');
    // Hash for "Admin@2026"
    const ADMIN_HASH = (process.env.ADMIN_PASSWORD_HASH || '$2b$10$wZiFb87hHZG2uCIeNm7uM3vAKtnNEiESjwGpar.Fjm').trim().replace(/^["']|["']$/g, '');

    if (username === ADMIN_USER) {
        const validPassword = await bcrypt.compare(password, ADMIN_HASH);
        if (validPassword) {
            const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token, message: 'Login successful' });
        }
    }
    res.status(400).json({ message: 'Invalid credentials' });
});

// --- NEWS ROUTES ---
app.get('/api/news', async (req, res) => {
    try {
        const news = await githubRequest('GET');
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/news', authenticateToken, async (req, res) => {
    try {
        await githubRequest('POST', (current) => {
            const newNews = { ...req.body, id: req.body.id || Date.now().toString() };
            return [newNews, ...current];
        });
        res.status(201).json({ message: 'News added successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/news/:id', authenticateToken, async (req, res) => {
    try {
        await githubRequest('POST', (current) => {
            return current.map(n => n.id === req.params.id ? { ...n, ...req.body } : n);
        });
        res.json({ message: 'News updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/news/:id', authenticateToken, async (req, res) => {
    try {
        await githubRequest('POST', (current) => {
            return current.filter(n => n.id !== req.params.id);
        });
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default app;
