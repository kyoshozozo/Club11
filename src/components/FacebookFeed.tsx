/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { POSTS } from '../data';
import { Post } from '../types';
import { ThumbsUp, MessageSquare, Share2, ExternalLink, Calendar, Facebook } from 'lucide-react';

export default function FacebookFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  useEffect(() => {
    // Load posts state from localStorage if available, or initialize from static POSTS
    const savedPosts = localStorage.getItem('club11_posts_state');
    const savedLikes = localStorage.getItem('club11_posts_liked_ids');
    
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        setPosts(POSTS);
      }
    } else {
      setPosts(POSTS);
    }

    if (savedLikes) {
      try {
        setLikedPosts(JSON.parse(savedLikes));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

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
    
    localStorage.setItem('club11_posts_liked_ids', JSON.stringify(updatedLikes));
    localStorage.setItem('club11_posts_state', JSON.stringify(updatedPosts));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-4xl mx-auto my-12 shadow-2xl" id="posts-section">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-10">
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block flex items-center justify-center gap-1.5">
          <Facebook className="w-4 h-4 fill-current text-emerald-400" />
          Facebook Hírcsatorna (Club 11 Hírek)
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Közösségi Bejegyzéseink</h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm">
          Értesülj elsőként a háziversenyekről, italakciókról és a Club 11 életéről! A friss bejegyzéseket közvetlenül a Facebook oldalunkról gyűjtöttük össze.
        </p>
        
        <a 
          href="https://www.facebook.com/club11ujbuda" 
          target="_blank" 
          rel="noopener noreferrer"
          id="facebook-external-link"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all font-mono shadow-sm"
        >
          Keresd fel a hivatalos Facebook oldalunkat
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Posts Stream */}
      <div className="space-y-8">
        {posts.map((post) => {
          const isLiked = likedPosts.includes(post.id);
          return (
            <article 
              key={post.id} 
              id={`fb-post-card-${post.id}`}
              className="bg-slate-950/40 rounded-2xl border border-slate-850 overflow-hidden shadow-md"
            >
              
              {/* Publisher details */}
              <div className="p-5 flex items-center justify-between border-b border-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center font-mono font-black text-slate-950 text-sm">
                    11
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">Club 11 Újbuda</span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      {post.date}
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
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Engagement analytics */}
              <div className="px-6 py-3 flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-900">
                <span>{post.likes} kedvelés</span>
                <span>Club 11 Újbuda rajongók</span>
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

    </div>
  );
}
