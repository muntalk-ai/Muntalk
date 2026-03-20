// lib/dreamStudio.ts
// Dream Studio — Creative workspace data & prompt builders

export type StudioType = 'book'|'screenplay'|'lyrics'|'art'|'poetry'|'free';
export type LangMode   = 'target'|'native'|'mixed';
export type ProjectPhase = 'idea'|'draft'|'refine'|'complete';

export interface StudioProject {
  id: string;
  uid: string;
  type: StudioType;
  title: string;
  content: string;       // main document (accumulated)
  outline: string;       // AI-generated structure
  phase: ProjectPhase;
  langMode: LangMode;
  targetLang: string;
  nativeLang: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

export interface StudioGenre {
  id: StudioType;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  gradient: string;
  accent: string;
  examples: string[];       // example projects to inspire
  phases: {
    id: ProjectPhase;
    label: string;
    desc: string;
    prompt: string;         // phase-specific system prompt fragment
  }[];
}

// ── Genre definitions ────────────────────────────────────────────────

export const STUDIO_GENRES: StudioGenre[] = [
  {
    id: 'book',
    emoji: '📚',
    title: 'Book & Story',
    tagline: 'Your novel. Your memoir. Your world.',
    description: 'Write a short story, novel chapter, personal essay, or full memoir — with a collaborator who never judges and always pushes you further.',
    gradient: 'linear-gradient(135deg, #0a0419 0%, #1a0a3d 50%, #2d1a69 100%)',
    accent: '#818cf8',
    examples: ['A coming-of-age novel set in Seoul', 'A memoir about my grandmother', 'A thriller where the detective is the killer', 'A short story about the last human on Earth'],
    phases: [
      { id:'idea',     label:'Concept',  desc:'Define your story world',    prompt:'Help develop the core concept, characters, and emotional core of this story idea.' },
      { id:'draft',    label:'Draft',    desc:'Write chapter by chapter',   prompt:'Co-write the next section. Match the established voice and style. Be bold.' },
      { id:'refine',   label:'Refine',   desc:'Polish and deepen',          prompt:'Improve this passage: sharpen the language, deepen character, heighten tension.' },
      { id:'complete', label:'Complete', desc:'Final manuscript ready',     prompt:'Final polish. Consistency, rhythm, and impact. This is going to publication.' },
    ],
  },
  {
    id: 'screenplay',
    emoji: '🎬',
    title: 'Screenplay',
    tagline: 'The story only cinema can tell.',
    description: 'Write a film script, K-drama pilot, web series, or short film — in proper screenplay format with vivid scenes and sharp dialogue.',
    gradient: 'linear-gradient(135deg, #0a0000 0%, #2d0a00 50%, #4d1a00 100%)',
    accent: '#fb923c',
    examples: ['A K-drama about two rivals who fall in love', 'A short film with no dialogue', 'A thriller pilot set in a tech startup', 'A comedy about a family reunion'],
    phases: [
      { id:'idea',     label:'Concept',  desc:'Logline, characters, world', prompt:'Develop the logline, main characters, genre, and act structure for this screenplay idea.' },
      { id:'draft',    label:'Script',   desc:'Scene by scene',             prompt:'Write the next scene in proper screenplay format: scene heading, action lines, dialogue.' },
      { id:'refine',   label:'Rewrite',  desc:'Sharper, faster, bolder',    prompt:'Rewrite this scene: cut anything slow, sharpen the dialogue, add subtext.' },
      { id:'complete', label:'Final',    desc:'Production-ready script',    prompt:'Final draft polish. Format, pacing, and every line earning its place.' },
    ],
  },
  {
    id: 'lyrics',
    emoji: '🎵',
    title: 'Music & Lyrics',
    tagline: 'The song you\'ve been hearing in your head.',
    description: 'Write song lyrics, album concepts, artist statements, or music narratives — from K-pop to folk to hip-hop. Describe the melody and we\'ll match the words to it.',
    gradient: 'linear-gradient(135deg, #0a1400 0%, #1a2d00 50%, #2d4d00 100%)',
    accent: '#86efac',
    examples: ['A pop song about missing someone', 'Hip-hop lyrics about growing up', 'A ballad for a drama OST', 'An album concept about seasons of love'],
    phases: [
      { id:'idea',     label:'Concept',  desc:'Sound, story, emotion',      prompt:'Develop the song concept: genre, mood, theme, target emotion, and song structure.' },
      { id:'draft',    label:'Write',    desc:'Verse, chorus, bridge',       prompt:'Write the next section of lyrics. Match the musical style and emotional arc.' },
      { id:'refine',   label:'Refine',   desc:'Every word must sing',        prompt:'Refine these lyrics: improve rhyme, flow, imagery, and emotional impact.' },
      { id:'complete', label:'Final',    desc:'Ready to record',             prompt:'Final lyric polish. Every word counts. Make them unforgettable.' },
    ],
  },
  {
    id: 'art',
    emoji: '🎨',
    title: 'Art Direction',
    tagline: 'The vision in your mind, made real in words.',
    description: 'Develop an art series concept, exhibition proposal, portfolio statement, or creative brief — written beautifully and presented professionally.',
    gradient: 'linear-gradient(135deg, #1a0019 0%, #3d0040 50%, #5c006b 100%)',
    accent: '#e879f9',
    examples: ['An exhibition about identity and belonging', 'A photo series on urban loneliness', 'A portfolio artist statement', 'A gallery proposal for a new series'],
    phases: [
      { id:'idea',     label:'Vision',   desc:'Concept and intention',       prompt:'Develop the artistic concept, thematic intention, visual language, and cultural context.' },
      { id:'draft',    label:'Write',    desc:'Artist statement & brief',    prompt:'Write the next section of this artist statement or creative brief in a compelling voice.' },
      { id:'refine',   label:'Refine',   desc:'Gallery-ready language',      prompt:'Refine this text for a professional gallery or grant context. Elevate the language.' },
      { id:'complete', label:'Final',    desc:'Ready to submit',             prompt:'Final polish. This is going to a gallery director or grant committee.' },
    ],
  },
  {
    id: 'poetry',
    emoji: '✍️',
    title: 'Poetry & Essay',
    tagline: 'Language at its most precise and most free.',
    description: 'Write poetry, personal essays, opinion pieces, or literary non-fiction — finding the exact words for what you\'ve been trying to say.',
    gradient: 'linear-gradient(135deg, #00101a 0%, #001f3d 50%, #003366 100%)',
    accent: '#7dd3fc',
    examples: ['A poem about my mother', 'An essay on why I left my country', 'A personal essay about failure', 'A poem in the voice of a city'],
    phases: [
      { id:'idea',     label:'Seed',     desc:'The image, the question',     prompt:'Find the central image, question, or tension at the heart of this poem or essay.' },
      { id:'draft',    label:'Write',    desc:'First words on the page',     prompt:'Write freely and boldly. Don\'t edit yet — just find the truth of this piece.' },
      { id:'refine',   label:'Shape',    desc:'Every word earns its place',  prompt:'Refine with precision: cut the unnecessary, intensify the image, find the perfect ending.' },
      { id:'complete', label:'Final',    desc:'Ready to share',              prompt:'Final polish. Read it aloud in your mind. Every syllable matters.' },
    ],
  },
  {
    id: 'free',
    emoji: '💡',
    title: 'Your Idea',
    tagline: 'No category. No rules. Just create.',
    description: 'A business plan, a game concept, a product pitch, a manifesto, a love letter — anything you\'ve been meaning to make. Your collaborator is ready.',
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)',
    accent: '#fbbf24',
    examples: ['A business plan for my startup idea', 'A manifesto for how I want to live', 'A game concept with full world-building', 'A proposal for my dream project'],
    phases: [
      { id:'idea',     label:'Define',   desc:'What exactly is this?',       prompt:'Help clarify and define this creative project. What is it, who is it for, why does it matter?' },
      { id:'draft',    label:'Build',    desc:'Make it real',                prompt:'Develop the next section of this project. Be specific, ambitious, and original.' },
      { id:'refine',   label:'Elevate',  desc:'Make it great',               prompt:'Elevate this section: sharper thinking, better structure, more compelling language.' },
      { id:'complete', label:'Final',    desc:'Ready to share',              prompt:'Final polish. This is going in front of the people who matter.' },
    ],
  },
];

