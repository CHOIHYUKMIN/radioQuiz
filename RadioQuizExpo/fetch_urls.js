const fetchUrls = async () => {
  try {
    const kbs21 = await (await fetch('https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/21')).json();
    console.log('KBS 1Radio:', kbs21.channel_item[0].service_url);
    
    const kbs22 = await (await fetch('https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/22')).json();
    console.log('KBS HappyFM:', kbs22.channel_item[0].service_url);

    const kbs24 = await (await fetch('https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/24')).json();
    console.log('KBS ClassicFM:', kbs24.channel_item[0].service_url);

    const kbs25 = await (await fetch('https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/25')).json();
    console.log('KBS CoolFM:', kbs25.channel_item[0].service_url);

    const mbcSfm = await (await fetch('https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=sfm')).text();
    console.log('MBC Standard:', mbcSfm);

    const mbcFm4u = await (await fetch('https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=mfm')).text();
    console.log('MBC FM4U:', mbcFm4u);

    const sbsLove = await (await fetch('https://apis.sbs.co.kr/play-api/1.0/livestream/lovepc/lovefm?protocol=hls&ssl=Y')).text();
    console.log('SBS LoveFM:', sbsLove);

    const sbsPower = await (await fetch('https://apis.sbs.co.kr/play-api/1.0/livestream/powerpc/powerfm?protocol=hls&ssl=Y')).text();
    console.log('SBS PowerFM:', sbsPower);
  } catch (e) {
    console.error(e);
  }
};
fetchUrls();
