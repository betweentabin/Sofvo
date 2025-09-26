import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
// Supabase removed: Railway-only
import api from "../../services/api";
import "./style.css";

export const Screen37 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mainContentTop = useHeaderOffset();

  // フォーム状態管理
  const [formData, setFormData] = useState({
    tournamentName: "",
    date: "",
    location: "",
    address: "",
    venue: "",
    ballType: "",
    category: "",
    competitionMethod: "",
    rankingMethod: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const USE_RAILWAY = true;
  const RAILWAY_TEST_USER = import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  
  // 入力変更ハンドラー
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // バリデーション
  const validate = () => {
    const newErrors = {};
    if (!formData.tournamentName) newErrors.tournamentName = "大会名は必須です";
    if (!formData.date) newErrors.date = "開催日時は必須です";
    if (!formData.location) newErrors.location = "開催地域は必須です";
    if (!formData.venue) newErrors.venue = "開催場所は必須です";
    if (!formData.address) newErrors.address = "住所は必須です";
    if (!formData.category) newErrors.category = "種別は必須です";
    if (!formData.competitionMethod) newErrors.competitionMethod = "競技方法は必須です";
    if (!formData.rankingMethod) newErrors.rankingMethod = "順位方法は必須です";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 大会作成処理
  const handleCreateTournament = async () => {
    if (!validate()) return;
    if (!user) {
      setErrors({ submit: "ログインが必要です" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const asUserId = RAILWAY_TEST_USER || user.id;
      const payload = {
        name: formData.tournamentName,
        description: `競技方法: ${formData.competitionMethod}, 順位方法: ${formData.rankingMethod}`,
        sport_type: 'バレーボール',
        start_date: formData.date,
        location: `${formData.location} ${formData.venue} (${formData.address})`,
        status: 'upcoming',
      };
      const { data } = await api.railwayTournaments.create(asUserId, payload);
      console.log('大会作成成功(railway):', data);
      navigate('/tournament-manage');
    } catch (error) {
      console.error("大会作成エラー:", error);
      setErrors({ 
        submit: error.message || "大会作成に失敗しました。もう一度お試しください。" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screen-37">
      <HeaderContent />
      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px", // フッター高さ
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="screen-37">
          <div className="frame-532">
            <div className="frame-533">

              <div className="frame-466">
                <div className="text-wrapper-226">プロフィールを編集</div>
              </div>


              {/* 大会名 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">大会名</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={formData.tournamentName}
                  onChange={(e) => handleInputChange("tournamentName", e.target.value)}
                  className="input-field"
                  placeholder="大会名を入力"
                />
                {errors.tournamentName && <div style={{color: "#c62828", fontSize: "12px", marginTop: "4px"}}>{errors.tournamentName}</div>}
              </div>

              {/* 開催日時 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催日時</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="input-field"
                />
                {errors.date && <div className="error-text">{errors.date}</div>}
              </div>

              {/* 開催地域 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催地域</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <select
                  className="custom-select"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="静岡県">静岡県</option>
                  <option value="東京都">東京都</option>
                  <option value="神奈川県">神奈川県</option>
                  <option value="愛知県">愛知県</option>
                </select>
                {errors.location && <div className="error-text">{errors.location}</div>}
              </div>

              {/* 開催場所 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">開催場所</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange("venue", e.target.value)}
                  className="input-field"
                  placeholder="体育館名などを入力"
                />
                {errors.venue && <div className="error-text">{errors.venue}</div>}
              </div>

              {/* 住所 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">住所</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="input-field"
                  placeholder="住所を入力"
                />
                {errors.address && <div className="error-text">{errors.address}</div>}
              </div>

              {/* 試合球 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">試合球</div>
                </div>
                <input
                  type="text"
                  value={formData.ballType}
                  onChange={(e) => handleInputChange("ballType", e.target.value)}
                  className="input-field"
                  placeholder="使用する球を入力"
                />
              </div>

              {/* 種別 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">種別</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <select
                  className="custom-select"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="男子">男子</option>
                  <option value="女子">女子</option>
                  <option value="混合">混合</option>
                  <option value="ミックス">ミックス</option>
                </select>
                {errors.category && <div className="error-text">{errors.category}</div>}
              </div>

              {/* 競技方法 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">競技方法</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <select
                  className="custom-select"
                  value={formData.competitionMethod}
                  onChange={(e) => handleInputChange("competitionMethod", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="リーグ戦">リーグ戦</option>
                  <option value="トーナメント">トーナメント</option>
                  <option value="スイスドロー">スイスドロー</option>
                </select>
                {errors.competitionMethod && <div className="error-text">{errors.competitionMethod}</div>}
              </div>

              {/* 順位方法 */}
              <div className="frame-535">
                <div className="frame-536">
                  <div className="text-wrapper-260">順位方法</div>
                  <div className="text-wrapper-261">*</div>
                </div>
                <select
                  className="custom-select"
                  value={formData.rankingMethod}
                  onChange={(e) => handleInputChange("rankingMethod", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="勝数">勝数</option>
                  <option value="得失点差">得失点差</option>
                  <option value="ポイント制">ポイント制</option>
                </select>
                {errors.rankingMethod && <div className="error-text">{errors.rankingMethod}</div>}
              </div>

            </div>
          </div>

          {errors.submit && (
            <div style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "12px",
              borderRadius: "4px",
              margin: "16px",
              fontSize: "14px"
            }}>
              {errors.submit}
            </div>
          )}

          <div className="frame-540">
            <Link to="/team-management" className="frame-541">
              <div className="text-wrapper-263">戻る</div>
            </Link>

            <button
              onClick={handleCreateTournament}
              className="frame-542"
              style={{ 
                border: "none", 
                textDecoration: "none", 
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1
              }}
              disabled={isLoading}
            >
              <div className="text-wrapper-264">
                {isLoading ? "作成中..." : "完了"}
              </div>
            </button>
          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
