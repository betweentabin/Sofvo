import React from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen39 = () => {
  const mainContentTop = useHeaderOffset();

  const licenses = [
    {
      name: "React",
      version: "18.3.1",
      license: "MIT",
      url: "https://github.com/facebook/react"
    },
    {
      name: "React Router",
      version: "6.30.1",
      license: "MIT",
      url: "https://github.com/remix-run/react-router"
    },
    {
      name: "Capacitor",
      version: "7.4.3",
      license: "MIT",
      url: "https://github.com/ionic-team/capacitor"
    },
    {
      name: "Firebase",
      version: "12.2.1",
      license: "Apache-2.0",
      url: "https://github.com/firebase/firebase-js-sdk"
    },
    {
      name: "Vite",
      version: "6.0.4",
      license: "MIT",
      url: "https://github.com/vitejs/vite"
    },
    {
      name: "Axios",
      version: "1.x",
      license: "MIT",
      url: "https://github.com/axios/axios"
    },
    {
      name: "Prop Types",
      version: "15.8.1",
      license: "MIT",
      url: "https://github.com/facebook/prop-types"
    },
    {
      name: "Storybook",
      version: "8.6.14",
      license: "MIT",
      url: "https://github.com/storybookjs/storybook"
    },
    {
      name: "Cloudflare Wrangler",
      version: "4.x",
      license: "MIT/Apache-2.0",
      url: "https://github.com/cloudflare/workers-sdk"
    }
  ];

  return (
    <div className="screen-39">
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
        <div className="oss-licenses-container">
          <div className="oss-licenses-header">
            <h1 className="oss-licenses-title">オープンソースライセンス</h1>
            <p className="oss-licenses-description">
              このアプリケーションは、以下のオープンソースソフトウェアを使用しています。
              各プロジェクトの開発者の皆様に感謝いたします。
            </p>
          </div>

          <div className="oss-licenses-list">
            {licenses.map((lib, index) => (
              <div key={index} className="oss-license-item">
                <div className="oss-license-header">
                  <h2 className="oss-license-name">{lib.name}</h2>
                  <span className="oss-license-version">v{lib.version}</span>
                </div>
                <div className="oss-license-info">
                  <span className="oss-license-badge">{lib.license}</span>
                  <a
                    href={lib.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="oss-license-link"
                  >
                    リポジトリを見る →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="oss-licenses-footer">
            <h3 className="oss-licenses-subtitle">ライセンスについて</h3>
            <div className="oss-license-details">
              <h4>MIT License</h4>
              <p>
                MIT Licenseは、ソフトウェアを自由に使用、コピー、変更、統合、公開、配布、サブライセンス、
                および/または販売することを許可する、非常に寛容なオープンソースライセンスです。
              </p>

              <h4>Apache License 2.0</h4>
              <p>
                Apache License 2.0は、Apacheソフトウェア財団が公開するオープンソースライセンスです。
                ユーザーはソフトウェアを自由に使用、変更、配布できますが、変更箇所を明示する必要があります。
              </p>
            </div>

            <div className="oss-licenses-note">
              <p>
                各ライブラリの完全なライセンステキストは、それぞれのリポジトリでご確認いただけます。
              </p>
            </div>
          </div>

          <div className="oss-licenses-back">
            <Link to="/settings" className="oss-licenses-back-button">
              設定画面に戻る
            </Link>
          </div>
        </div>
      </div>

      <Footer currentPage="settings" />
    </div>
  );
};