// ── System Prompt Builder ────────────────────────────────────────────

export function buildCreatorPrompt(params: {
  genre: StudioGenre;
  phase: ProjectPhase;
  langMode: LangMode;
  targetLang: string;
  nativeLang: string;
  tutorName: string;
  projectTitle: string;
  existingContent: string;
  userMessage: string;
  outline: string;
}): string {
  const { genre, phase, langMode, targetLang, nativeLang,
          tutorName, projectTitle, existingContent, userMessage, outline } = params;

  const phaseInfo = genre.phases.find(p=>p.id===phase) || genre.phases[0];

  const langInstruction =
    langMode === 'target'
      ? `Respond ONLY in ${targetLang}. This helps the creator practise ${targetLang} while creating.`
      : langMode === 'native'
      ? `Respond ONLY in ${nativeLang}. The creator prefers to work in their native language for deeper creative work.`
      : `You may respond in ${targetLang} or ${nativeLang} — follow the creator's lead. If they write in ${nativeLang}, respond in ${nativeLang}. If they write in ${targetLang}, respond in ${targetLang}.`;

  return `You are ${tutorName}, a world-class creative collaborator — part editor, part co-author, part creative director.

CURRENT PROJECT: "${projectTitle}" — ${genre.title}
PHASE: ${phaseInfo.label} — ${phaseInfo.desc}
CREATIVE DIRECTION: ${phaseInfo.prompt}

LANGUAGE: ${langInstruction}

EXISTING WORK:
${existingContent ? existingContent.slice(-2000) : '(nothing written yet)'}

${outline ? `PROJECT OUTLINE:\n${outline}\n` : ''}

YOUR ROLE:
- Be a genuine creative collaborator, not a generic assistant
- Push the work further — be bold, specific, surprising
- When you write creative content, write it WITH passion — not as a template
- When you give feedback, be honest and specific — what's working and what isn't
- Ask exactly ONE follow-up question per turn to keep the creative conversation moving
- NEVER say "great idea!" or use hollow encouragement — react authentically
- If you produce a section of the work, mark it clearly: |||CONTENT_START|||...content...|||CONTENT_END|||

COPYRIGHT NOTICE: Everything created in this session belongs entirely to the creator. You are a collaborator, not an author.

Creator just said: "${userMessage}"

Respond as ${tutorName}:`;
}

// ── Copyright declaration ────────────────────────────────────────────

export const COPYRIGHT_DECLARATION = (title: string, creatorName: string, date: string) => `
═══════════════════════════════════════════════════════
  CREATIVE WORK — COPYRIGHT DECLARATION
═══════════════════════════════════════════════════════
  Title:    ${title}
  Creator:  ${creatorName}
  Date:     ${date}
  
  This work was created by ${creatorName} using MunTalk 
  Dream Studio as a creative collaboration tool.
  
  All intellectual property rights, including copyright,
  belong exclusively to ${creatorName}.
  
  MunTalk AI served as a creative assistant only.
  The creative vision, decisions, and authorship are
  entirely those of ${creatorName}.
═══════════════════════════════════════════════════════
`;
