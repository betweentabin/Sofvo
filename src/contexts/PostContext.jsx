import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { PostComposer } from '../components/PostComposer';

const PostContext = createContext();

export const usePost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePost must be used within PostProvider');
  }
  return context;
};

export const PostProvider = ({ children }) => {
  const { user } = useAuth();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const RUNTIME = typeof window !== 'undefined' ? (window.__APP_CONFIG__ || {}) : {};
  const RAILWAY_TEST_USER = RUNTIME.testUserId || import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  const openComposer = () => setIsComposerOpen(true);
  const closeComposer = () => setIsComposerOpen(false);

  const handlePostSubmit = async (content, file = null) => {
    if (!user?.id) {
      alert('ログインが必要です');
      return;
    }

    try {
      const asUserId = RAILWAY_TEST_USER || user.id;
      let fileUrl = null;

      // File upload (if needed)
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('as_user', asUserId);

        try {
          const uploadRes = await api.railwayPosts.uploadImage(formData);
          fileUrl = uploadRes.data?.url || null;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('画像のアップロードに失敗しました');
          return;
        }
      }

      // Create post
      const payload = {
        as_user: asUserId,
        content,
        visibility: 'public',
      };

      if (fileUrl) {
        payload.image_urls = [fileUrl];
      }

      await api.railwayPosts.create(payload);

      closeComposer();

      // Reload page to show new post
      window.location.reload();
    } catch (error) {
      console.error('Post creation failed:', error);
      alert('投稿に失敗しました');
    }
  };

  return (
    <PostContext.Provider value={{ openComposer, closeComposer }}>
      {children}
      <PostComposer
        isOpen={isComposerOpen}
        onClose={closeComposer}
        onSubmit={handlePostSubmit}
      />
    </PostContext.Provider>
  );
};
