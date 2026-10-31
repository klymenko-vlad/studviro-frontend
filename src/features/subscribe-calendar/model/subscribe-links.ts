export interface SubscribeLinks {
  google: string;
  outlook: string;
  office: string;
  apple: string;
}

export function subscribeLinks(feedUrl: string): SubscribeLinks {
  const webcal = feedUrl.replace(/^https?:/, 'webcal:');
  const addFromWeb = (origin: string) =>
    `${origin}/calendar/0/addfromweb?url=${encodeURIComponent(feedUrl)}&name=StudViro`;

  return {
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
    outlook: addFromWeb('https://outlook.live.com'),
    office: addFromWeb('https://outlook.office.com'),
    apple: webcal,
  };
}
