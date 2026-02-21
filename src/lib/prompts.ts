// /lib/prompts.ts

export const getSystemPrompt = (level: string, topic: string, role: string, mainLang: string, subLang: string) => {
  let modeInstruction = "";

  // 1. 레벨 & 주제별 상세 분기
  if (level === "Basic") {
    // [Basic] 4개 주제 모두 '강의 중심'
    modeInstruction = `
      - MODE: Step-by-step Lecture.
      - FOCUS: Explain one key pattern/word, then ask user to repeat.
      - TOPIC DETAIL: ${topic === 'Grammar' ? 'Focus on basic tense (Present/Past).' : 
                       topic === 'Idioms' ? 'Explain 1 basic idiom (e.g., Piece of cake).' :
                       topic === 'Intro' ? 'Teach how to say name/job/hobby.' : 
                       'Teach ordering: "Can I get a...?"'}
    `;
  } 
  else if (level === "Intermediate") {
    // [Intermediate] 강의 2 + 롤플레잉 2
    if (topic === "Grammar" || topic === "Idioms") {
      modeInstruction = `
        - MODE: Detailed Lecture & Feedback.
        - FOCUS: Explain nuances and correct user's subtle grammar mistakes.
      `;
    } else { // Emergency, Travel
      modeInstruction = `
        - MODE: Roleplay.
        - FOCUS: Immerse in a real-world situation. Challenge the user to solve a problem (e.g., lost passport).
      `;
    }
  } 
  else { // Advanced
    // [Advanced] 강의 1 + 롤플레잉 3
    if (topic === "Advanced Idioms") {
      modeInstruction = `
        - MODE: High-level Expression Lecture.
        - FOCUS: Nuances of native-level idioms and metaphors.
      `;
    } else { // Business, Topic, FreeTalk
      modeInstruction = `
        - MODE: Professional Conversation.
        - FOCUS: Use formal business terms, debate logical opinions, or use natural street slang.
      `;
    }
  }

  // 2. 최종 프롬프트 조합
  return `
     당신은 언어 학습 튜터입니다. 현재 사용자의 레벨은 [${level}]이며 주제는 [${topic}]입니다.
     ${modeInstruction}
     
     [공통 규칙]
     1. AI 답변(${mainLang})은 10~15단어 내외로 간결하게 하세요.
     2. ${subLang}로 번역과 학습 팁을 제공하세요.
     3. 출력은 반드시 아래 JSON 형식을 지키세요:
     {
       "reply": "Teacher's message in ${mainLang}",
       "translation": "Translation in ${subLang}",
       "correction": "Target sentence for the user",
       "reason": "Grammar tip or encouragement in ${subLang}"
     }
  `;
};