
import React, { useState, useMemo, useRef } from 'react';
import { Category, NewsItem, LOCATIONS } from '../types';
import Logo from './Logo';
import ApiService from '../services/apiService';

interface AdminDashboardProps {
  onLogout: () => void;
  newsData: NewsItem[];
  onUpdateNews: (news: NewsItem[]) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, newsData, onUpdateNews }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    title: '',
    category: Category.MAHARASHTRA as string,
    imageUrl: '',
    videoUrl: '',
    excerpt: '',
    content: '',
    author: 'Admin',
    date: new Date().toLocaleDateString('mr-IN').replace(/\//g, '.'),
    viewCount: 0,
    commentCount: 0,
    location: LOCATIONS[0]
  };

  const [formData, setFormData] = useState(initialFormState);
  const [postType, setPostType] = useState<'photo' | 'video'>('photo');

  const filteredNews = useMemo(() => {
    return newsData.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(adminSearch.toLowerCase());
      return matchesSearch;
    });
  }, [newsData, adminSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Auto-populate YouTube thumbnail if videoUrl changes
    if (name === 'videoUrl' && (value.includes('youtube.com') || value.includes('youtu.be'))) {
      const videoId = value.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/)?.[1];
      if (videoId) {
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        setFormData(prev => ({
          ...prev,
          videoUrl: value,
          imageUrl: prev.imageUrl === '' || prev.imageUrl.includes('youtube.com') ? thumbUrl : prev.imageUrl
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'viewCount' || name === 'commentCount' ? parseInt(value) || 0 : value
    }));
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSubmitting(true);
      try {
        let finalFile = file;
        if (type === 'image') {
          finalFile = await compressImage(file);
        }

        const url = await ApiService.uploadFile(finalFile);
        setFormData(prev => ({
          ...prev,
          [type === 'image' ? 'imageUrl' : 'videoUrl']: url
        }));
      } catch (err: any) {
        console.error('Upload Error:', err);
        alert(`फाईल अपलोड करण्यात त्रुटी आली: ${err.message || 'Unknown Error'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormState,
      category: Category.MAHARASHTRA
    });
    setPostType('photo');
    setIsModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setPostType(item.videoUrl ? 'video' : 'photo');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await ApiService.updateNews(editingItem.id, formData);
        onUpdateNews(newsData.map(n => n.id === editingItem.id ? { ...editingItem, ...formData } : n));
      } else {
        const newNews = { id: Date.now().toString(), ...formData } as NewsItem;
        await ApiService.addNews(newNews);
        onUpdateNews([newNews, ...newsData]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('बदल जतन करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('ही बातमी हटवायची आहे का?')) {
      try {
        await ApiService.deleteNews(id);
        onUpdateNews(newsData.filter(n => n.id !== id));
      } catch (err: any) {
        console.error('Delete Error:', err);
        alert(`बातमी हटवण्यात त्रुटी आली: ${err.message || 'Unknown Error'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[90]">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="scale-75 origin-left hidden md:block">
              <Logo />
            </div>
            <h1 className="text-xl font-bold text-gray-800 md:ml-4">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 hidden sm:block">Welcome, Admin</span>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto w-full px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Simplified */}
        <aside className="lg:w-64 space-y-4">
          <button
            onClick={() => openAddModal()}
            className="w-full py-3 bg-[#E31E24] text-white font-bold rounded shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> नवीन बातमी
          </button>

          <nav className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 text-sm font-bold border-b border-gray-50 flex items-center justify-between text-[#E31E24] bg-gray-50">
              सर्व बातम्या <span>{newsData.length}</span>
            </div>
            <div className="p-4 text-xs text-gray-400 font-bold leading-relaxed">
              येथून तुम्ही सर्व बातम्या व्यवस्थापित करू शकता. श्रेणी निवडण्यासाठी बातमी जोडताना पर्यायाचा वापर करा.
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="बातमीचे शीर्षक शोधा..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-10 py-2.5 text-sm focus:ring-2 focus:ring-red-100 outline-none transition-all"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Article</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredNews.length > 0 ? filteredNews.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={item.imageUrl} className="w-10 h-10 rounded object-cover bg-gray-100" />
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">{item.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-gray-400 capitalize">{item.location || 'N/A'}</td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-bold">{item.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">कोणतीही बातमी सापडली नाही</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">{editingItem ? 'बातमी संपादित करा' : 'नवीन बातमी जोडा'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Headline</label>
                  <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none focus:border-red-500" placeholder="बातमीचे शीर्षक..." />
                </div>

                <div className="space-y-1">
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none">
                    {Object.values(Category).filter(c => c !== Category.HOME).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</label>
                  <select name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none">
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Author</label>
                  <input name="author" required value={formData.author} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none" />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Post Type</label>
                  <div className="flex gap-4 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                      type="button"
                      onClick={() => { setPostType('photo'); setFormData(p => ({ ...p, videoUrl: '' })); }}
                      className={`px-6 py-2 rounded-md font-bold text-xs transition-all ${postType === 'photo' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Photo Post
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType('video')}
                      className={`px-6 py-2 rounded-md font-bold text-xs transition-all ${postType === 'video' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Video Post
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {postType === 'photo' ? 'Image Source' : 'Video Thumbnail (Image)'}
                  </label>
                  <div className="flex gap-2">
                    <input name="imageUrl" type="url" value={formData.imageUrl} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold outline-none" placeholder="Image URL..." />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200"
                    >
                      Upload Image
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-3 aspect-video w-48 rounded-lg overflow-hidden border border-gray-100">
                      <img src={ApiService.resolveMediaUrl(formData.imageUrl)} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {postType === 'video' && (
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">YouTube Video URL</label>
                    <div className="flex gap-2">
                      <input name="videoUrl" type="url" value={formData.videoUrl} onChange={handleInputChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold outline-none" placeholder="https://www.youtube.com/watch?v=..." />
                    </div>
                    {formData.videoUrl && (
                      <div className="mt-3 aspect-video w-full max-w-md rounded-lg overflow-hidden border border-gray-100 bg-black">
                        {formData.videoUrl.includes('youtube.com') || formData.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${formData.videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/)?.[1] || ''}`}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <video src={ApiService.resolveMediaUrl(formData.videoUrl)} className="w-full h-full object-contain" controls />
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Summary</label>
                  <textarea name="excerpt" required rows={2} value={formData.excerpt} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-bold outline-none" />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Story</label>
                  <textarea name="content" required rows={6} value={formData.content} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-medium outline-none" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-[#E31E24] text-white font-bold rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50">
                  {isSubmitting ? 'प्रक्रिया सुरू आहे...' : (editingItem ? 'बदल जतन करा' : 'बातमी प्रसिद्ध करा')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 font-bold rounded-lg">रद्द करा</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
