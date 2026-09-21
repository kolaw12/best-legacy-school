import { useCallback, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import AdminPageHeader from '../../components/admin/PageHeader';
import API_URL from '../../config/api';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../../context/AuthContext';

const AdminGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);
    const toast = useToast();
    const { token } = useAuth();

    const load = useCallback(() => {
        setLoading(true);
        axios.get(`${API_URL}/api/gallery/`)
            .then(r => setImages(r.data || []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const upload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const fd = new FormData();
                fd.append('image', file);
                fd.append('caption', file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
                await axios.post(`${API_URL}/api/gallery/`, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Token ${token}`,
                    },
                });
            }
            toast.success(`Uploaded ${files.length} image${files.length > 1 ? 's' : ''}`);
            load();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const remove = async (id) => {
        if (!confirm('Delete this image?')) return;
        try {
            await axios.delete(`${API_URL}/api/gallery/${id}/`, {
                headers: { Authorization: `Token ${token}` },
            });
            toast.success('Image deleted');
            setImages(prev => prev.filter(i => i.id !== id));
        } catch {
            toast.error('Delete failed');
        }
    };

    const getImageUrl = (img) => {
        if (!img.image) return null;
        if (img.image.startsWith('http')) return img.image;
        return `${API_URL}${img.image.startsWith('/') ? '' : '/'}${img.image}`;
    };

    return (
        <>
            <AdminPageHeader
                title="Gallery"
                subtitle="Manage school photos shown on the public website."
                actions={
                    <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} className="hidden" />
                        <button onClick={() => fileRef.current?.click()} disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50">
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading...' : 'Upload Photos'}
                        </button>
                    </div>
                }
            />

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-100 animate-pulse" />
                    ))}
                </div>
            ) : images.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                    <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No photos yet. Upload some to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map(img => (
                        <div key={img.id} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                            <img src={getImageUrl(img)} alt={img.caption || 'Gallery'}
                                className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-3 opacity-0 group-hover:opacity-100">
                                <span className="text-white text-xs font-semibold truncate">{img.caption}</span>
                                <button onClick={() => remove(img.id)}
                                    className="shrink-0 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-gray-600 flex items-center justify-center transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default AdminGallery;
