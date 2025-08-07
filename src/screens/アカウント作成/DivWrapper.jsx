import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

export const DivWrapper = () => {
  return (
    <div className="div-wrapper">
      <div className="screen-3">
        <div className="overlap-6">
          <div className="frame">
            <div className="frame-2">
              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">アカウントネーム</div>

                  <div className="text-wrapper-28">*</div>
                </div>

                <div className="frame-5" />
              </div>

              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">メールアドレス</div>

                  <div className="text-wrapper-28">*</div>
                </div>

                <div className="frame-5" />
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

                <div className="frame-5" />
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

                <div className="frame-5" />

                <div className="text-wrapper-32">
                  8桁半角英数字で入力してください。
                </div>
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

                <div className="frame-11" />
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

                <div className="frame-5" />
              </div>

              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">利用規約に同意する</div>

                  <div className="rectangle-2" />

                  <div className="text-wrapper-28">*</div>
                </div>

                <div className="frame-12" />
              </div>

              <div className="frame-3">
                <div className="frame-4">
                  <div className="text-wrapper-27">
                    プライバシーポリシーに同意する
                  </div>

                  <div className="rectangle-2" />

                  <div className="text-wrapper-28">*</div>
                </div>

                <div className="frame-13" />
              </div>
            </div>
          </div>

          <div className="frame-14">
            <Link to="/login" className="frame-15">
              <div className="text-wrapper-33">キャンセル</div>
            </Link>

            <Link to="/profile-create" className="frame-16">
              <div className="text-wrapper-34">次へ</div>
            </Link>
          </div>
        </div>

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
