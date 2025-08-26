import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

export const DivWrapper = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountName: "",
    email: "",
    phone: "",
    password: "",
    name: "",
    furigana: "",
    agreeTerms: false,
    agreePrivacy: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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

  // チェックボックス変更ハンドラー
  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // バリデーション
  const validate = () => {
    const newErrors = {};

    if (!formData.accountName) newErrors.accountName = "アカウントネームは必須です";
    if (!formData.email) {
      newErrors.email = "メールアドレスは必須です";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "有効なメールアドレスを入力してください";
    }
    if (!formData.phone) {
      newErrors.phone = "携帯電話番号は必須です";
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "有効な電話番号を入力してください";
    }
    if (!formData.password) {
      newErrors.password = "パスワードは必須です";
    } else if (formData.password.length < 8 || !/^[a-zA-Z0-9]+$/.test(formData.password)) {
      newErrors.password = "8文字以上の半角英数字で入力してください";
    }
    if (!formData.name) newErrors.name = "名前は必須です";
    if (!formData.furigana) {
      newErrors.furigana = "フリガナは必須です";
    } else if (!/^[ァ-ヶー]+$/.test(formData.furigana)) {
      newErrors.furigana = "フリガナはカタカナで入力してください";
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = "利用規約に同意してください";
    if (!formData.agreePrivacy) newErrors.agreePrivacy = "プライバシーポリシーに同意してください";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // TODO: APIに送信
      console.log("アカウント作成:", formData);
      navigate("/profile-create");
    }
  };

  return (
    <div className="div-wrapper">
      <div className="screen-3">
        <form className="overlap-6" onSubmit={handleSubmit}>
          <div className="frame">
            <div className="frame-2">
              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">アカウントネーム</div>
                  <div className="text-wrapper-28">*</div>
                </div>
                <input
                  type="text"
                  className="frame-5 signup-input"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange("accountName", e.target.value)}
                  placeholder="アカウントネームを入力"
                />
                {errors.accountName && <div className="error-text">{errors.accountName}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">メールアドレス</div>
                  <div className="text-wrapper-28">*</div>
                </div>
                <input
                  type="email"
                  className="frame-5 signup-input"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@email.com"
                />
                {errors.email && <div className="error-text">{errors.email}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-6">
                  <div className="frame-7">
                    <div className="text-wrapper-29">携帯電話番号</div>
                    <div className="text-wrapper-30">*</div>
                  </div>
                  <div className="frame-8">
                    <div className="text-wrapper-31">非公開</div>
                  </div>
                </div>
                <input
                  type="tel"
                  className="frame-5 signup-input"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="090-1234-5678"
                />
                {errors.phone && <div className="error-text">{errors.phone}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-6">
                  <div className="frame-7">
                    <div className="text-wrapper-29">パスワード</div>
                    <div className="text-wrapper-30">*</div>
                  </div>
                  <div className="frame-8">
                    <div className="text-wrapper-31">非公開</div>
                  </div>
                </div>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="frame-5 signup-input"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="パスワードを入力"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#666"
                    }}
                  >
                    {showPassword ? "隠す" : "表示"}
                  </button>
                </div>
                <div className="text-wrapper-32">
                  8桁半角英数字で入力してください。
                </div>
                {errors.password && <div className="error-text">{errors.password}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-9">
                  <div className="frame-7">
                    <div className="text-wrapper-29">名前</div>
                    <div className="text-wrapper-30">*</div>
                  </div>
                  <div className="frame-10">
                    <div className="text-wrapper-31">非公開</div>
                  </div>
                </div>
                <input
                  type="text"
                  className="frame-11 signup-input"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="山田太郎"
                />
                {errors.name && <div className="error-text">{errors.name}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-6">
                  <div className="frame-7">
                    <div className="text-wrapper-29">フリガナ</div>
                    <div className="text-wrapper-30">*</div>
                  </div>
                  <div className="frame-10">
                    <div className="text-wrapper-31">非公開</div>
                  </div>
                </div>
                <input
                  type="text"
                  className="frame-5 signup-input"
                  value={formData.furigana}
                  onChange={(e) => handleInputChange("furigana", e.target.value)}
                  placeholder="ヤマダタロウ"
                />
                {errors.furigana && <div className="error-text">{errors.furigana}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-4" style={{ cursor: "pointer" }} onClick={() => handleCheckboxChange("agreeTerms")}>
                  <div className="text-wrapper-27">利用規約に同意する</div>
                  <input
                    type="checkbox"
                    className="rectangle-2"
                    checked={formData.agreeTerms}
                    onChange={() => handleCheckboxChange("agreeTerms")}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <div className="text-wrapper-28">*</div>
                </div>
                {errors.agreeTerms && <div className="error-text">{errors.agreeTerms}</div>}
              </div>

              <div className="frame-3">
                <div className="frame-4" style={{ cursor: "pointer" }} onClick={() => handleCheckboxChange("agreePrivacy")}>
                  <div className="text-wrapper-27">
                    プライバシーポリシーに同意する
                  </div>
                  <input
                    type="checkbox"
                    className="rectangle-2"
                    checked={formData.agreePrivacy}
                    onChange={() => handleCheckboxChange("agreePrivacy")}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <div className="text-wrapper-28">*</div>
                </div>
                {errors.agreePrivacy && <div className="error-text">{errors.agreePrivacy}</div>}
              </div>
            </div>
          </div>

          <div className="frame-14">
            <Link to="/login" className="frame-15">
              <div className="text-wrapper-33">キャンセル</div>
            </Link>

            <button type="submit" className="frame-16" style={{ border: "none", textDecoration: "none" }}>
              <div className="text-wrapper-34">次へ</div>
            </button>
          </div>
        </form>

        <div className="frame-17">
          <div className="text-wrapper-35">アカウントを作成</div>
        </div>

        <div className="overlap-group-4">
          <img className="vector" alt="Vector" src="/img/vector-3.svg" />

          <div className="frame-wrapper">
            <div className="frame-18">
              <div className="frame-6">
                <div className="text-wrapper-36">Sofvo</div>

                <img className="frame-19" alt="Frame" src="/img/frame-19.svg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
