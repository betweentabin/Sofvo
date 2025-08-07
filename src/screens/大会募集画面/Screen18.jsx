import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

export const Screen18 = () => {
  return (
    <div className="screen-18">
      <div className="screen-33">
        <div className="overlap-group-16">
          <div className="frame-326">
            <div className="frame-327">
              <div className="frame-328">
                <div className="text-wrapper-165">エントリー受付中</div>
              </div>

              <div className="rectangle-9" />

              <div className="frame-329">
                <div className="text-wrapper-166">
                  大会名：第15回 〇〇カップ
                </div>

                <div className="text-wrapper-167">
                  開催日時：2025年5月18日（日）
                </div>

                <div className="text-wrapper-167">開催地域：静岡県</div>

                <div className="text-wrapper-167">開催場所：〇〇体育館</div>

                <div className="text-wrapper-167">
                  住所：静岡県〇〇市〇〇町1-2-3
                </div>

                <div className="text-wrapper-167">主催者：00000</div>
              </div>

              <div className="rectangle-10" />

              <div className="frame-330">
                <div className="frame-331">
                  <div className="frame-332">
                    <div className="heart-11">
                      <img
                        className="vector-43"
                        alt="Vector"
                        src="/img/vector-25.svg"
                      />
                    </div>

                    <div className="text-wrapper-168">10 いいね</div>
                  </div>
                </div>
              </div>
            </div>

            <img className="element-30" alt="Element" src="/img/2-1.svg" />
          </div>

          <div className="frame-333">
            <div className="frame-327">
              <div className="frame-328">
                <div className="text-wrapper-165">スケジュール</div>
              </div>

              <div className="frame-329">
                <div className="text-wrapper-166">8:00　開場</div>

                <div className="text-wrapper-169">8:00　代表者会議</div>

                <div className="text-wrapper-167">8:00　試合開始</div>
              </div>
            </div>

            <img className="element-30" alt="Element" src="/img/2-1.svg" />
          </div>

          <img className="vector-44" alt="Vector" src="/img/vector-3.svg" />

          <div className="frame-334">
            <div className="frame-335">
              <div className="frame-336">
                <div className="text-wrapper-170">Sofvo</div>

                <img
                  className="frame-337"
                  alt="Frame"
                  src="/img/frame-19-7.svg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="frame-338">
          <div className="frame-327">
            <div className="frame-328">
              <div className="text-wrapper-165">概要</div>
            </div>

            <div className="frame-329">
              <div className="text-wrapper-171">・試合球：ミカサ</div>

              <div className="frame-339">
                <div className="text-wrapper-171">・種別：混合フリー</div>

                <img
                  className="vector-45"
                  alt="Vector"
                  src="/img/vector-16.svg"
                />
              </div>

              <div className="text-wrapper-172">・順位方法：〇〇〇〇〇〇</div>

              <div className="frame-340">
                <div className="text-wrapper-166">・注意事項：</div>

                <div className="text-wrapper-173">
                  〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇
                </div>
              </div>

              <div className="frame-341">
                <div className="text-wrapper-171">・獲得ポイント：</div>

                <div className="element-p-p-p">
                  1位→100P
                  <br />
                  2位→80P
                  <br />
                  3位→70P
                </div>
              </div>
            </div>
          </div>

          <img className="element-30" alt="Element" src="/img/2-1.svg" />
        </div>

        <div className="frame-342">
          <div className="frame-343">
            <div className="text-wrapper-174">エントリー</div>
          </div>

          <Link to="/contact" className="frame-344">
            <div className="text-wrapper-175">お問い合わせ</div>
          </Link>
        </div>

        <img className="frame-345" alt="Frame" src="/img/frame-18-2.svg" />
      </div>
    </div>
  );
};
