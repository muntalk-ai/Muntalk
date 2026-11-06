// Konglish ER — episode → language → YouTube video ID mapping.
// One source of truth for /konglish. New episode = one entry here;
// new language version = one videoId line. No video files in the repo —
// every video is a YouTube upload, embedded via youtube-nocookie.
//
// Release schedule: 63 episodes, 2026-11-05 → 2026-12-07, two a day
// (09:00 + 15:00 Vancouver wall time) from the muntalk-63ep-release-*
// crons. Stored cron times read 1h early (PCT scheduler quirk) — the
// releaseAt below is the real wall-clock time, converted to UTC.
// Vancouver stays on UTC-7 year-round (no DST since 2026-11-01), so
// 09:00 wall = 16:00 UTC and 15:00 wall = 22:00 UTC for the whole run.
//
// Status (computed from releaseAt, see episodeStatus):
//   released — release time has passed: free for everyone.
//   early    — within 48h before release: members-only early access
//              (signed-in users watch if a videoId exists).
//   upcoming — more than 48h out: date shown, no video yet.
//
// Titles: `topic` is the English mistake fixed in the episode,
// extracted from the YouTube title in konglish-er-{lang}0X-youtube-meta.md;
// `ytTitle` is that YouTube title verbatim.
//
// Video IDs (only episodes already published on YouTube get one):
//   vi03 5XYSOaI81tg · th03 VgOtnyFqCII (2026-11-05, @Muntalk_official,
//   verified in ~/memory/2026-11-05.md). Everything else uploads at its
//   release time — add the videoId line when the release cron publishes it.
//   NOTE (workflow change, Jay 2026-11-06): for the gated early-access
//   section to have anything to show, upload the next episode as
//   Unlisted 1–2 days BEFORE its release time and flip it to Public at
//   release. Until then, early episodes show a 'coming soon' card.

export type KonglishLang =
  | 'vi' | 'th' | 'my' | 'es' | 'ru' | 'ja' | 'zh'
  | 'id' | 'hi' | 'ar' | 'mn' | 'fa' | 'lo' | 'pt' | 'pl' | 'fr' | 'de';

export const KONGLISH_LANGS: { code: KonglishLang; name: string; native: string }[] = [
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာဘာသာ' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'lo', name: 'Lao', native: 'ລາວ' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
];

export type KonglishEpisode = {
  lang: KonglishLang;
  ep: number; // 2..5
  slug: string; // 'vi-03'
  topic: string; // the English mistake fixed, e.g. 'I am agree'
  ytTitle: string; // full YouTube title, verbatim from youtube-meta.md
  videoId?: string; // YouTube video ID once published
  releaseAt: string; // UTC ISO — release time (Vancouver wall 09:00/15:00)
};

