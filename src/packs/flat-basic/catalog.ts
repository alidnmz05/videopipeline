import type {PackCatalog} from '../../engine/pack';

export const catalog: PackCatalog = {
  id: 'flat-basic',
  character:
    'a flat-vector person with a round head. color = any hex shirt color. Only one character design exists: vary shirt colors. For "everyone / most people / you are not alone", show 2-3 characters at scale 1.0-1.1 spread across x.',
  backgrounds: {
    office: 'work, money',
    sky: 'daytime, positive',
    night: 'outdoors at night, worry',
    bedroom: 'dark indoor room with a bed: sleep, late night',
    studio: 'orange with rotating rays: high-energy and neutral; hooks, questions, punchlines',
  },
  darkBackgrounds: ['night', 'bedroom'],
  props: {
    coin: 'money',
    robot: 'AI, automation, machines; eyes blink',
    briefcase: 'a job, work, career',
    chart: 'growth line, use enter=draw',
    bulb: 'idea, solution',
    warning: 'risk, problem',
    phone: 'screens, social media; glows and scrolls',
    clock: 'time, hours; hands spin',
    moon: 'night, sleep',
    zzz: 'sleepiness, floating Zs',
    arrowUp: 'increase',
    check: "correct, do this; use enter=draw",
    cross: "wrong, stop, don't",
    heart: 'health, love',
    brain: 'mind, focus, thinking',
    document: 'a contract, a signed paper, a commitment; use enter=draw to sign it',
    gavel: 'court, judge, lawsuit; the gavel keeps striking',
    house: 'a home, a rented flat, property',
    calendar: 'dates, deadlines, a term or year passing; pages flip',
  },
};
