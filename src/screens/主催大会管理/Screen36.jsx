import React, { useEffect, useState } from "react";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen36 = () => {
  const mainContentTop = useHeaderOffset();
  const { user } = useAuth();
  const USE_RAILWAY = import.meta.env.VITE_RAILWAY_DATA === 'true';
  const RAILWAY_TEST_USER = import.meta.env.VITE_RAILWAY_TEST_USER_ID || null;

  const [tournaments, setTournaments] = useState([]);
  const [allTournaments, setAllTournaments] = useState([]); // 全大会データ
  const [selectedYearMonth, setSelectedYearMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 前後1年分（24ヶ月）の年月を生成
  const generateYearMonthOptions = () => {
    const options = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    // 1年前から1年後までの24ヶ月
    for (let i = -12; i <= 11; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      options.push({
        value: `${year}-${String(month).padStart(2, '0')}`,
        label: `${year}年${month}月`
      });
    }
    return options;
  };

  const yearMonthOptions = generateYearMonthOptions();

  // 選択された年月の日数を生成
  const generateDayOptions = () => {
    if (!selectedYearMonth) return [];

    const [year, month] = selectedYearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const options = [];
    for (let day = 1; day <= daysInMonth; day++) {
      options.push({
        value: String(day),
        label: `${day}日`
      });
    }
    return options;
  };

  const dayOptions = generateDayOptions();

  const parseLocation = (loc) => {
    if (!loc) return { region: "", place: "", address: "" };
    let address = "";
    let rest = loc;
    const m = loc.match(/^(.*)\((.*)\)\s*$/);
    if (m) {
      rest = m[1].trim();
      address = m[2].trim();
    }
    const parts = rest.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { region: rest, place: "", address };
    const region = parts[0];
    const place = parts.slice(1).join(" ");
    return { region, place, address };
  };

  const parseDescription = (desc) => {
    const methodMatch = desc?.match(/競技方法\s*[:：]\s*([^,，]+)/);
    const rankingMatch = desc?.match(/順位方法\s*[:：]\s*([^,，]+)/);
    return {
      method: methodMatch ? methodMatch[1].trim() : "",
      ranking: rankingMatch ? rankingMatch[1].trim() : "",
    };
  };

  useEffect(() => {
    const load = async () => {
      if (!USE_RAILWAY) return; // 従来の静的表示のまま
      const asUserId = RAILWAY_TEST_USER || user?.id;
      if (!asUserId) return;
      try {
        console.log('大会データを読み込み中...');
        const { data } = await api.railwayTournaments.listMyHosted(asUserId);
        console.log('読み込んだ大会データ:', data);

        const mapped = (data || []).map((t) => {
          const { region, place, address } = parseLocation(t.location);
          const { method, ranking } = parseDescription(t.description);
          const date = t.start_date ? new Date(t.start_date).toLocaleDateString('ja-JP') : "";
          const startDate = t.start_date ? new Date(t.start_date) : null;

          return {
            id: t.id,
            name: t.name,
            date,
            startDate, // 検索用
            region,
            place,
            address,
            ball: "", // 未設定（必要に応じてdescription等から拡張）
            type: t.sport_type || "",
            method: method || "",
            ranking: ranking || "",
            showButton: true,
          };
        });

        setAllTournaments(mapped);
        setTournaments(mapped);
        console.log('大会データ読み込み完了:', mapped.length + '件');
      } catch (e) {
        console.error('大会データの読み込みに失敗:', e);
        alert('大会データの読み込みに失敗しました: ' + e.message);
      }
    };
    load();
  }, [USE_RAILWAY, RAILWAY_TEST_USER, user]);

  // 検索機能
  const handleSearch = () => {
    console.log('=== 大会検索開始 ===');
    console.log('選択された年月:', selectedYearMonth);
    console.log('選択された日:', selectedDay);

    setIsSearching(true);

    try {
      let filtered = [...allTournaments];

      // 日付でフィルター
      if (selectedYearMonth && selectedDay) {
        const [year, month] = selectedYearMonth.split('-').map(Number);
        const day = parseInt(selectedDay);

        filtered = filtered.filter(tournament => {
          if (!tournament.startDate) return false;

          const tDate = tournament.startDate;
          return (
            tDate.getFullYear() === year &&
            tDate.getMonth() + 1 === month &&
            tDate.getDate() === day
          );
        });

        console.log(`検索結果: ${filtered.length}件`);
      } else if (selectedYearMonth) {
        // 年月のみ選択されている場合
        const [year, month] = selectedYearMonth.split('-').map(Number);

        filtered = filtered.filter(tournament => {
          if (!tournament.startDate) return false;

          const tDate = tournament.startDate;
          return (
            tDate.getFullYear() === year &&
            tDate.getMonth() + 1 === month
          );
        });

        console.log(`検索結果（年月のみ）: ${filtered.length}件`);
      }

      setTournaments(filtered);

      if (filtered.length === 0) {
        alert('該当する大会が見つかりませんでした');
      } else {
        alert(`${filtered.length}件の大会が見つかりました`);
      }
    } catch (error) {
      console.error('検索エラー:', error);
      alert('検索中にエラーが発生しました');
    } finally {
      setIsSearching(false);
    }
  };

  // 検索リセット
  const handleResetSearch = () => {
    setSelectedYearMonth('');
    setSelectedDay('');
    setTournaments(allTournaments);
    alert('検索条件をリセットしました');
  };

  return (
    <div className="screen-36">
      <HeaderContent />

      <div className="main-content" style={{ top: `${mainContentTop}px` }}>
        <div className="frame-166">
          <div className="text-wrapper-96-2">大会管理</div>
        </div>

        {/* 検索バー部分はそのまま */}
        <div className="frame-21">
          <div className="frame-22">
            <div className="frame-23">
              <div className="magnifying-glass-wrapper">
                <div className="magnifying-glass">
                  <img
                    className="search-icon"
                    alt="検索"
                    src="/img/検索黒.png"
                  />
                </div>
              </div>
              <div className="text-wrapper-39">大会を検索（チーム参加）</div>
            </div>

            <div className="frame-24">
              <div className="frame-box1">
                <label className="dropdown-label" htmlFor="select-year-month">年月</label>
                <select
                  id="select-year-month"
                  className="custom-select"
                  value={selectedYearMonth}
                  onChange={(e) => {
                    setSelectedYearMonth(e.target.value);
                    setSelectedDay(''); // 年月が変更されたら日をリセット
                  }}
                >
                  <option value="">選択してください</option>
                  {yearMonthOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="frame-box2">
                <label className="dropdown-label" htmlFor="select-day">日</label>
                <select
                  id="select-day"
                  className="custom-select"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  disabled={!selectedYearMonth}
                >
                  <option value="">選択してください</option>
                  {dayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="frame-30"
                onClick={handleSearch}
                disabled={isSearching}
                style={{
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1,
                  flex: 1
                }}
              >
                <div className="text-wrapper-43">
                  {isSearching ? '検索中...' : '検索'}
                </div>
              </button>

              <button
                className="frame-30"
                onClick={handleResetSearch}
                disabled={isSearching}
                style={{
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1,
                  backgroundColor: '#757575',
                  flex: 1
                }}
              >
                <div className="text-wrapper-43">リセット</div>
              </button>
            </div>
          </div>
        </div>

        {/* 大会リスト部分 */}
        <div className="frame-167">
          <div className="frame-168">
            {tournaments.map((tournament, index) => (
              <details key={index} className="tournament-item">
                <summary className="tournament-name">{tournament.name}</summary>
                <div className="tournament-details">
                  <p><strong>開催日時：</strong>{tournament.date}</p>
                  <p><strong>開催地域：</strong>{tournament.region}</p>
                  <p><strong>開催場所：</strong>{tournament.place}</p>
                  <p><strong>住所：</strong>{tournament.address}</p>
                  <div className="custom-hr" />
                  <p><strong>試合球：</strong>{tournament.ball}</p>
                  <p><strong>種別：</strong>{tournament.type}</p>
                  <p><strong>競技方法：</strong>{tournament.method}</p>
                  <p><strong>順位方法：</strong>{tournament.ranking}</p>
                </div>

                {tournament.showButton && (
                  <div className="frame-628" style={{ display: "flex", gap: "10px" }}>
                    <div className="frame-631">
                      <div className="text-wrapper-312">編集</div>
                    </div>
                    <div className="frame-629">
                      <div className="text-wrapper-312">削除</div>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </div>
        </div>
      </div>

      <Footer currentPage="schedule" />
    </div>
  );
};
