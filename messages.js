export const CAT_NAME = 'Coca';

// Message pools. {n} = streak days, {weeks} = completed weeks, {weeksText} = "1 week" / "2 weeks".
export const POOLS = {
  daily: [
    'Yesterday you stayed under the limit. I knocked a glass off the counter in celebration.',
    'Under the limit. I am not impressed. (I am slightly impressed.)',
    "Day {n}. I've been watching. You're doing fine. Don't let it go to your head.",
    'Fizzy temptation: 0. You: 1. The cat approves, reluctantly.',
    'You did the thing. I will allow one (1) purr.',
    'Oh, you actually did it. I had money on the soda.',
    'Look who has self-control. I shall now nap in your honor.',
    'Streak: {n}. I licked my paw for you. That is a big deal.',
    'Yesterday: under the limit. Today: also? I will be watching.',
    'Acceptable. Truly. Acceptable.',
    'I sat on something important to celebrate. You are welcome.',
    '{n} days. I would high-five you but, again, paws.',
  ],
  perfect: [
    'Zero sodas. ZERO. I am so proud I could knock something off a shelf.',
    'Not a single soda. Are you feeling alright? Great. Keep it up.',
    'A perfect day. I have told the other cats.',
    'Nothing. Nada. Not even a sip. The fish are jealous.',
    'Zero cokes! Have a treat. I am having one too.',
    'A flawless day. I am going to pretend I was never worried.',
  ],
  cheat: [
    'Cheat day used. I saw everything. The streak is safe. I am not mad, just watching.',
    'One cheat day, as agreed. The streak lives. My eyebrow does not relax.',
    'You cashed in your cheat day. It is in my little notebook of judgment.',
    'Cheat day: spent. Streak: intact. Eye contact: maintained.',
  ],
  week: [
    'A WHOLE WEEK?! I am throwing a party. There will be tuna.',
    '{n} days! That is {weeksText} of excellence. I am... purring. Do not tell anyone.',
    'Another week in the books! I am wearing a party hat unironically.',
    'Seven more days of greatness. I am emotionally compromised.',
    'Week {weeks} complete. I would clap but I have no thumbs.',
    'You are officially a soda-slaying legend. You may pet me. Once.',
    'ANOTHER week! I knocked every cup in the house to the floor. Out of respect.',
  ],
  badges: [
    'Late delivery! Your badge has arrived. I carried it in my mouth.',
    'I found this under the couch. It is yours. You earned it.',
    'A badge, as promised. Do not make me say I am proud.',
  ],
};

// What the cat says on the main screen, by situation.
export const QUIPS = {
  fresh: ['Day one. Let us see what you are made of.', 'New goal, who dis? I will be watching.'],
  zero: ['Zero sodas so far. I suppose that is acceptable.', 'Nothing yet. I am pretending to be calm.', 'Clean paws so far. Keep it up.'],
  under: ['Hm. Still under the limit. I am watching.', 'Fine. You are doing fine. Do not get cocky.', 'I see you. I am not saying anything. Yet.'],
  atLimit: ['That was the last one, wasn’t it.', 'Right at the limit. Bold. Very bold.', 'One more and we will be having a talk.'],
  cheat: ['Cheat day. Go on. I will be here, judging silently.', 'Enjoy it. I am memorizing your face while you do.'],
  over: ['...', 'I am not angry. I am just disappointed. And a little angry.', 'Over the limit. I am writing this down.'],
};

export const CLOSE_LABELS = ['Fine, thanks', 'Okay, okay', 'Noted.', 'Purr. Moving on.'];
