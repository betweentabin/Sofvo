import React, { useState, useEffect } from 'react';

export const PostComposer = ({ isOpen, onClose, onSubmit, maxLength = 280, allowImage = true }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const remaining = maxLength - content.length;

  useEffect(() => {
    if (isOpen) setContent('');
  }, [isOpen]);

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 1100,
    },
    sheet: {
      background: '#fff',
      width: '100%',
      maxWidth: 640,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 16,
      boxSizing: 'border-box',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: { fontSize: 14, fontWeight: 'bold', color: '#0B4F7F' },
    close: {
      border: 'none',
      background: 'transparent',
      color: '#0B4F7F',
      fontSize: 12,
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    textarea: {
      width: '100%',
      minHeight: 100,
      border: '1px solid #D4D4D4',
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      boxSizing: 'border-box',
      resize: 'vertical',
      outline: 'none',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    counter: {
      fontSize: 12,
      color: remaining < 0 ? '#C62828' : '#666',
    },
    actions: { display: 'flex', gap: 8 },
    cancel: {
      background: '#fff',
      border: '1px solid #D4D4D4',
      borderRadius: 6,
      padding: '8px 14px',
      fontSize: 13,
      cursor: 'pointer',
    },
    submit: (disabled) => ({
      background: disabled ? '#9BB9CE' : '#0B4F7F',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      padding: '8px 14px',
      fontSize: 13,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }),
  };

  const handleSubmit = async () => {
    if (!content.trim() || remaining < 0) return;
    await onSubmit(content.trim(), file || null);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>いまどうしてる？</div>
          <button style={styles.close} onClick={onClose}>閉じる</button>
        </div>
        <textarea
          style={styles.textarea}
          maxLength={maxLength + 1000} // allow typing over but counter enforces
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ざっくばらんに投稿しよう"
        />
        <div style={styles.footer}>
          <div style={styles.counter}>{remaining}</div>
          <div style={styles.actions}>
            {allowImage && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12 }}
              />
            )}
            <button style={styles.cancel} onClick={onClose}>キャンセル</button>
            <button style={styles.submit(!content.trim() || remaining < 0)} onClick={handleSubmit} disabled={!content.trim() || remaining < 0}>
              投稿
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
