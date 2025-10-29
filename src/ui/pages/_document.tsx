import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
      <script src="https://client.crisp.chat/l.js" async />
      <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                window.$crisp=[];window.CRISP_WEBSITE_ID="d575f741-3a6f-4762-aa51-f5e54d516a95";
                (function(){
                  var d=document;
                  var s=d.createElement("script");
                  s.src="https://client.crisp.chat/l.js";
                  s.async=1;
                  d.getElementsByTagName("head")[0].appendChild(s);
                })();
              `,
            }}
          />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.gtranslateSettings = {
                "default_language":"en",
                "detect_browser_language":true,
                "languages":["en","fr","it","es","ja","ko","hi","ar","de","pt"],
                "wrapper_selector":".gtranslate_wrapper",
                "horizontal_position":"left",
                "vertical_position":"top",
              };
            `,
          }}
        />
        <script src="https://cdn.gtranslate.net/widgets/latest/dropdown.js" defer />
      </Head>
      <body className=''>
      <div className="gtranslate_wrapper"></div>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
