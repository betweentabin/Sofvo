import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { useHeaderOffset } from "../../hooks/useHeaderOffset";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen23 = () => {
  const mainContentTop = useHeaderOffset();

  
  return (
    <div className="screen-23">
      <HeaderContent />
    <div
      className="main-content"
      style={{
        position: "absolute",
        top: `${mainContentTop}px`,
        bottom: "60px", // フッター高さ
        overflowY: "auto",
        width: "100%",
      }}
    >
      <div className="screen-23">
        <div className="frame-431">
          <div className="frame-432">
            
            <div className="frame-434">
              < div className="text-wrapper-214">サービス利用規約</div>
            </div>

            <div className="frame-433">
              <div className="text-wrapper-211">Sofvoの利用規約</div>
            </div>

            <div className="frame-433">
              <div className="text-wrapper-212">
                EU、EFTA諸国または英国以外の国に居住しているユーザーの場合（米国に居住しているユーザーの場合も含みます）
              </div>
            </div>

            <div className="SMS-API-e-https-help-wrapper">
              <p className="SMS-API-e-https-help">
                本利用規約（以下、「本規約」と称します）は、当社のさまざまなウェブサイト、SMS、API、メール通知、アプリケーション、ボタン、ウィジェット、広告、およびeコマースサービスなどの当社のサービスと、本規約に関連する当社の他の対象サービス（https://help.x.com/rules-and-policies/x-services-and-corporate-affiliates）（以下、「本サービス」と総称します）、ならびに本サービスにおいてアップロード、ダウンロードまたは表示される情報、テキスト、リンク、グラフィック、写真、音声、動画、その他のマテリアルやアレンジされたマテリアル（以下、「コンテンツ」と総称します）にアクセスし、利用するお客様およびその他のユーザーに適用されます。本サービスを利用することによって、ユーザーは本規約に拘束されることに同意したことになります。{" "}
                <br /> <br />
                本規約は、Xおよびサービスを提供するX Corp.
                とお客様との間の契約であり、登録事務所は865 FM 1209, Building 2,
                Bastrop, TX 78602 U.S.A. です。「当社」という用語は、X Corp.
                を意味します。
              </p>
            </div>

            <div className="frame-433">
              <div className="frame-433">
                <div className="text-wrapper-211">
                  1.本サービスを利用できる人
                </div>
              </div>

              <div className="text-wrapper-213">
                本サービスを利用できるのは、当社と拘束力のある契約を締結することに同意し、適用のある法域の法律によりサービスを受けることが禁止されていない者に限ります。また、いかなる場合においても、本サービスを利用するには13歳以上でなければなりません。お客様が（i）本規約を承諾し、および/またはサービスを利用する場合（これは本規約の承諾に相当します）、または（ii）未成年者（特定の国における成年年齢に達していない人物）、会社、組織、政府、またはその他の法人に代わってサービスの使用を承認するために本規約を承諾する場合、お客様はそうする権限を有していること、または状況に応じて、かかる未成年者および/または法人を本規約に拘束する権限を有していることを表明し、保証するものとします。本規約で使用される「お客様」および「お客様の」という語は、該当する場合、本規約を承諾する人物、またはかかる未成年者（（i）で定義）および/または（ii）で参照される団体のいずれかを指します。
              </div>
            </div>

            <div className="frame-433">
              <div className="frame-433">
                <div className="text-wrapper-211">2.プライバシー</div>
              </div>

              <div className="text-wrapper-213">
                当社のプライバシーポリシー（https://x.com/privacy）は、本サービスをご使用いただく際に当社に提供された情報が、当社でどのように取り扱われるかについて説明しています。ユーザーは、本サービスを利用することによって、当社およびその関係会社がこれら情報を保管、処理、使用するために米国、アイルランド、および／またはその他の国々に転送することを含め、これら情報の（プライバシーポリシーの定めに従った）収集および使用に同意することを理解しているものとします。
              </div>
            </div>

            <div className="frame-433">
              <div className="frame-433">
                <div className="text-wrapper-211">
                  3.本サービス上のコンテンツ
                </div>
              </div>

              <div className="text-wrapper-213">
                ユーザーは、適用される法令や規則への遵守を含め、本サービスの利用および自身が提供するコンテンツに対して責任を負います。提供するコンテンツは、他の人たちと共有して差し支えのないものに限定してください。
              </div>

              <div className="text-wrapper-213">
                本サービスを介してポストされたか、または本サービスを通じて取得したコンテンツやマテリアルの使用またはこれらへの依拠は、ユーザーの自己責任において行ってください。当社は、本サービスを介してポストされたいかなるコンテンツや通信内容についても、その完全性、真実性、正確性、もしくは信頼性を是認、支持、表明もしくは保証せず、また本サービスを介して表示される、事実とされるいかなる事柄、またはいかなる意見についても、それらを是認するものではありません。ユーザーは、本サービスの利用により、不快、有害、不正確あるいは不適切なコンテンツ、または場合によっては、不当表示されているポストまたはその他欺瞞的なポストに接する可能性があることを、理解しているものとします。すべてのコンテンツは、そのコンテンツの作成者が単独で責任を負うものとします。当社は、本サービスを介してポストされるコンテンツを監視または管理することはできず、また、そのようなコンテンツについて責任を負うこともできません。
              </div>

              <div className="text-wrapper-213">
                当社は、当社のユーザー契約に違反しているコンテンツ（著作権もしくは商標の侵害、またはその他の知的財産の不正利用、なりすまし、不法行為もしくは嫌がらせ等を行うコンテンツなど）を削除する権利を留保します。違反の報告または異議申し立てに特化したポリシーおよびプロセスに関する情報については、当社のヘルプセンター（https://help.x.com/rules-and-policies/x-report-violation#specific-violationsおよびhttps://help.x.com/managing-your-account/suspended-x-accounts）をご覧ください。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer currentPage="team-create" />
  </div>
  );
};
