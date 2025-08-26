import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

export const Screen6 = () => {
  const navigate = useNavigate();
  
  // フォーム状態管理
  const [formData, setFormData] = useState({
    birthDate: "",
    age: "",
    gender: "",
    experience: "",
    sport: "",
    bio: "",
    // プライバシー設定
    showBirthDate: true,
    showAge: true,
    showGender: true,
    showExperience: true,
    showSport: true,
  });

  // 入力変更ハンドラー
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 生年月日から年齢を自動計算
    if (field === 'birthDate' && value) {
      const birthYear = new Date(value).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      setFormData(prev => ({
        ...prev,
        age: age.toString()
      }));
    }
  };

  // プライバシー設定の切り替え
  const togglePrivacy = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 保存処理
  const handleSave = () => {
    // バリデーション
    if (!formData.birthDate) {
      alert("生年月日は必須項目です");
      return;
    }

    // TODO: APIに送信
    console.log("プロフィール保存:", formData);
    
    // ホーム画面へ遷移
    navigate("/home");
  };

  return (
    <div className="screen-6">
      <div className="screen-4">
        <div className="frame-47">
          <div className="frame-48">
            {/* 生年月日 */}
            <div className="frame-49">
              <div className="frame-50">
                <div className="frame-51">
                  <div className="text-wrapper-49">生年月日</div>
                  <div className="text-wrapper-50">*</div>
                </div>
                <div className="frame-52" onClick={() => togglePrivacy('showBirthDate')}>
                  <div className="text-wrapper-51">
                    {formData.showBirthDate ? '公開' : '非公開'}
                  </div>
                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>
              <input
                type="date"
                className="frame-53 input-field"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                placeholder="生年月日を選択"
              />
            </div>

            {/* 年齢 */}
            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">年齢</div>
                <div className="frame-52" onClick={() => togglePrivacy('showAge')}>
                  <div className="text-wrapper-51">
                    {formData.showAge ? '公開' : '非公開'}
                  </div>
                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>
              <input
                type="text"
                className="vector-wrapper input-field"
                value={formData.age}
                readOnly
                placeholder="自動計算されます"
              />
            </div>

            {/* 性別 */}
            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">性別</div>
                <div className="frame-52" onClick={() => togglePrivacy('showGender')}>
                  <div className="text-wrapper-51">
                    {formData.showGender ? '公開' : '非公開'}
                  </div>
                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>
              <select
                className="vector-wrapper input-field"
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="no-answer">回答しない</option>
              </select>
            </div>

            {/* 競技歴 */}
            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">競技歴</div>
                <div className="frame-52" onClick={() => togglePrivacy('showExperience')}>
                  <div className="text-wrapper-51">
                    {formData.showExperience ? '公開' : '非公開'}
                  </div>
                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>
              <input
                type="text"
                className="vector-wrapper input-field"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="例: 5年"
              />
            </div>

            {/* 競技 */}
            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">競技</div>
                <div className="frame-52" onClick={() => togglePrivacy('showSport')}>
                  <div className="text-wrapper-51">
                    {formData.showSport ? '公開' : '非公開'}
                  </div>
                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>
              <select
                className="vector-wrapper input-field"
                value={formData.sport}
                onChange={(e) => handleInputChange('sport', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="soccer">サッカー</option>
                <option value="baseball">野球</option>
                <option value="basketball">バスケットボール</option>
                <option value="volleyball">バレーボール</option>
                <option value="tennis">テニス</option>
                <option value="rugby">ラグビー</option>
                <option value="golf">ゴルフ</option>
                <option value="swimming">水泳</option>
                <option value="track">陸上</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* 自己紹介 */}
            <div className="frame-54">
              <div className="text-wrapper-53">自己紹介</div>
              <textarea
                className="frame-55 input-field"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="自己紹介を入力してください（任意）"
                rows={4}
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="frame-56">
            <button
              className="frame-57"
              onClick={() => navigate(-1)}
              type="button"
            >
              <div className="text-wrapper-54">戻る</div>
            </button>
            <button
              className="frame-58"
              onClick={handleSave}
              type="button"
            >
              <div className="text-wrapper-55">保存</div>
            </button>
          </div>
        </div>

        {/* ヘッダー */}
        <div className="navigation">
          <div className="title">
            <div className="text-wrapper-56">プロフィール作成</div>
          </div>
          <div className="left-button-wrapper">
            <div className="left-button">
              <button
                className="ellipse"
                onClick={() => navigate(-1)}
                aria-label="戻る"
              />
              <img
                className="vector-8"
                alt="Back"
                src="/img/vector-4.svg"
              />
            </div>
          </div>
          <div className="right-button">
            <button
              className="text-wrapper-57"
              onClick={handleSave}
            >
              完了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};