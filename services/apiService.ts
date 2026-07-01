import { NewsItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
    private static getHeaders() {
        const token = localStorage.getItem('kanosa_auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    // --- News API ---
    static async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('kanosa_auth_token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Failed to upload file');
        }
        const data = await response.json();
        return data.url;
    }

    static async fetchNews(): Promise<NewsItem[]> {
        const response = await fetch(`${API_BASE_URL}/news`);
        if (!response.ok) throw new Error('Failed to fetch news');
        return response.json();
    }

    static async addNews(news: NewsItem): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/news`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(news)
        });
        if (!response.ok) throw new Error('Failed to add news');
    }

    static async updateNews(id: string, news: Partial<NewsItem>): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/news/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(news)
        });
        if (!response.ok) throw new Error('Failed to update news');
    }

    static async deleteNews(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/news/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Failed to delete news');
        }
    }

    // --- Auth API ---
    static async login(username: string, password: string): Promise<{ token: string; message: string }> {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        return response.json();
    }

    static resolveMediaUrl(url: string | undefined): string {
        if (!url) return 'https://picsum.photos/800/600'; // Placeholder
        if (url.startsWith('http')) return url;
        const baseUrl = API_BASE_URL.replace('/api', '');
        return `${baseUrl}${url}`;
    }
}

export default ApiService;
