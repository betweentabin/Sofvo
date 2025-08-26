import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import "./style.css";

export const Screen13 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    username: "",
    age: "",
    gender: "",
    experience_years: "",
    team_name: "",
    location: "",
    bio: "",
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

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

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
        display_name: profile.display_name,
        username: profile.username,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender,
        experience_years: profile.experience_years,
        team_name: profile.team_name,
        location: profile.location,
        bio: profile.bio,
        privacy_settings: profile.privacy_settings,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with data:', updateData);

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select();

      if (error) throw error;

      console.log('Profile updated successfully:', data);
      alert('プロフィールを更新しました');
      navigate('/my-profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの更新に失敗しました: ' + error.message);
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