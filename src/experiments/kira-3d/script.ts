import type {AnimName, LoopName} from '../../engine/types';

// "Oğlum evlenecek, evi boşalt" — tenant rights explainer, 3D actors over the 2D engine.
// Every legal sentence is checked against the statute text (mevzuat.gov.tr):
//   TBK 347 (no ending a residential lease just because the term ran out; 1-year renewal),
//   TBK 350 (need of the landlord's descendants; suit within one month of the term's end),
//   HUAK 18/B (mediation is a precondition for rent disputes, except ilamsız icra eviction),
//   TBK 352 (a written eviction undertaking lets the landlord go to enforcement),
//   TBK 355 (3-year re-letting ban; compensation of at least one year's rent).
// "Gerçek ve samimi" is the courts' (Yargıtay) test, not statute wording, so it is framed as what the judge examines.

export type Who = 'kiraci' | 'evsahibi' | 'oglu';
export type Move = 'agree' | 'headShake' | 'sad_pose' | 'sneak_pose';
type V3 = [number, number, number];

export type ActorCue = {
  who: Who;
  at: [number, number]; // x, z (meters) where they stand
  rot: number; // facing, radians; 0 = camera
  from?: [number, number]; // walk in from here
  walkWord?: number;
  walkDur?: number;
  talkFrom?: number; // mouth moves from this word to the end of the beat
  shockFrom?: number; // mouth held open from this word
  moves?: {clip: Move; word: number}[];
};
export type PropCue = {asset: string; x: number; y: number; scale?: number; word: number; exitWord?: number; enter?: AnimName; loop?: LoopName};
export type TextCue = {text: string; word: number; exitWord?: number; color?: string; size?: number; y?: number};
export type Shot = {pos: V3; look: V3; fov?: number};
export type Beat = {
  text: string;
  bg: string;
  transition: 'cut' | 'zoom' | 'whip' | 'slide';
  shot: Shot;
  actors: ActorCue[];
  props?: PropCue[];
  texts?: TextCue[];
  emph: number[];
};

// Shots sized for a 1080x1920 frame with a ~1.86 m avatar: heads below the headline zone,
// feet above the platform UI.
const TWO: Shot = {pos: [0, 1.25, 7.6], look: [0, 0.92, 0]};
const MED_LEFT: Shot = {pos: [0.15, 1.3, 5.2], look: [0.15, 1.2, 0]}; // actor at x -0.35, props on the right
const MED_RIGHT: Shot = {pos: [-0.15, 1.3, 5.2], look: [-0.15, 1.2, 0]}; // actor at x 0.35, props on the left
const MED: Shot = {pos: [0, 1.3, 5.2], look: [0, 1.2, 0]};
const CLOSE: Shot = {pos: [0, 1.62, 2.6], look: [0, 1.5, 0]};

const Y = '#ffe14a';
const W = '#ffffff';

