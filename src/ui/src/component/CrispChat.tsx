import { useEffect } from 'react';
import { useRouter } from 'next/router';

const CrispChat = (props: any) => {
  const router = useRouter();

  const {handleChatClosed} = props;

  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = 'd575f741-3a6f-4762-aa51-f5e54d516a95';

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // document.body.removeChild(script);
      window.$crisp.push(['off', 'chat:closed', handleChatClosed]);
    };
  }, []);

  return null;
};

export default CrispChat;
