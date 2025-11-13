import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./style.css";

export const Screen13 = () => {
  const mainContentTop = useHeaderOffset();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    username: "",
    age: "",
    gender: "",
    experience_years: "",
    team_name: "",
    location: "",
    bio: "",
    avatar_url: "",
    privacy_settings: {
      username: "public",
      age: "public",
      gender: "public",
      experience: "public",
      team: "public",
      location: "public"
    }
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.railwayUsers.getProfile(user.id);
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          username: data.username || "",
          age: data.age || "",
          gender: data.gender || "",
          experience_years: data.experience_years || "",
          team_name: data.team_name || "",
          location: data.location || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          privacy_settings: data.privacy_settings || {
            username: "public",
            age: "public",
            gender: "public",
            experience: "public",
            team: "public",
            location: "public"
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('画像サイズは5MB以下にしてください');
      return;
    }

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.media.upload(formData);

      setProfile(prev => ({
        ...prev,
        avatar_url: data.url
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // 更新するデータを準備
      const updateData = {
        user_id: user.id, // Add user_id to ensure it's sent
        display_name: profile.display_name,
        username: profile.username,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        experience_years: profile.experience_years,
        team_name: profile.team_name,
        location: profile.location,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        privacy_settings: profile.privacy_settings
      };

      console.log('Updating profile with data:', updateData);

      await api.railwayUsers.updateProfile(updateData);
      console.log('Profile updated successfully');
      alert('プロフィールを更新しました');
      navigate('/my-profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      const errorMsg = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details ? `\n詳細: ${error.response.data.details}` : '';
      const receivedFields = error.response?.data?.receivedFields ? `\n受信フィールド: ${error.response.data.receivedFields.join(', ')}` : '';
      alert('プロフィールの更新に失敗しました: ' + errorMsg + errorDetails + receivedFields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen-13">
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
        <div className="frame-439">
          <div className="frame-440">
            <div className="frame-466">
              <div className="text-wrapper-226">プロフィールを編集</div>
            </div>

            {/* アバター画像アップロード */}
            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">プロフィール画像</div>
                </div>
              </div>
              <div className="avatar-upload-container">
                <div className="avatar-preview">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="プロフィール" className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      <span>📷</span>
                    </div>
                  )}
                </div>
                <div className="avatar-upload-controls">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                  />
                  <label htmlFor="avatar-upload" className={`avatar-upload-button ${uploadingImage ? 'uploading' : ''}`}>
                    {uploadingImage ? '⏳ アップロード中...' : '📷 画像を選択'}
                  </label>
                  {profile.avatar_url && (
                    <button
                      type="button"
                      className="avatar-remove-button"
                      onClick={() => setProfile(prev => ({ ...prev, avatar_url: '' }))}
                      disabled={uploadingImage}
                    >
                      🗑️ 削除
                    </button>
                  )}
                </div>
                <div className="avatar-upload-hint">
                  推奨: 正方形の画像、5MB以下
                </div>
              </div>
            </div>

            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">表示名</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.username}
                  onChange={(e) => handlePrivacyChange('username', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <input
                type="text"
                className="frame-445"
                value={profile.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="表示名を入力"
              />
            </div>

            <div className="frame-441">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">アカウント名</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.username}
                  onChange={(e) => handlePrivacyChange('username', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <input
                type="text"
                className="frame-445"
                value={profile.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="@username"
              />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">年齢</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.age}
                  onChange={(e) => handlePrivacyChange('age', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <input
                type="number"
                className="frame-445"
                value={profile.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="年齢を入力"
                min="1"
                max="150"
              />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">性別</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.gender}
                  onChange={(e) => handlePrivacyChange('gender', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <select
                className="custom-select"
                value={profile.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="prefer_not_to_say">回答しない</option>
              </select>
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">競技歴</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.experience}
                  onChange={(e) => handlePrivacyChange('experience', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <select 
                className="custom-select"
                value={profile.experience_years}
                onChange={(e) => handleInputChange('experience_years', e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="0">1年未満</option>
                <option value="1">1年</option>
                <option value="2">2年</option>
                <option value="3">3年</option>
                <option value="4">4年</option>
                <option value="5">5年</option>
                <option value="6-10">6-10年</option>
                <option value="11-20">11-20年</option>
                <option value="20+">20年以上</option>
              </select>
            </div>
            
            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">所属チーム</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.team}
                  onChange={(e) => handlePrivacyChange('team', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <input
                type="text"
                className="frame-445"
                value={profile.team_name}
                onChange={(e) => handleInputChange('team_name', e.target.value)}
                placeholder="チーム名を入力"
              />
            </div>

            <div className="frame-447">
              <div className="frame-442">
                <div className="frame-443">
                  <div className="text-wrapper-216">活動地域</div>
                </div>
                <select 
                  className="custom-select2"
                  value={profile.privacy_settings.location}
                  onChange={(e) => handlePrivacyChange('location', e.target.value)}
                >
                  <option value="public">公開</option>
                  <option value="private">非公開</option>
                </select>
              </div>
              <input
                type="text"
                className="frame-445"
                value={profile.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="例: 東京都"
              />
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
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="自己紹介を入力してください"
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>
          </div>
        </div>

        <div className="frame-463">
          <Link to="/my-profile" className="frame-464">
            <div className="text-wrapper-224">戻る</div>
          </Link>

          <button 
            onClick={handleSubmit} 
            className="frame-465"
            disabled={loading}
            style={{ 
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <div className="text-wrapper-225">
              {loading ? '保存中...' : '完了'}
            </div>
          </button>
        </div>
      </div>
      <Footer currentPage="profile-edit" />
    </div>
  );
};