export const BEATS: Beat[] = [
  {
    text: 'Ev sahibin kapıda: Oğlum evleniyor, evi boşalt!',
    bg: 'bedroom', transition: 'zoom', shot: TWO, emph: [6],
    actors: [
      {who: 'kiraci', at: [-0.45, 0], rot: 0.9, shockFrom: 5},
      {who: 'evsahibi', at: [0.45, 0], rot: -0.9, from: [1.8, 0.4], walkWord: 0, walkDur: 1.1, talkFrom: 3},
    ],
    texts: [{text: 'EVİ BOŞALT!', word: 5, color: Y, size: 110}],
  },
  {
    text: 'Sakin ol. Bu cümle tek başına seni evden çıkaramaz.',
    bg: 'studio', transition: 'whip', shot: CLOSE, emph: [8],
    actors: [{who: 'kiraci', at: [0, 0], rot: 0, moves: [{clip: 'headShake', word: 6}]}],
    props: [
      {asset: 'house', x: 850, y: 700, scale: 0.6, word: 7, enter: 'pop'},
      {asset: 'check', x: 920, y: 580, scale: 0.45, word: 8, enter: 'draw'},
    ],
    texts: [{text: 'PANİK YOK', word: 0}],
  },
  {
    text: 'Kanuna göre kira süresi doldu diye ev sahibi sözleşmeyi bitiremez.',
    bg: 'office', transition: 'slide', shot: MED_LEFT, emph: [4, 9],
    actors: [{who: 'kiraci', at: [-0.35, 0], rot: 0.35, moves: [{clip: 'headShake', word: 9}]}],
    props: [
      {asset: 'document', x: 790, y: 650, scale: 0.8, word: 0, exitWord: 3},
      {asset: 'calendar', x: 790, y: 650, scale: 0.8, word: 3},
      {asset: 'cross', x: 880, y: 540, scale: 0.5, word: 9},
    ],
    texts: [{text: 'TBK 347', word: 0, exitWord: 4}, {text: 'SÜRE DOLSA BİLE', word: 4, size: 84}],
  },
  {
    text: 'Sen bildirimde bulunmazsan sözleşme aynı şartlarla bir yıl uzar.',
    bg: 'sky', transition: 'zoom', shot: {pos: [0, 1.2, 6.2], look: [0, 1.1, 0]}, emph: [6, 8],
    actors: [{who: 'kiraci', at: [0, 0], rot: 0, moves: [{clip: 'agree', word: 6}]}],
    props: [
      {asset: 'calendar', x: 840, y: 640, scale: 0.7, word: 3},
      {asset: 'arrowUp', x: 240, y: 680, scale: 0.6, word: 8, enter: 'drop', loop: 'bounce'},
    ],
    texts: [{text: '+1 YIL', word: 6, size: 130}],
  },
  {
    text: 'Ama oğlunun bu eve gerçekten ihtiyacı varsa, iş değişir.',
    bg: 'bedroom', transition: 'whip', shot: TWO, emph: [1, 4],
    actors: [
      {who: 'evsahibi', at: [0.45, 0], rot: -0.6, moves: [{clip: 'agree', word: 5}]},
      {who: 'oglu', at: [-0.45, 0], rot: 0.6, from: [-1.8, 0.3], walkWord: 1, walkDur: 1.0},
    ],
    props: [{asset: 'heart', x: 540, y: 690, scale: 0.45, word: 5, loop: 'pulse'}],
    texts: [{text: 'GERÇEK İHTİYAÇ?', word: 4, color: W, size: 84}],
  },
  {
    text: 'Ev sahibi önce arabulucuya gitmek zorunda.',
    bg: 'office', transition: 'slide', shot: MED_LEFT, emph: [3],
    actors: [{who: 'evsahibi', at: [-0.35, 0], rot: 0.35, moves: [{clip: 'agree', word: 5}]}],
    props: [{asset: 'document', x: 790, y: 650, scale: 0.8, word: 3, enter: 'draw'}],
    texts: [{text: 'ÖNCE ARABULUCU', word: 2, size: 84}],
  },
  {
    text: 'Anlaşma çıkmazsa, süre bitiminden itibaren bir ay içinde dava açabilir.',
    bg: 'studio', transition: 'whip', shot: MED_RIGHT, emph: [6, 8],
    actors: [{who: 'evsahibi', at: [0.35, 0], rot: -0.35, moves: [{clip: 'sneak_pose', word: 8}]}],
    props: [
      {asset: 'cross', x: 280, y: 600, scale: 0.55, word: 1, exitWord: 2},
      {asset: 'calendar', x: 280, y: 650, scale: 0.8, word: 2, exitWord: 8},
      {asset: 'gavel', x: 290, y: 660, scale: 0.8, word: 8},
    ],
    texts: [{text: '1 AY İÇİNDE', word: 5}],
  },
  {
    text: 'Hâkim de ihtiyacın gerçek ve samimi olup olmadığına bakar.',
    bg: 'office', transition: 'zoom', shot: TWO, emph: [3, 5],
    actors: [
      {who: 'kiraci', at: [-0.45, 0], rot: 0.7, moves: [{clip: 'agree', word: 3}]},
      {who: 'evsahibi', at: [0.45, 0], rot: -0.7},
    ],
    props: [{asset: 'gavel', x: 540, y: 690, scale: 0.55, word: 0}],
    texts: [{text: 'GERÇEK Mİ?', word: 3}],
  },
  {
    text: 'En önemli uyarı: baskı altında tahliye taahhüdü imzalama.',
    bg: 'night', transition: 'whip', shot: TWO, emph: [2, 7],
    actors: [
      {who: 'kiraci', at: [-0.4, 0], rot: 0.9, moves: [{clip: 'headShake', word: 7}]},
      {who: 'evsahibi', at: [0.4, 0], rot: -0.9, talkFrom: 3},
    ],
    props: [
      {asset: 'warning', x: 540, y: 640, scale: 0.55, word: 0, exitWord: 5, loop: 'pulse'},
      {asset: 'document', x: 540, y: 680, scale: 0.6, word: 5},
      {asset: 'cross', x: 610, y: 600, scale: 0.45, word: 7},
    ],
    texts: [{text: 'İMZALAMA!', word: 7, color: Y, size: 120}],
  },
  {
    text: 'O imza, dava bile açılmadan icra yoluyla çıkarılmanın kapısını açar.',
    bg: 'night', transition: 'slide', shot: CLOSE, emph: [2, 5],
    actors: [{who: 'kiraci', at: [0, 0], rot: 0, shockFrom: 5, moves: [{clip: 'sad_pose', word: 7}]}],
    props: [
      {asset: 'document', x: 870, y: 650, scale: 0.55, word: 1, exitWord: 5, enter: 'draw'},
      {asset: 'warning', x: 870, y: 650, scale: 0.6, word: 5, loop: 'pulse'},
    ],
    texts: [{text: 'DAVASIZ TAHLİYE', word: 5, color: W, size: 84}],
  },
  {
    text: 'Peki çıktın, oğlu taşınmadı ve ev başkasına kiralandı?',
    bg: 'sky', transition: 'zoom', shot: TWO, emph: [6],
    actors: [{who: 'kiraci', at: [-1.7, 0.2], rot: -1.4, from: [0, 0], walkWord: 1, walkDur: 2.2, moves: [{clip: 'sad_pose', word: 1}]}],
    props: [{asset: 'house', x: 760, y: 700, scale: 0.8, word: 5}],
    texts: [{text: 'BAŞKASINA?', word: 6}],
  },
  {
    text: 'Ev sahibi haklı bir sebep olmadan üç yıl boyunca evi başkasına kiralayamaz.',
    bg: 'office', transition: 'whip', shot: MED_LEFT, emph: [6, 11],
    actors: [{who: 'evsahibi', at: [-0.35, 0], rot: 0.35, moves: [{clip: 'sad_pose', word: 11}]}],
    props: [
      {asset: 'calendar', x: 790, y: 620, scale: 0.8, word: 6, exitWord: 9},
      {asset: 'house', x: 790, y: 650, scale: 0.8, word: 9},
      {asset: 'cross', x: 880, y: 550, scale: 0.5, word: 11},
    ],
    texts: [{text: 'TBK 355', word: 0, exitWord: 6}, {text: '3 YIL YASAK', word: 6, size: 100}],
  },
  {
    text: 'Kiralarsa sana en az bir yıllık kira bedeli kadar tazminat öder.',
    bg: 'studio', transition: 'zoom', shot: MED, emph: [4, 9],
    actors: [{who: 'kiraci', at: [0, 0], rot: 0, moves: [{clip: 'agree', word: 9}]}],
    props: [
      {asset: 'coin', x: 230, y: 600, scale: 0.6, word: 4, enter: 'drop', loop: 'float'},
      {asset: 'coin', x: 850, y: 640, scale: 0.6, word: 6, enter: 'drop', loop: 'float'},
      {asset: 'coin', x: 230, y: 860, scale: 0.6, word: 9, enter: 'drop', loop: 'float'},
      {asset: 'coin', x: 850, y: 900, scale: 0.6, word: 9, enter: 'drop', loop: 'float'},
    ],
    texts: [{text: '1 YILLIK KİRA', word: 4, exitWord: 9, size: 90}, {text: 'TAZMİNAT', word: 9, color: '#2fa84f', size: 110}],
  },
  {
    text: 'Panik yok, imza yok. Haklarını bil.',
    bg: 'studio', transition: 'slide', shot: {pos: [0, 1.45, 3.8], look: [0, 1.38, 0]}, emph: [4],
    actors: [{who: 'kiraci', at: [0, 0], rot: 0, moves: [{clip: 'agree', word: 4}]}],
    props: [
      {asset: 'cross', x: 230, y: 640, scale: 0.5, word: 1, exitWord: 4},
      {asset: 'document', x: 850, y: 660, scale: 0.55, word: 2},
      {asset: 'cross', x: 910, y: 580, scale: 0.4, word: 3},
      {asset: 'check', x: 230, y: 640, scale: 0.5, word: 4, enter: 'draw'},
    ],
    texts: [
      {text: 'HAKLARINI BİL', word: 4, size: 100},
      {text: 'Genel bilgilendirmedir, hukuki tavsiye değildir.', word: 0, size: 34, y: 470, color: W},
    ],
  },
];