export const KONGLISH_EPISODES: KonglishEpisode[] = [
  {
    lang: 'vi', ep: 3, slug: 'vi03',
    topic: 'I am agree',
    ytTitle: 'Phòng cấp cứu Vietlish EP.03: I am agree?! ❌ #Shorts', videoId: '5XYSOaI81tg',
    releaseAt: '2026-11-05T16:00:00Z',
  },
  {
    lang: 'th', ep: 3, slug: 'th03',
    topic: 'I very like Thai food',
    ytTitle: 'ห้องฉุกเฉิน Tinglish EP.03: I very like Thai food?! ❌ #Shorts', videoId: 'VgOtnyFqCII',
    releaseAt: '2026-11-05T22:00:00Z',
  },
  {
    lang: 'my', ep: 3, slug: 'my03',
    topic: 'I am agree with you',
    ytTitle: 'Burglish အရေးပေါ်ခန်း EP.03: I am agree with you?! ❌ #Shorts',
    releaseAt: '2026-11-06T16:00:00Z',
  },
  {
    lang: 'es', ep: 3, slug: 'es03',
    topic: 'I am agree',
    ytTitle: 'Urgencias de Spanglish EP.03: I am agree?! ❌ #Shorts',
    releaseAt: '2026-11-06T22:00:00Z',
  },
  {
    lang: 'ru', ep: 3, slug: 'ru03',
    topic: 'I go to school by foot',
    ytTitle: 'Скорая помощь «Рунглиш» EP.03: I go to school by foot?! ❌ #Shorts',
    releaseAt: '2026-11-07T16:00:00Z',
  },
  {
    lang: 'ja', ep: 2, slug: 'ja02',
    topic: 'He is smart',
    ytTitle: 'ジャパングリッシュ救急室 EP.02: He is smart?! ❌ #Shorts',
    releaseAt: '2026-11-07T22:00:00Z',
  },
  {
    lang: 'zh', ep: 2, slug: 'zh02',
    topic: 'I very like it',
    ytTitle: '中式英语急诊室 EP.02: I very like it?! ❌ #Shorts',
    releaseAt: '2026-11-08T16:00:00Z',
  },
  {
    lang: 'vi', ep: 4, slug: 'vi04',
    topic: 'I am student',
    ytTitle: 'Phòng cấp cứu Vietlish EP.04: I am student?! ❌ #Shorts',
    releaseAt: '2026-11-08T22:00:00Z',
  },
  {
    lang: 'th', ep: 4, slug: 'th04',
    topic: 'I go to home',
    ytTitle: 'ห้องฉุกเฉิน Tinglish EP.04: I go to home?! ❌ #Shorts',
    releaseAt: '2026-11-09T16:00:00Z',
  },
  {
    lang: 'my', ep: 4, slug: 'my04',
    topic: 'He is teacher',
    ytTitle: 'Burglish အရေးပေါ်ခန်း EP.04: He is teacher?! ❌ #Shorts',
    releaseAt: '2026-11-09T22:00:00Z',
  },
  {
    lang: 'es', ep: 4, slug: 'es04',
    topic: 'I am married with Ana',
    ytTitle: 'Urgencias de Spanglish EP.04: I am married with Ana?! ❌ #Shorts',
    releaseAt: '2026-11-11T16:00:00Z',
  },
  {
    lang: 'ru', ep: 4, slug: 'ru04',
    topic: 'How do you call this',
    ytTitle: 'Скорая помощь «Рунглиш» EP.04: How do you call this?! ❌ #Shorts',
    releaseAt: '2026-11-11T22:00:00Z',
  },
  {
    lang: 'ja', ep: 3, slug: 'ja03',
    topic: 'I am agree',
    ytTitle: 'ジャパングリッシュ救急室 EP.03: I am agree?! ❌ #Shorts',
    releaseAt: '2026-11-12T16:00:00Z',
  },
  {
    lang: 'zh', ep: 3, slug: 'zh03',
    topic: 'play the phone',
    ytTitle: '中式英语急诊室 EP.03: play the phone?! ❌ #Shorts',
    releaseAt: '2026-11-12T22:00:00Z',
  },
  {
    lang: 'vi', ep: 5, slug: 'vi05',
    topic: 'Open the light',
    ytTitle: 'Phòng cấp cứu Vietlish EP.05: Open the light?! ❌ #Shorts',
    releaseAt: '2026-11-13T16:00:00Z',
  },
  {
    lang: 'th', ep: 5, slug: 'th05',
    topic: 'Open the light, please',
    ytTitle: 'ห้องฉุกเฉิน Tinglish EP.05: Open the light, please?! ❌ #Shorts',
    releaseAt: '2026-11-13T22:00:00Z',
  },
  {
    lang: 'my', ep: 5, slug: 'my05',
    topic: 'She can sings well',
    ytTitle: 'Burglish အရေးပေါ်ခန်း EP.05: She can sings well?! ❌ #Shorts',
    releaseAt: '2026-11-14T16:00:00Z',
  },
  {
    lang: 'es', ep: 5, slug: 'es05',
    topic: 'I assist to class',
    ytTitle: 'Urgencias de Spanglish EP.05: I assist to class?! ❌ #Shorts',
    releaseAt: '2026-11-14T22:00:00Z',
  },
  {
    lang: 'ru', ep: 5, slug: 'ru05',
    topic: 'It depends from the weather',
    ytTitle: 'Скорая помощь «Рунглиш» EP.05: It depends from the weather?! ❌ #Shorts',
    releaseAt: '2026-11-15T16:00:00Z',
  },
  {
    lang: 'ja', ep: 4, slug: 'ja04',
    topic: 'I am boring',
    ytTitle: 'ジャパングリッシュ救急室 EP.04: I am boring?! ❌ #Shorts',
    releaseAt: '2026-11-15T22:00:00Z',
  },
  {
    lang: 'zh', ep: 4, slug: 'zh04',
    topic: 'Add oil',
    ytTitle: '中式英语急诊室 EP.04: Add oil?! ❌ #Shorts',
    releaseAt: '2026-11-16T16:00:00Z',
  },
  {
    lang: 'ja', ep: 5, slug: 'ja05',
    topic: 'I know him for 3 years',
    ytTitle: 'ジャパングリッシュ救急室 EP.05: I know him for 3 years?! ❌ #Shorts',
    releaseAt: '2026-11-16T22:00:00Z',
  },
  {
    lang: 'zh', ep: 5, slug: 'zh05',
    topic: 'many homeworks',
    ytTitle: '中式英语急诊室 EP.05: many homeworks?! ❌ #Shorts',
    releaseAt: '2026-11-17T16:00:00Z',
  },
  {
    lang: 'id', ep: 2, slug: 'id02',
    topic: 'I am boring',
    ytTitle: 'UGD Bahasa Inggris · Episode 2: I am boring?! ❌ #Shorts',
    releaseAt: '2026-11-17T22:00:00Z',
  },
  {
    lang: 'hi', ep: 2, slug: 'hi02',
    topic: 'I am knowing the answer',
    ytTitle: 'अंग्रेज़ी इमरजेंसी · Episode 2: I am knowing the answer?! ❌ #Shorts',
    releaseAt: '2026-11-18T16:00:00Z',
  },
  {
    lang: 'ar', ep: 2, slug: 'ar02',
    topic: 'I have seen him yesterday',
    ytTitle: 'طوارئ الإنجليزية · Episode 2: I have seen him yesterday?! ❌ #Shorts',
    releaseAt: '2026-11-18T22:00:00Z',
  },
  {
    lang: 'mn', ep: 2, slug: 'mn02',
    topic: 'I bought book yesterday',
    ytTitle: 'Англи хэлний яаралтай тусламж · Episode 2: I bought book yesterday?! ❌ #Shorts',
    releaseAt: '2026-11-19T16:00:00Z',
  },
  {
    lang: 'fa', ep: 2, slug: 'fa02',
    topic: 'I have 25 years old." (من ۲۵ سال دارم를 단어 그대로 옮긴 오류)',
    ytTitle: 'اورژانس انگلیسی · Episode 2: I have 25 years old." (من ۲۵ سال دارم를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-19T22:00:00Z',
  },
  {
    lang: 'lo', ep: 2, slug: 'lo02',
    topic: 'I very like it." (ຂ້ອຍມັກມັນຫຼາຍ를 단어 그대로 옮긴 오류)',
    ytTitle: 'ຫ້ອງສຸກເສີນພາສາອັງກິດ · Episode 2: I very like it." (ຂ້ອຍມັກມັນຫຼາຍ를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-20T16:00:00Z',
  },
  {
    lang: 'pt', ep: 2, slug: 'pt02',
    topic: 'I have 30 years',
    ytTitle: 'Pronto-Socorro do Inglês · Episode 2: I have 30 years?! ❌ #Shorts',
    releaseAt: '2026-11-20T22:00:00Z',
  },
  {
    lang: 'pl', ep: 2, slug: 'pl02',
    topic: 'I am teacher',
    ytTitle: 'Pogotowie Językowe · Episode 2: I am teacher?! ❌ #Shorts',
    releaseAt: '2026-11-21T16:00:00Z',
  },
  {
    lang: 'fr', ep: 2, slug: 'fr02',
    topic: 'I have 30 years',
    ytTitle: 'Urgences de l\'anglais · Episode 2: I have 30 years?! ❌ #Shorts',
    releaseAt: '2026-11-21T22:00:00Z',
  },
  {
    lang: 'de', ep: 2, slug: 'de02',
    topic: 'I learn English since 3 years',
    ytTitle: 'Englisch-Notaufnahme · Episode 2: I learn English since 3 years?! ❌ #Shorts',
    releaseAt: '2026-11-22T16:00:00Z',
  },
  {
    lang: 'id', ep: 3, slug: 'id03',
    topic: 'Please open the light',
    ytTitle: 'UGD Bahasa Inggris · Episode 3: Please open the light?! ❌ #Shorts',
    releaseAt: '2026-11-22T22:00:00Z',
  },
  {
    lang: 'hi', ep: 3, slug: 'hi03',
    topic: 'I did not went yesterday',
    ytTitle: 'अंग्रेज़ी इमरजेंसी · Episode 3: I did not went yesterday?! ❌ #Shorts',
    releaseAt: '2026-11-23T16:00:00Z',
  },
  {
    lang: 'ar', ep: 3, slug: 'ar03',
    topic: 'He is teacher',
    ytTitle: 'طوارئ الإنجليزية · Episode 3: He is teacher?! ❌ #Shorts',
    releaseAt: '2026-11-23T22:00:00Z',
  },
  {
    lang: 'mn', ep: 3, slug: 'mn03',
    topic: 'I to school yesterday went',
    ytTitle: 'Англи хэлний яаралтай тусламж · Episode 3: I to school yesterday went?! ❌ #Shorts',
    releaseAt: '2026-11-24T16:00:00Z',
  },
  {
    lang: 'fa', ep: 3, slug: 'fa03',
    topic: 'He is married with Sara." (او با سارا ازدواج کرده است를 단어 그대로 옮긴 오류)',
    ytTitle: 'اورژانس انگلیسی · Episode 3: He is married with Sara." (او با سارا ازدواج کرده است를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-24T22:00:00Z',
  },
  {
    lang: 'lo', ep: 3, slug: 'lo03',
    topic: 'My mother she is a teacher." (ແມ່ຂ້ອຍ ລາວເປັນຄູ를 단어 그대로 옮긴 오류)',
    ytTitle: 'ຫ້ອງສຸກເສີນພາສາອັງກິດ · Episode 3: My mother she is a teacher." (ແມ່ຂ້ອຍ ລາວເປັນຄູ를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-25T16:00:00Z',
  },
  {
    lang: 'pt', ep: 3, slug: 'pt03',
    topic: 'I am with hunger',
    ytTitle: 'Pronto-Socorro do Inglês · Episode 3: I am with hunger?! ❌ #Shorts',
    releaseAt: '2026-11-25T22:00:00Z',
  },
  {
    lang: 'pl', ep: 3, slug: 'pl03',
    topic: 'I will call you in Monday',
    ytTitle: 'Pogotowie Językowe · Episode 3: I will call you in Monday?! ❌ #Shorts',
    releaseAt: '2026-11-26T16:00:00Z',
  },
  {
    lang: 'fr', ep: 3, slug: 'fr03',
    topic: 'I have hot',
    ytTitle: 'Urgences de l\'anglais · Episode 3: I have hot?! ❌ #Shorts',
    releaseAt: '2026-11-26T22:00:00Z',
  },
  {
    lang: 'de', ep: 3, slug: 'de03',
    topic: 'I am good in English',
    ytTitle: 'Englisch-Notaufnahme · Episode 3: I am good in English?! ❌ #Shorts',
    releaseAt: '2026-11-27T16:00:00Z',
  },
  {
    lang: 'id', ep: 4, slug: 'id04',
    topic: 'Can you borrow me your pen',
    ytTitle: 'UGD Bahasa Inggris · Episode 4: Can you borrow me your pen?! ❌ #Shorts',
    releaseAt: '2026-11-27T22:00:00Z',
  },
  {
    lang: 'hi', ep: 4, slug: 'hi04',
    topic: 'He is my cousin brother',
    ytTitle: 'अंग्रेज़ी इमरजेंसी · Episode 4: He is my cousin brother?! ❌ #Shorts',
    releaseAt: '2026-11-28T16:00:00Z',
  },
  {
    lang: 'ar', ep: 4, slug: 'ar04',
    topic: 'I bought a car red',
    ytTitle: 'طوارئ الإنجليزية · Episode 4: I bought a car red?! ❌ #Shorts',
    releaseAt: '2026-11-28T22:00:00Z',
  },
  {
    lang: 'mn', ep: 4, slug: 'mn04',
    topic: 'He is my sister',
    ytTitle: 'Англи хэлний яаралтай тусламж · Episode 4: He is my sister?! ❌ #Shorts',
    releaseAt: '2026-11-29T16:00:00Z',
  },
  {
    lang: 'fa', ep: 4, slug: 'fa04',
    topic: 'I went to home yesterday." (دیروز به خانه رفتم를 단어 그대로 옮긴 오류)',
    ytTitle: 'اورژانس انگلیسی · Episode 4: I went to home yesterday." (دیروز به خانه رفتم를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-29T22:00:00Z',
  },
  {
    lang: 'lo', ep: 4, slug: 'lo04',
    topic: 'Please wait me." (ກະລຸນາຖ້າຂ້ອຍ를 단어 그대로 옮긴 오류)',
    ytTitle: 'ຫ້ອງສຸກເສີນພາສາອັງກິດ · Episode 4: Please wait me." (ກະລຸນາຖ້າຂ້ອຍ를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-11-30T16:00:00Z',
  },
  {
    lang: 'pt', ep: 4, slug: 'pt04',
    topic: 'I assist TV every night',
    ytTitle: 'Pronto-Socorro do Inglês · Episode 4: I assist TV every night?! ❌ #Shorts',
    releaseAt: '2026-11-30T22:00:00Z',
  },
  {
    lang: 'pl', ep: 4, slug: 'pl04',
    topic: 'I learn English since two years',
    ytTitle: 'Pogotowie Językowe · Episode 4: I learn English since two years?! ❌ #Shorts',
    releaseAt: '2026-12-01T16:00:00Z',
  },
  {
    lang: 'fr', ep: 4, slug: 'fr04',
    topic: 'I am boring." (Je m\'ennuie의 의미)',
    ytTitle: 'Urgences de l\'anglais · Episode 4: I am boring." (Je m\'ennuie의 의미)?! ❌ #Shorts',
    releaseAt: '2026-12-01T22:00:00Z',
  },
  {
    lang: 'de', ep: 4, slug: 'de04',
    topic: 'I have hunger',
    ytTitle: 'Englisch-Notaufnahme · Episode 4: I have hunger?! ❌ #Shorts',
    releaseAt: '2026-12-02T16:00:00Z',
  },
  {
    lang: 'id', ep: 5, slug: 'id05',
    topic: 'Let\'s discuss about the plan',
    ytTitle: 'UGD Bahasa Inggris · Episode 5: Let\'s discuss about the plan?! ❌ #Shorts',
    releaseAt: '2026-12-02T22:00:00Z',
  },
  {
    lang: 'hi', ep: 5, slug: 'hi05',
    topic: 'I passed out in 2020',
    ytTitle: 'अंग्रेज़ी इमरजेंसी · Episode 5: I passed out in 2020?! ❌ #Shorts',
    releaseAt: '2026-12-03T16:00:00Z',
  },
  {
    lang: 'ar', ep: 5, slug: 'ar05',
    topic: 'I need some informations',
    ytTitle: 'طوارئ الإنجليزية · Episode 5: I need some informations?! ❌ #Shorts',
    releaseAt: '2026-12-03T22:00:00Z',
  },
  {
    lang: 'mn', ep: 5, slug: 'mn05',
    topic: 'He go to work every day',
    ytTitle: 'Англи хэлний яаралтай тусламж · Episode 5: He go to work every day?! ❌ #Shorts',
    releaseAt: '2026-12-04T16:00:00Z',
  },
  {
    lang: 'fa', ep: 5, slug: 'fa05',
    topic: 'I know him since 5 years." (من او را از ۵ سال پیش می‌شناسم를 단어 그대로 옮긴 오류)',
    ytTitle: 'اورژانس انگلیسی · Episode 5: I know him since 5 years." (من او را از ۵ سال پیش می‌شناسم를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-12-04T22:00:00Z',
  },
  {
    lang: 'lo', ep: 5, slug: 'lo05',
    topic: 'Please open the light." (ກະລຸນາເປີດໄຟ를 단어 그대로 옮긴 오류)',
    ytTitle: 'ຫ້ອງສຸກເສີນພາສາອັງກິດ · Episode 5: Please open the light." (ກະລຸນາເປີດໄຟ를 단어 그대로 옮긴 오류)?! ❌ #Shorts',
    releaseAt: '2026-12-05T16:00:00Z',
  },
  {
    lang: 'pt', ep: 5, slug: 'pt05',
    topic: 'I pretend to travel next year',
    ytTitle: 'Pronto-Socorro do Inglês · Episode 5: I pretend to travel next year?! ❌ #Shorts',
    releaseAt: '2026-12-05T22:00:00Z',
  },
  {
    lang: 'pl', ep: 5, slug: 'pl05',
    topic: 'I speak English very good',
    ytTitle: 'Pogotowie Językowe · Episode 5: I speak English very good?! ❌ #Shorts',
    releaseAt: '2026-12-06T16:00:00Z',
  },
  {
    lang: 'fr', ep: 5, slug: 'fr05',
    topic: 'I have seen a good movie yesterday',
    ytTitle: 'Urgences de l\'anglais · Episode 5: I have seen a good movie yesterday?! ❌ #Shorts',
    releaseAt: '2026-12-06T22:00:00Z',
  },
  {
    lang: 'de', ep: 5, slug: 'de05',
    topic: 'I make my homework',
    ytTitle: 'Englisch-Notaufnahme · Episode 5: I make my homework?! ❌ #Shorts',
    releaseAt: '2026-12-07T16:00:00Z',
  },
];

export type KonglishStatus = 'released' | 'early' | 'upcoming';

const EARLY_WINDOW_MS = 48 * 60 * 60 * 1000; // early access opens 48h before release

export function episodeStatus(ep: KonglishEpisode, now: number = Date.now()): KonglishStatus {
  const release = Date.parse(ep.releaseAt);
  if (now >= release) return 'released';
  if (now >= release - EARLY_WINDOW_MS) return 'early';
  return 'upcoming';
}

export function episodesForLang(lang: KonglishLang): KonglishEpisode[] {
  return KONGLISH_EPISODES.filter((e) => e.lang === lang).sort((a, b) => a.ep - b.ep);
}

export function nextEpisodeForLang(lang: KonglishLang, now: number = Date.now()): KonglishEpisode | null {
  const upcoming = episodesForLang(lang).filter((e) => Date.parse(e.releaseAt) > now);
  return upcoming.length > 0 ? upcoming[0] : null;
}

export function latestReleasedForLang(lang: KonglishLang, now: number = Date.now()): KonglishEpisode | null {
  const released = episodesForLang(lang).filter((e) => Date.parse(e.releaseAt) <= now);
  return released.length > 0 ? released[released.length - 1] : null;
}
