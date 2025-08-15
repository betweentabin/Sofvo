import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeaderContent } from "../../components/HeaderContent";
import { Footer } from "../../components/Footer";
import "./style.css";

export const Screen26 = () => {
  const [mainContentTop, setMainContentTop] = useState(0);

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

  return (
    <div className="screen-26">
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
      <div className="screen-26">
        <div className="frame-501">
          <div className="frame-502">

            <div className="frame-504">
              <div className="text-wrapper-242">プライバシーポリシー</div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-238">1.当社が収集する情報</div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-239">
                ユーザーがXを利用する際に当社が収集する情報は、3つのカテゴリーに分類されます。
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-240">
                1.1 ユーザーが当社に提供する情報
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-239">
                当社のプロダクトおよびサービスを使用するためには、ユーザーはアカウントを作成して保有する必要があり、そのために、ユーザーは一定の情報を当社に提供する必要があります。同様に、ユーザーが当社の有料プロダクトおよび有料サービスを使用する場合、当社は支払情報を入手することなく、それらをユーザーに提供することはできません。基本的に、当社のプロダクトやサービスの多くをご利用いただくためには、一定の情報が必要です。
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-239">
                個人アカウント:
                ユーザーがアカウントを作成する場合、当社がユーザーに当社のサービスを提供することができるように、ユーザーは、一定の情報を当社に提供しなければなりません。これには、表示名（たとえば「クリエイター」）、ユーザー名（たとえば@XCreators）、パスワード、メールアドレスまたは電話番号、生年月日、表示言語、第三者の個別のサインイン情報（このサインイン方法を選択した場合）が含まれます。また、ユーザーは、プロフィールやポストで位置情報を共有したり、アドレス帳をXにアップロードして、知り合いを見つけたりすることもできます。アカウント名とユーザー名を含むプロフィール情報は常に公開されますが、ユーザーは、実名または仮名のいずれも使用することができます。また、複数のXアカウントを作成して、たとえば、自分のアイデンティティの異なる部分、プロフェッショナルな部分やその他の部分を表現することもできることを覚えておいてください。
              </div>

              <div className="text-wrapper-241">
                Proアカウント:
                ユーザーがProアカウントを作成する場合、ユーザーは、専門カテゴリーを当社に提供する必要もあり、また、住所、連絡先メールアドレス、および連絡先電話番号を含むその他の情報を当社に提供することがあり、これらの情報はすべて常に公開されます。
              </div>

              <div className="text-wrapper-241">
                支払情報:
                当社の有料プロダクトおよびサービスの一部として提供される広告またはその他の提供物を購入するためには、ユーザーのクレジットカード番号またはデビットカード番号、カードの有効期限、CVVコード、および請求先住所を含む支払情報を当社に提供する必要があります。
              </div>

              <div className="text-wrapper-241">
                興味関心: ユーザー
                設定によりユーザーの興味関心を設定する場合、当社はユーザーの興味関心を尊重できるように、その情報を収集します。
              </div>

              <div className="text-wrapper-241">
                生体情報:
                ユーザーの同意に基づき、当社は安全およびセキュリティの確保や、身元確認を目的にユーザーの生体情報の収集や使用を行うことがあります。
              </div>

              <div className="text-wrapper-241">
                求人への応募/求人に関するおすすめ:
                当社は、ユーザーに有望な仕事を紹介したり、ユーザーが求人に応募した場合に、その求人元の潜�在的な雇用主と当該ユーザーに関する情報を共有したり、雇用主が有望な候補者を見つけられるように�したり、専門職に就く機会をもたらすつながりを実現したり、ユーザーにより関連性の高い広告を表示したりするために、ユーザーの個人情報（当社の以下のプライバシーポリシーの「ユーザーがXを利用する際に当社が収集する情報」セクションで開示している、当社がすでに収集している情報に加えて、経歴情報、職歴、学歴�、仕事に関する希望、スキルおよび能力、求職活動および内定などに関する情報）を収集して使用する�ことがあります。
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-240">
                1.2 ユーザーがXを利用する際に当社が収集する情報。
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-239">
                ユーザーが当社のサービスを利用する際には、当社のプロダクトおよびサービスの利用方法に関する情報を収集します。この情報を、プロダクトやサービスを提供し、またXをより安全で、すべてのユーザーが尊重される、より適切な環境に保つために役立てています。
              </div>
            </div>

            <div className="frame-503">
              <div className="text-wrapper-239">
                ユーザーが当社のサービスを利用する際には、当社のプロダクトおよびサービスの利用方法に関する情報を収集します。この情報を、プロダクトやサービスを提供し、またXをより安全で、すべてのユーザーが尊重される、より適切な環境に保つために役立てています。
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
