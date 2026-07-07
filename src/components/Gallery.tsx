/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, X, ZoomIn, Upload, Trash2, ChevronLeft, ChevronRight, Lock, Unlock, LogOut, Loader2 } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description: string;
  url: string;
  createdAt?: string;
}

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Admin Authentication
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load images and admin state
  useEffect(() => {
    fetchImages();
    const token = localStorage.getItem('club11_admin_token');
    if (token === 'admin-session-club11-token') {
      setIsAdmin(true);
      setAdminToken(token);
    }
  }, []);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setGalleryItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch gallery images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Lightbox handlers
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null && galleryItems.length > 0) {
      const nextIndex = (selectedImageIndex + 1) % galleryItems.length;
      setSelectedImageIndex(nextIndex);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null && galleryItems.length > 0) {
      const prevIndex = (selectedImageIndex - 1 + galleryItems.length) % galleryItems.length;
      setSelectedImageIndex(prevIndex);
    }
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/gallery/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('club11_admin_token', data.token);
        setAdminToken(data.token);
        setIsAdmin(true);
        setShowLoginModal(false);
        setPasswordInput('');
      } else {
        setLoginError(data.error || 'Sikertelen bejelentkezés!');
      }
    } catch (err) {
      setLoginError('Hiba történt a szerverrel való kapcsolat során.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('club11_admin_token');
    setAdminToken(null);
    setIsAdmin(false);
  };

  // Drag and drop uploader handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Csak képfájlokat tölthetsz fel!');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('A kép mérete nem haladhatja meg a 8MB-ot!');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        uploadImage(event.target.result, file.name.split('.')[0]);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (base64Image: string, defaultTitle: string) => {
    if (!adminToken) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/gallery/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim() || defaultTitle,
          description: newDescription.trim() || 'Tulajdonos által feltöltött Club 11 élménykép.',
          image: base64Image,
          token: adminToken
        })
      });

      if (res.ok) {
        const newItem = await res.json();
        setGalleryItems([newItem, ...galleryItems]);
        setNewTitle('');
        setNewDescription('');
      } else {
        const errData = await res.json();
        setUploadError(errData.error || 'Sikertelen képfeltöltés.');
      }
    } catch (err) {
      setUploadError('Hálózati hiba történt a feltöltés során.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const deleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adminToken) return;
    if (!confirm('Biztosan törölni szeretnéd ezt a képet a galériából?')) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: adminToken })
      });

      if (res.ok) {
        setGalleryItems(galleryItems.filter(item => item.id !== id));
        if (selectedImageIndex !== null) {
          setSelectedImageIndex(null);
        }
      } else {
        alert('Nem sikerült törölni a képet.');
      }
    } catch (err) {
      console.error(err);
      alert('Hálózati hiba a törlés során.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12" id="gallery-container">
      {/* Title Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
          Galéria & Pillanatok
        </span>
        <h2 className="text-4xl font-black text-white tracking-tight">Képek a Club 11-ből</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Pillants be a biliárd szalonunk és kávézónk mindennapjaiba a tulajdonos által készített hiteles fotókon keresztül.
        </p>
      </div>

      {/* Admin Panel Header (Controls) */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <Unlock className="w-5 h-5" />
            <span className="text-xs font-bold font-mono">ADMINISZTRÁTORI MÓD AKTÍV</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/30 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            Kilépés az adminból
          </button>
        </motion.div>
      )}

      {/* Owner-Only Upload Panel */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all relative ${
            dragActive 
              ? 'border-emerald-400 bg-emerald-500/5' 
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          id="gallery-upload-box"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Input fields */}
            <div className="md:col-span-7 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Új kép feltöltése a galériába</h3>
                  <p className="text-xs text-slate-400">
                    Add meg a kép adatait, majd válassz ki vagy húzz be egy fotót!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase font-bold">Kép Címe</label>
                  <input
                    type="text"
                    placeholder="Pl. Új Biliárd Asztalaink"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase font-bold">Leírás</label>
                  <input
                    type="text"
                    placeholder="Rövid leírás a képről..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
            
            {/* Action trigger button */}
            <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-3 w-full justify-end">
              <label className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer transition-all w-full sm:w-auto shadow-md shadow-emerald-500/10">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Feltöltés...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Kép kiválasztása
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileInput} 
                  disabled={isUploading}
                  className="hidden" 
                />
              </label>
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">Vagy húzd ide a fájlt</span>
            </div>
          </div>

          {uploadError && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center"
            >
              {uploadError}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Gallery Photo Grid */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs font-mono text-slate-500">Képek betöltése a szerverről...</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {galleryItems.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 rounded-2xl bg-slate-900/10 border border-slate-900 border-dashed text-center space-y-4 max-w-md mx-auto"
            >
              <ImageIcon className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Még nincsenek feltöltött képek</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto px-4">
                  A galéria jelenleg üres. {isAdmin ? 'Használd a fenti admin panelt a saját fotóid feltöltéséhez!' : 'Az üzlet tulajdonosa hamarosan feltölti a saját fotóit.'}
                </p>
              </div>
              {!isAdmin && (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-emerald-400 font-mono font-bold transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Belépés és feltöltés
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              id="gallery-grid"
            >
              {galleryItems.map((item, index) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer aspect-[4/3] flex flex-col justify-end"
                  onClick={() => setSelectedImageIndex(index)}
                  id={`gallery-item-${item.id}`}
                >
                  {/* Image element */}
                  <img
                    src={item.url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                  {/* Interactive hover controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {isAdmin && (
                      <button
                        onClick={(e) => deleteItem(item.id, e)}
                        title="Kép törlése"
                        className="p-2 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white backdrop-blur-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <div className="p-2 rounded-lg bg-slate-950/80 text-emerald-400 backdrop-blur-md border border-slate-800">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* No bottom text labels on cards for a cleaner visual look */}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Bottom Subtle Admin Entry Button (only if not logged in) */}
      {!isAdmin && (
        <div className="pt-8 text-center">
          <button
            onClick={() => setShowLoginModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950/20 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-600 hover:text-slate-400 text-xs font-mono font-bold transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Galéria Admin Belépés
          </button>
        </div>
      )}

      {/* Lightbox / Full-screen View Overlay */}
      <AnimatePresence>
        {selectedImageIndex !== null && galleryItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-lg p-4 sm:p-6"
            onClick={() => setSelectedImageIndex(null)}
            id="gallery-lightbox"
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
              title="Bezárás"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left controller */}
            {galleryItems.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/55 text-slate-400 hover:text-white transition-all z-10"
                title="Előző kép"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right controller */}
            {galleryItems.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/55 text-slate-400 hover:text-white transition-all z-10"
                title="Következő kép"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Lightbox photo & meta container */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-4xl w-full flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 flex justify-center max-h-[70vh]">
                <img
                  src={galleryItems[selectedImageIndex].url}
                  alt={galleryItems[selectedImageIndex].title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>

              {/* Meta */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    Club 11 Élmény
                  </span>
                  {isAdmin && (
                    <button
                      onClick={(e) => deleteItem(galleryItems[selectedImageIndex].id, e)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Fotó törlése
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-black text-white font-sans">{galleryItems[selectedImageIndex].title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {galleryItems[selectedImageIndex].description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Password Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-left"
            >
              {/* Close button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  Adminisztrátori Belépés
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  Kérjük, add meg az admin jelszót a galéria kezeléséhez!
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <input
                  type="password"
                  placeholder="Admin jelszó..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  autoFocus
                />

                {loginError && (
                  <p className="text-[11px] text-rose-400 font-mono text-center">{loginError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-bold transition-all font-mono"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all font-mono shadow-md shadow-emerald-500/10"
                  >
                    Belépés
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
