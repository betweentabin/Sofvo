import React from 'react';
import { Link } from 'react-router-dom';

const PostCard = ({ post, onLike, liked = false }) => {
  const displayName = post?.profiles?.display_name || post?.profiles?.username || 'ユーザー';
  const avatarUrl = post?.profiles?.avatar_url || post?.avatar_url;
  const images = Array.isArray(post?.image_urls) && post.image_urls.length
    ? post.image_urls
    : (post?.file_url ? [post.file_url] : []);

  const profileId = post?.profiles?.id;
  return (
    <div className="post-card">
      <Link to={profileId ? `/profile/${profileId}` : '/my-profile'} className="post-header" style={{ textDecoration: 'none' }}>
        <div className="post-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              👤
            </div>
          )}
        </div>
        <div className="post-author" style={{ cursor: 'pointer' }}>{displayName}</div>
      </Link>

      <div className="post-details">
        {post?.tournaments ? (
          <>
            <div className="post-line">大会名：{post.tournaments?.name || '大会名未設定'}</div>
            <div className="post-line">開催日時：{post.tournaments?.start_date ? new Date(post.tournaments.start_date).toLocaleDateString('ja-JP') : '未定'}</div>
            <div className="post-line">試合結果：{post.position ? `第${post.position}位` : '未確定'}</div>
            <div className="post-line">獲得ポイント：{post.points || 0}P</div>
            {post.memo && <div className="post-line">メモ：{post.memo}</div>}
          </>
        ) : (
          <>
            {post?.content && <div className="post-line">{post.content}</div>}
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="post-images">
          {images.map((src, i) => (
            <img key={i} className="post-image" src={src} alt={`post-${i}`} />
          ))}
        </div>
      )}

      <div className="post-footer">
        {post?.tournament_id ? (
          <Link to={`/tournament-detail/${post.tournament_id}`} className="post-cta">大会概要</Link>
        ) : <span />}
        <button className="post-like" onClick={onLike} type="button">
          <img className="heart-icon" src="/img/vector-25.svg" alt="like" />
          <span>{(typeof post.like_count === 'number' ? post.like_count : 0) + (liked ? (post.liked ? 0 : 1) : (post.liked ? 0 : 0))} いいね</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
