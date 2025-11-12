import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { ReportModal } from "../ReportModal";
import "./style.css";

export const UserActions = ({ userId, username, isOwnProfile }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!isOwnProfile && userId) {
      checkBlockStatus();
    }
  }, [userId, isOwnProfile]);

  const checkBlockStatus = async () => {
    try {
      const { data } = await api.users.checkBlockStatus(userId);
      setIsBlocked(data.isBlocked);
    } catch (error) {
      console.error("Error checking block status:", error);
    }
  };

  const handleBlock = async () => {
    const confirmed = window.confirm(
      `${username} をブロックしますか？\n\nブロックすると、以下のようになります:\n- お互いのプロフィールが表示されなくなります\n- メッセージのやり取りができなくなります\n- フォロー関係が解除されます`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      await api.users.blockUser(userId);
      setIsBlocked(true);
      setShowMenu(false);
      alert(`${username} をブロックしました。`);
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("ブロックに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async () => {
    const confirmed = window.confirm(
      `${username} のブロックを解除しますか？`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      await api.users.unblockUser(userId);
      setIsBlocked(false);
      setShowMenu(false);
      alert(`${username} のブロックを解除しました。`);
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("ブロック解除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  if (isOwnProfile) {
    return null; // 自分のプロフィールでは表示しない
  }

  return (
    <>
      <div className="user-actions">
        <button
          type="button"
          className="user-actions-trigger"
          onClick={() => setShowMenu(!showMenu)}
          disabled={loading}
          aria-label="その他のアクション"
        >
          ⋮
        </button>

        {showMenu && (
          <>
            <div
              className="user-actions-overlay"
              onClick={() => setShowMenu(false)}
            />
            <div className="user-actions-menu">
              <button
                type="button"
                className="user-actions-item report"
                onClick={handleReport}
              >
                <span className="user-actions-icon">⚠️</span>
                報告する
              </button>

              {isBlocked ? (
                <button
                  type="button"
                  className="user-actions-item unblock"
                  onClick={handleUnblock}
                  disabled={loading}
                >
                  <span className="user-actions-icon">🔓</span>
                  {loading ? "処理中..." : "ブロックを解除"}
                </button>
              ) : (
                <button
                  type="button"
                  className="user-actions-item block"
                  onClick={handleBlock}
                  disabled={loading}
                >
                  <span className="user-actions-icon">🚫</span>
                  {loading ? "処理中..." : "ブロックする"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="user"
        targetId={userId}
        targetName={username}
      />
    </>
  );
};
