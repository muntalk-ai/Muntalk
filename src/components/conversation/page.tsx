'use client';
import ConversationBasic from './Basic';
import ConversationIntermediate from './Intermediate';
import ConversationAdvanced from './Advanced';

export default function Conversation(props: any) { 
    const { selectedLevel } = props; // props에서 레벨 정보를 가져옵니다.

    if (selectedLevel === "Basic") {
        return <ConversationBasic {...props} />;
    } else if (selectedLevel === "Intermediate") {
        return <ConversationIntermediate {...props} />;
    } else {
        return <ConversationAdvanced {...props} />;
    }
}