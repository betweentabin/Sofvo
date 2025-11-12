import React, { useState } from "react";
import api from "../../services/api";
import "./style.css";

export const ReportModal = ({ isOpen, onClose, targetType, targetId, targetName }) => {
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    { value: "spam", label: "スパム・宣伝" },
    { value: "harassment", label: "嫌がらせ・誹謗中傷" },
    { value: "inappropriate", label: "不適切なコンテンツ" },
    { value: "fake", label: "なりすまし・偽アカウント" },
    { value: "violence", label: "暴力的な表現" },
    { value: "hate_speech", label: "差別的な発言" },
    { value: "other", label: "その他" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      await api.reports.submit({
        reported_type: targetType,
        reported_id: targetId,
        reason,
        description: description.trim() || undefined
      });

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Report submission error:", error);
      alert("報告の送信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("spam");
    setDescription("");
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <div className="report-modal-success">
            <div className="report-modal-success-icon">✓</div>
            <h3>報告を受け付けました</h3>
            <p>ご報告ありがとうございます。運営チームで確認いたします。</p>
          </div>
        ) : (
          <>
            <div className="report-modal-header">
              <h3>報告</h3>
              <button
                type="button"
                className="report-modal-close"
                onClick={handleClose}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="report-modal-body">
                <div className="report-modal-target">
                  <strong>{targetName}</strong> を報告します
                </div>

                <div className="report-modal-field">
                  <label htmlFor="report-reason">報告理由を選択してください</label>
                  <select
                    id="report-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  >
                    {reasons.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="report-modal-field">
                  <label htmlFor="report-description">
                    詳細（任意）
                  </label>
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="具体的な状況を記入してください（任意）"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="report-modal-char-count">
                    {description.length} / 500
                  </div>
                </div>

                <div className="report-modal-notice">
                  ※ 虚偽の報告や悪意のある報告は、アカウント停止の対象となる場合があります。
                </div>
              </div>

              <div className="report-modal-footer">
                <button
                  type="button"
                  className="report-modal-button cancel"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="report-modal-button submit"
                  disabled={submitting}
                >
                  {submitting ? "送信中..." : "報告する"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
