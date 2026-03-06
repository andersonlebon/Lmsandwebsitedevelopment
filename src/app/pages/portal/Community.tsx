import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Users, Heart, MessageCircle, Share2, Send, ThumbsUp, Clock, Search } from 'lucide-react';

const posts: any[] = [];

const studyGroups: any[] = [];

export function PortalCommunity() {
  const [newPost, setNewPost] = useState('');
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const toggleLike = (id: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Community</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect with fellow BTC students</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* New Post */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: 'var(--btc-primary,#16a34a)' }}>A</div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="Share something with the BTC community..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button disabled={!newPost.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-all" style={{ background: 'var(--btc-primary,#16a34a)' }}>
                    <Send size={14} /> Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: post.color }}>
                  {post.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.author}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${post.color}15`, color: post.color }}>{post.course}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={10} /> {post.time}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{post.text}</p>
              <div className="flex items-center gap-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                <button onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'}`}>
                  <Heart size={14} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                  {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  <MessageCircle size={14} /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-green-500 transition-colors">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Study Groups */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Study Groups</h3>
            <div className="space-y-3">
              {studyGroups.map((g, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{g.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users size={10} /> {g.members} members</p>
                  </div>
                  {g.active && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Browse All Groups
            </button>
          </div>

          {/* Online Users */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4" style={{ fontFamily: 'Poppins' }}>Online Now</h3>
            <div className="flex flex-wrap gap-2">
              {['A', 'J', 'F', 'D', 'G', 'P', 'S', 'Z'].map((initial, i) => (
                <div key={i} className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: ['#16a34a', '#2563eb', '#7c3aed', '#ea580c', '#d946ef', '#0891b2', '#d97706', '#64748b'][i] }}>
                    {initial}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">8 students online</p>
          </div>
        </div>
      </div>
    </div>
  );
}