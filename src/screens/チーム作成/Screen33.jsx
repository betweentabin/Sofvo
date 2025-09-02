import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./style.css";

export const Screen33 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mainContentTop, setMainContentTop] = useState(0);
  const [formData, setFormData] = useState({
    teamName: "",
    activityArea: "",
    selfIntroduction: "",
    teamNamePrivacy: "public",
    activityAreaPrivacy: "public",
    selfIntroductionPrivacy: "public"
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateMainContentPosition = () => {
      const header = document.querySelector(".header-content-outer");
      if (header) {
        const rect = header.getBoundingClientRect();
        setMainContentTop(rect.bottom);
      }
    };

    setTimeout(updateMainContentPosition, 200);
    window.addEventListener("resize", updateMainContentPosition);
    return () => window.removeEventListener("resize", updateMainContentPosition);
  }, []);

  const roles = ["代表", "副代表", "メンバー"];
  const permissions = [
    "管理者任命",
    "プロフィール変更",
    "大会エントリー",
    "大会主催",
    "加入承認",
    "メンバー招待",
  ];

  // 0は空白。1=●, 2=〇。初期値は元の表に準拠。
  const initialMatrix = [
    [1, 2, 0], // 管理者任命
    [1, 1, 0], // プロフィール変更
    [1, 1, 0], // 大会エントリー
    [1, 1, 0], // 大会主催
    [1, 1, 2], // 加入承認
    [1, 1, 1], // メンバー招待
  ];

  const [matrix, setMatrix] = useState(initialMatrix);

  // フォーム入力変更ハンドラー
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
    if (!formData.teamName) newErrors.teamName = "チーム名は必須です";
    if (!formData.activityArea) newErrors.activityArea = "活動地域を選択してください";
    if (!formData.selfIntroduction) newErrors.selfIntroduction = "自己紹介は必須です";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // チーム作成処理
  const handleCreateTeam = async () => {
    if (!validate()) return;
    if (!user) {
      setErrors({ submit: "ログインが必要です" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Supabaseにチームを作成
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.teamName,
          description: formData.selfIntroduction,
          sport_type: "バドミントン", // デフォルト値
          created_by: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // チームメンバーテーブルに作成者を代表として追加
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      console.log("チーム作成成功:", team);
      navigate("/team-manage");
    } catch (error) {
      console.error("チーム作成エラー:", error);
      setErrors({ 
        submit: error.message || "チーム作成に失敗しました。もう一度お試しください。" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCell = (rowIdx, colIdx) => {
    setMatrix((prev) => {
      const newMatrix = prev.map((row) => [...row]);
      const current = newMatrix[rowIdx][colIdx];
      if (current === 0) {
        newMatrix[rowIdx][colIdx] = 1;
      } else if (current === 1) {
        newMatrix[rowIdx][colIdx] = 2;
      } else {
        newMatrix[rowIdx][colIdx] = 1;
      }
      return newMatrix;
    });
  };

  const displayMark = (val) => {
    if (val === 1) return "●";
    if (val === 2) return "〇";
    return "";
  };

  return (
    <div className="screen-33">
      <HeaderContent />
      <div
        className="main-content"
        style={{
          position: "absolute",
          top: `${mainContentTop}px`,
          bottom: "60px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <div className="screen-33">
          <div className="frame-439">
            <div className="frame-440">

              <div className="frame-466">
                <div className="text-wrapper-226">チーム作成</div>
              </div>

              <div className="frame-441">
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">チーム名</div>
                    <div className="text-wrapper-217">*</div>
                  </div>

                  <div className="frame-444">
                    <div className="text-wrapper-218">公開</div>
                  </div>
                </div>

                <input
                  type="text"
                  className="frame-445"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange("teamName", e.target.value)}
                  placeholder="チーム名を入力"
                />
                {errors.teamName && <div style={{color: "#c62828", fontSize: "12px", marginTop: "4px"}}>{errors.teamName}</div>}
              </div>

              <div className="frame-447">
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">活動地域</div>
                    <div className="text-wrapper-217">*</div>
                  </div>

                  <select 
                    className="custom-select2"
                    value={formData.activityAreaPrivacy}
                    onChange={(e) => handleInputChange("activityAreaPrivacy", e.target.value)}
                  >
                    <option value="public">公開</option>
                    <option value="private">非公開</option>
                  </select>
                </div>

                <select 
                  className="custom-select"
                  value={formData.activityArea}
                  onChange={(e) => handleInputChange("activityArea", e.target.value)}
                >
                  <option value="">選択してください</option>
                  <option value="shizuoka">静岡市</option>
                  <option value="hamamatsu">浜松市</option>
                  <option value="fuji">富士市</option>
                  <option value="numazu">沼津市</option>
                </select>
                {errors.activityArea && <div style={{color: "#c62828", fontSize: "12px", marginTop: "4px"}}>{errors.activityArea}</div>}
              </div>

              <div className="frame-441">
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">限定設定</div>
                    <div className="text-wrapper-217">*</div>
                  </div>
                </div>

                <div className="frame-449">
                  <div className="frame-450">
                    <div className="frame-451">
                      <div className="frame-452" />

                      <div className="frame-453">
                        <div className="text-wrapper-220-1">代表</div>
                      </div>

                      <div className="frame-454">
                        <div className="text-wrapper-220-2">副代表</div>
                      </div>

                      <div className="frame-455">
                        <div className="text-wrapper-220-3">メンバー</div>
                      </div>
                    </div>
                  </div>

                  {permissions.map((perm, rowIdx) => (
                    <div key={perm} className="frame-456">
                      <div className="frame-451">
                        <div className="frame-457">
                          <div className="text-wrapper-222">{perm}</div>
                        </div>

                        {roles.map((_, colIdx) => (
                          <div
                            key={colIdx}
                            className={colIdx === 0 ? "frame-458" : colIdx === 1 ? "frame-458" : "frame-459"}
                            style={{
                              cursor: matrix[rowIdx][colIdx] === 0 ? "default" : "pointer",
                              userSelect: "none",
                              fontSize: "20px",
                              lineHeight: "28px",
                              textAlign: "center",
                            }}
                            onClick={() => {
                              if (matrix[rowIdx][colIdx] !== 0) {
                                toggleCell(rowIdx, colIdx);
                              }
                            }}
                          >
                            {displayMark(matrix[rowIdx][colIdx])}
                          </div>
                        ))}

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="frame-441">
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">自己紹介</div>
                    <div className="text-wrapper-217">*</div>
                  </div>

                  <select 
                    className="frame-444 custom-select2"
                    value={formData.selfIntroductionPrivacy}
                    onChange={(e) => handleInputChange("selfIntroductionPrivacy", e.target.value)}
                  >
                    <option value="public">公開</option>
                    <option value="private">非公開</option>
                  </select>
                </div>

                <textarea
                  className="frame-462"
                  rows={4}
                  value={formData.selfIntroduction}
                  onChange={(e) => handleInputChange("selfIntroduction", e.target.value)}
                  placeholder="チームの自己紹介を入力してください"
                />
                {errors.selfIntroduction && <div style={{color: "#c62828", fontSize: "12px", marginTop: "4px"}}>{errors.selfIntroduction}</div>}
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

          <div className="frame-463">
            <Link to="/settings" className="frame-464">
              <div className="text-wrapper-224">戻る</div>
            </Link>

            <button 
              onClick={handleCreateTeam}
              className="frame-465"
              style={{ 
                border: "none", 
                textDecoration: "none", 
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1
              }}
              disabled={isLoading}
            >
              <div className="text-wrapper-225">
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
