import React from 'react';
import { Link } from 'react-router-dom';

// Generic Post card styled like the tournament post layout screenshot
export const PostCard = ({ post, onLike, liked = false }) => {
  const displayName = post?.profiles?.display_name || post?.profiles?.username || 'ユーザー';
  const images = Array.isArray(post?.image_urls) && post.image_urls.length
    ? post.image_urls
    : (post?.file_url ? [post.file_url] : []);

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar" />
        <div className="post-author">{displayName}</div>
      </div>

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

      <div className="post-images">
        {[0,1,2,3,4].map((i) => {
          const src = images[i];
          return src ? (
            <img key={i} className="post-image" src={src} alt={`post-${i}`} />
          ) : (
            <div key={i} className="post-image ph" />
          );
        })}
      </div>

      <div className="post-footer">
        {post?.tournament_id ? (
          <Link to={`/tournament-detail/${post.tournament_id}`} className="post-cta">大会概要</Link>
        ) : <span />}
        <button className="post-like" onClick={onLike} type="button">
          <img className="heart-icon" src="/img/vector-25.svg" alt="like" />
          <span>{liked ? 1 : 0} いいね</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;

