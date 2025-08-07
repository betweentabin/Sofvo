import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

export const Screen6 = () => {
  return (
    <div className="screen-6">
      <div className="screen-4">
        <div className="frame-47">
          <div className="frame-48">
            <div className="frame-49">
              <div className="frame-50">
                <div className="frame-51">
                  <div className="text-wrapper-49">生年月日</div>

                  <div className="text-wrapper-50">*</div>
                </div>

                <div className="frame-52">
                  <div className="text-wrapper-51">公開</div>

                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>

              <div className="frame-53" />
            </div>

            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">年齢</div>

                <div className="frame-52">
                  <div className="text-wrapper-51">公開</div>

                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>

              <div className="vector-wrapper">
                <img
                  className="vector-7"
                  alt="Vector"
                  src="/img/vector-14.svg"
                />
              </div>
            </div>

            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">性別</div>

                <div className="frame-52">
                  <div className="text-wrapper-51">公開</div>

                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>

              <div className="vector-wrapper">
                <img
                  className="vector-7"
                  alt="Vector"
                  src="/img/vector-16.svg"
                />
              </div>
            </div>

            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">競技歴</div>

                <div className="frame-52">
                  <div className="text-wrapper-51">公開</div>

                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>

              <div className="vector-wrapper">
                <img
                  className="vector-7"
                  alt="Vector"
                  src="/img/vector-16.svg"
                />
              </div>
            </div>

            <div className="frame-49">
              <div className="frame-50">
                <div className="text-wrapper-52">活動地域</div>

                <div className="frame-52">
                  <div className="text-wrapper-51">公開</div>

                  <img
                    className="vector-7"
                    alt="Vector"
                    src="/img/vector-12.svg"
                  />
                </div>
              </div>

              <div className="img-wrapper">
                <img
                  className="vector-7"
                  alt="Vector"
                  src="/img/vector-14.svg"
                />
              </div>
            </div>

            <div className="frame-49">
              <div className="frame-50">
                <div className="frame-51">
                  <div className="text-wrapper-49">自己紹介</div>

                  <div className="text-wrapper-50">*</div>
                </div>

                <div className="frame-54">
                  <div className="text-wrapper-53">公開</div>
                </div>
              </div>

              <div className="frame-55" />
            </div>
          </div>
        </div>

        <div className="frame-56">
          <Link to="/signup" className="frame-57">
            <div className="text-wrapper-54">戻る</div>
          </Link>

          <Link to="/home" className="frame-58">
            <div className="text-wrapper-55">完了</div>
          </Link>
        </div>

        <div className="frame-59">
          <div className="text-wrapper-56">プロフィールを作成</div>
        </div>

        <div className="overlap-group-6">
          <img className="vector-8" alt="Vector" src="/img/vector-3.svg" />

          <div className="frame-60">
            <div className="frame-61">
              <div className="frame-50">
                <div className="text-wrapper-57">Sofvo</div>

                <img
                  className="frame-62"
                  alt="Frame"
                  src="/img/frame-19-1.svg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
