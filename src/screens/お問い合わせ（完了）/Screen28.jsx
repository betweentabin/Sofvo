import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

export const Screen28 = () => {
  return (
    <div className="screen-28">
      <div className="screen-42">
        <div className="frame-518">
          <div className="frame-519">
            <p className="p">
              <span className="span">
                ① お客様情報の入力　-　② 記入内容のご確認{" "}
              </span>

              <span className="text-wrapper-247">- </span>

              <span className="text-wrapper-248">③ 完了</span>
            </p>
          </div>

          <div className="frame-520">
            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">ご用件</div>
              </div>

              <div className="div-9">アカウントについて</div>
            </div>

            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">お名前</div>
              </div>

              <div className="div-9">山田　太郎</div>
            </div>

            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">フリガナ</div>
              </div>

              <div className="div-9">ヤマダ　タロウ</div>
            </div>

            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">メールアドレス</div>
              </div>

              <div className="div-9">0000000000@gmail.com</div>
            </div>

            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">電話番号</div>
              </div>

              <div className="div-9">000-0000-0000</div>
            </div>

            <div className="frame-521">
              <div className="frame-522">
                <div className="text-wrapper-249">内容</div>
              </div>

              <div className="text-wrapper-250">
                お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容お問い合わせ内容
              </div>
            </div>

            <div className="frame-522">
              <div className="rectangle-13" />

              <p className="div-9">
                <Link to="/privacy" className="text-wrapper-251">プライバシーポリシー</Link>

                <span className="text-wrapper-252">に同意する</span>
              </p>
            </div>
          </div>
        </div>

        <div className="frame-523">
          <Link to="/contact" className="frame-524">
            <div className="text-wrapper-253">戻る</div>
          </Link>

          <Link to="/contact-complete" className="frame-525">
            <div className="text-wrapper-254">送信する</div>
          </Link>
        </div>

        <div className="frame-526">
          <div className="text-wrapper-255">お問い合わせ</div>
        </div>

        <div className="overlap-group-25">
          <div className="frame-527">
            <div className="frame-528">
              <div className="frame-529">
                <div className="text-wrapper-256">Sofvo</div>

                <img
                  className="frame-530"
                  alt="Frame"
                  src="/img/frame-19-21.svg"
                />
              </div>
            </div>
          </div>

          <img className="vector-57" alt="Vector" src="/img/vector-3.svg" />
        </div>

        <img className="frame-531" alt="Frame" src="/img/frame-19-28.svg" />
      </div>
    </div>
  );
};
