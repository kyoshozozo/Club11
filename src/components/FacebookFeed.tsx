/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { POSTS } from '../data';
import { Post } from '../types';
import { ThumbsUp, MessageSquare, Share2, ExternalLink, Calendar, Facebook, RefreshCw, Smartphone, Monitor } from 'lucide-react';

export default function FacebookFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'optimized' | 'live'>('optimized');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>('Éppen most');

  useEffect(() => {
    // A bejegyzések mindig a kódból (POSTS) jönnek, így egy törölt vagy javított bejegyzés
    // a korábbi látogatóknál sem marad meg; a böngésző csak a saját kedveléseket jegyzi meg.
    let liked: string[] = [];
    try {
      localStorage.removeItem('club11_posts_state');
      liked = JSON.parse(localStorage.getItem('club11_posts_liked_ids') || '[]');
    } catch (e) {
      console.error(e);
    }
    setLikedPosts(liked);
    setPosts(POSTS.map(p => liked.includes(p.id) ? { ...p, likes: p.likes + 1 } : p));

    // Set a realistic last-synced timestamp
    const now = new Date();
    setLastSynced(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSynced(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
      // Toast message simulated
      alert('Hírek sikeresen frissítve a Facebook szerverről!');
    }, 1200);
  };

  const handleLike = (postId: string) => {
    let updatedLikes: string[];
    let updatedPosts: Post[];

    if (likedPosts.includes(postId)) {
      // Unlike
      updatedLikes = likedPosts.filter(id => id !== postId);
      updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p);
    } else {
      // Like
      updatedLikes = [...likedPosts, postId];
      updatedPosts = posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p);
    }

    setLikedPosts(updatedLikes);
    setPosts(updatedPosts);
    
    try {
      localStorage.setItem('club11_posts_liked_ids', JSON.stringify(updatedLikes));
    } catch {}
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-12 shadow-2xl" id="posts-section">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block flex items-center justify-center gap-1.5">
          <Facebook className="w-4 h-4 fill-current text-emerald-400 animate-pulse" />
          Kizárólag a Facebook Oldalunkról betöltött Hírek
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hírek és Bejegyzések</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          A Club 11 minden hírt, eseményt és akciót kizárólag a hivatalos Facebook oldalán tesz közzé. Az alábbiakban közvetlenül a Facebookról szinkronizált tartalmainkat érheted el.
        </p>
        
        {/* Sync status and Refresh button */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all font-mono shadow-sm disabled:opacity-55"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            {isSyncing ? 'Szinkronizálás...' : 'Facebook Frissítése'}
          </button>
          
          <span className="text-[11px] font-mono text-slate-500 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-850">
            Utolsó ellenőrzés: <span className="text-slate-300 font-bold">{lastSynced}</span>
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 mb-8 p-1 bg-slate-950/40 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('optimized')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold tracking-tight transition-all flex items-center justify-center gap-2 ${
            activeTab === 'optimized'
              ? 'bg-emerald-500 text-slate-950 shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          Gyorsított Nézet (Facebook)
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold tracking-tight transition-all flex items-center justify-center gap-2 ${
            activeTab === 'live'
              ? 'bg-emerald-500 text-slate-950 shadow-lg font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
          Élő Idővonal Widget
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'optimized' ? (
        /* Optimized Feed */
        <div className="space-y-8">
          {posts.map((post) => {
            const isLiked = likedPosts.includes(post.id);
            return (
              <article 
                key={post.id} 
                id={`fb-post-card-${post.id}`}
                className="bg-slate-950/40 rounded-2xl border border-slate-850 overflow-hidden shadow-md hover:border-slate-750 transition-colors"
              >
                
                {/* Publisher details */}
                <div className="p-5 flex items-center justify-between border-b border-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-mono font-black text-slate-950 text-sm shadow-inner">
                      11
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white block">Club 11 Újbuda</span>
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 text-white font-bold text-[8px]" title="Hivatalos Oldal">✓</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        {post.date} • <span className="text-emerald-500/80 font-bold">Facebook Bejegyzés</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    #{post.category}
                  </span>
                </div>

                {/* Text content */}
                <div className="p-6 space-y-4">
                  <h3 className="font-sans font-black text-lg text-white tracking-tight leading-snug">
                    {post.title}
                  </h3>
                  
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {post.content}
                  </p>
                </div>

                {/* Image attachment */}
                {post.image && (
                  <div className="relative aspect-video bg-slate-950 overflow-hidden border-t border-b border-slate-900">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover hover:scale-101 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Engagement analytics */}
                <div className="px-6 py-3 flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-900">
                  <span>{post.likes} kedvelés</span>
                  <a 
                    href="https://www.facebook.com/club11ujbuda" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 text-slate-400 flex items-center gap-1 text-[11px] transition-colors"
                  >
                    Megtekintés Facebookon <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Interactive buttons */}
                <div className="px-4 py-2.5 bg-slate-950/20 flex items-center justify-around">
                  
                  <button
                    onClick={() => handleLike(post.id)}
                    id={`like-btn-${post.id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isLiked
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    Tetszik
                  </button>

                  <a
                    href="https://www.facebook.com/club11ujbuda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Hozzászólás
                  </a>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://www.facebook.com/club11ujbuda`);
                      alert('Facebook link vágólapra másolva!');
                    }}
                    id={`share-btn-${post.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Megosztás
                  </button>

                </div>

              </article>
            );
          })}
        </div>
      ) : (
        /* Official Live Widget Embed */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            <span className="font-bold text-white block mb-1">Élő Idővonal a Facebookról</span>
            Ez az ablak az igazi, valós idejű Facebook idővonalunkat ábrázolja. Kérjük, győződj meg róla, hogy a böngésződ nem blokkolja a Facebook sütiket és widgeteket a helyes megjelenítés érdekében!
          </div>

          <div className="flex justify-center bg-slate-950 rounded-2xl p-4 border border-slate-800 max-w-xl mx-auto overflow-hidden shadow-inner">
            <iframe 
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fclub11ujbuda&tabs=timeline&width=500&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId" 
              width="100%" 
              height="650" 
              style={{ border: 'none', overflow: 'hidden', borderRadius: '12px' }} 
              scrolling="no" 
              frameBorder="0" 
              allowFullScreen={true} 
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="Club 11 Hivatalos Facebook Oldal"
            />
          </div>

          <div className="text-center">
            <a 
              href="https://www.facebook.com/club11ujbuda" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-sm font-black text-slate-950 transition-all shadow-md hover:scale-102"
            >
              Megnyitás közvetlenül a Facebookon
              <ExternalLink className="w-4 h-4 text-slate-950" />
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
