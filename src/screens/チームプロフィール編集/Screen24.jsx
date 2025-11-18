import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen24 = () => {
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [team, setTeam] = useState({ name: "", location: "", description: "" });
  const [area, setArea] = useState("");
  const [teamId, setTeamId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await api.railwayTeams.getOwnerTeam(user.id);
        // APIはオブジェクトまたはnullを返す
        const t = data;
        if (active && t) {
          setTeam({
            name: t.name || "",
            location: t.location || "",
            description: t.description || "",
          });
          setTeamId(t.id || null);
          // 選択肢に該当すれば初期選択、なければ空
          const knownAreas = ["静岡市", "浜松市", "富士市", "沼津市"];
          const match = knownAreas.find(a => (t.location || "").includes(a));
          setArea(match || "");
        }
      } catch (e) {
        console.error('failed to load owner team', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user]);

  
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
    <div className="screen-24">
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
        <div className="screen-24">
          <div className="frame-439">
            <div className="frame-440">

              <div className="frame-466">
                <div className="text-wrapper-226">チームプロフィール編集</div>
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
                  value={team.name}
                  onChange={(e) => setTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="チーム名を入力"
                />
              </div>

              <div className="frame-447">
                <div className="frame-442">
                  <div className="frame-443">
                    <div className="text-wrapper-216">活動地域</div>
                    <div className="text-wrapper-217">*</div>
                  </div>

                  <select className="custom-select2">
                    <option value="public">公開</option>
                    <option value="private">非公開</option>
                  </select>
                </div>

                <select 
                  className="custom-select"
                  value={area}
                  onChange={(e) => {
                    const v = e.target.value;
                    setArea(v);
                    setTeam(prev => ({ ...prev, location: v }));
                  }}
                >
                  <option value="">選択してください</option>
                  <option value="静岡市">静岡市</option>
                  <option value="浜松市">浜松市</option>
                  <option value="富士市">富士市</option>
                  <option value="沼津市">沼津市</option>
                </select>
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

                  <div className="frame-444">
                    <div className="text-wrapper-218">公開</div>
                  </div>
                </div>

                <textarea
                  className="frame-462"
                  rows={4}
                  value={team.description}
                  onChange={(e) => setTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="チームの自己紹介を入力"
                />
              </div>
            </div>
          </div>

          <div className="frame-463">
            <Link to="/settings" className="frame-464">
              <div className="text-wrapper-224">戻る</div>
            </Link>

            <button
              className="frame-465"
              type="button"
              disabled={saving || !teamId}
              onClick={async () => {
                if (!user?.id || !teamId) return;
                setSaving(true);
                try {
                  await api.railwayTeams.updateTeam(user.id, teamId, {
                    name: team.name,
                    location: team.location,
                    description: team.description,
                  });
                  alert('チームプロフィールを保存しました');
                } catch (e) {
                  console.error('failed to update team', e);
                  alert('保存に失敗しました。時間をおいて再度お試しください。');
                } finally {
                  setSaving(false);
                }
              }}
              style={{ border: 'none', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
            >
              <div className="text-wrapper-225">{saving ? '保存中...' : '完了'}</div>
            </button>
          </div>
        </div>
      </div>
      <Footer currentPage="team-create" />
    </div>
  );
};
