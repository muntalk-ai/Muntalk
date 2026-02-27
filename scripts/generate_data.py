import os
import json
import asyncio
import aiohttp
from dotenv import load_dotenv # 👈 추가

# ==========================================
# 1. 설정 및 환경 변수 로드
# ==========================================
# 프로젝트 루트에 있는 .env.local 파일을 읽어옵니다.
# scripts 폴더 안에 있으므로 부모 폴더(..)를 지정합니다.
load_dotenv(dotenv_path="../.env.local") 

# .env.local 파일에 작성된 변수명을 그대로 가져옵니다.
# (예: NEXT_PUBLIC_GEMINI_API_KEY 또는 GEMINI_API_KEY)
GEMINI_API_KEY = os.getenv("NEXT_PUBLIC_GEMINI_API_KEY") 

if not GEMINI_API_KEY:
    print("❌ 에러: .env.local 파일에서 API 키를 찾을 수 없습니다.")
    exit()

MODEL_NAME = "gemini-2.5-flash" 
OUTPUT_DIR = "../public/data"

# 사장님이 요청하신 50개 주요 언어 풀세트
LANGUAGES = [
    {'id': 'ko-KR', 'name': 'Korean'}, {'id': 'ja-JP', 'name': 'Japanese'}, {'id': 'zh-CN', 'name': 'Chinese'},
    {'id': 'es-ES', 'name': 'Spanish'}, {'id': 'fr-FR', 'name': 'French'}, {'id': 'de-DE', 'name': 'German'},
    {'id': 'it-IT', 'name': 'Italian'}, {'id': 'pt-BR', 'name': 'Portuguese'}, {'id': 'ru-RU', 'name': 'Russian'},
    {'id': 'vi-VN', 'name': 'Vietnamese'}, {'id': 'th-TH', 'name': 'Thai'}, {'id': 'id-ID', 'name': 'Indonesian'},
    {'id': 'ar-SA', 'name': 'Arabic'}, {'id': 'hi-IN', 'name': 'Hindi'}, {'id': 'tr-TR', 'name': 'Turkish'},
    {'id': 'nl-NL', 'name': 'Dutch'}, {'id': 'pl-PL', 'name': 'Polish'}, {'id': 'sv-SE', 'name': 'Swedish'},
    {'id': 'da-DK', 'name': 'Danish'}, {'id': 'fi-FI', 'name': 'Finnish'}, {'id': 'no-NO', 'name': 'Norwegian'},
    {'id': 'cs-CZ', 'name': 'Czech'}, {'id': 'hu-HU', 'name': 'Hungarian'}, {'id': 'ro-RO', 'name': 'Romanian'},
    {'id': 'el-GR', 'name': 'Greek'}, {'id': 'he-IL', 'name': 'Hebrew'}, {'id': 'ms-MY', 'name': 'Malay'},
    {'id': 'ph-PH', 'name': 'Filipino'}, {'id': 'uk-UA', 'name': 'Ukrainian'}, {'id': 'bg-BG', 'name': 'Bulgarian'},
    {'id': 'hr-HR', 'name': 'Croatian'}, {'id': 'sk-SK', 'name': 'Slovak'}, {'id': 'sl-SI', 'name': 'Slovenian'},
    {'id': 'et-EE', 'name': 'Estonian'}, {'id': 'lv-LV', 'name': 'Latvian'}, {'id': 'lt-LT', 'name': 'Lithuanian'},
    {'id': 'sr-RS', 'name': 'Serbian'}, {'id': 'kk-KZ', 'name': 'Kazakh'}, {'id': 'uz-UZ', 'name': 'Uzbek'},
    {'id': 'az-AZ', 'name': 'Azerbaijani'}, {'id': 'ka-GE', 'name': 'Georgian'}, {'id': 'hy-AM', 'name': 'Armenian'},
    {'id': 'mn-MN', 'name': 'Mongolian'}, {'id': 'bn-BD', 'name': 'Bengali'}, {'id': 'pa-IN', 'name': 'Punjabi'},
    {'id': 'ta-IN', 'name': 'Tamil'}, {'id': 'te-IN', 'name': 'Telugu'}, {'id': 'kn-IN', 'name': 'Kannada'},
    {'id': 'ml-IN', 'name': 'Malayalam'}, {'id': 'mr-IN', 'name': 'Marathi'}
]

WORDS_TO_GENERATE = ["Go", "Eat", "Study", "Run", "Beautiful"] 

# ==========================================
# 공통 API 호출 함수 (안전성 강화)
# ==========================================
async def call_gemini_api(session, prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"} # JSON 출력을 강제함
    }
    
    async with session.post(url, json=payload) as resp:
        res_data = await resp.json()
        
        # 에러 체크 로직 추가
        if 'candidates' not in res_data:
            print(f"❌ API 에러 발생: {res_data.get('error', {}).get('message', 'Unknown Error')}")
            return None
            
        raw_text = res_data['candidates'][0]['content']['parts'][0]['text']
        return json.loads(raw_text.strip().replace('```json', '').replace('```', ''))

# ==========================================
# Step 1: 영어 마스터 생성
# ==========================================
async def generate_english_master(session, word):
    prompt = f"""Create a master English dataset for the word: "{word}". 
    Output JSON format: {{"word": "{word}", "sentences": ["s1", "s2", "s3", "s4", "s5"]}}"""
    return await call_gemini_api(session, prompt)

# ==========================================
# Step 2: 언어별 번역 및 저장
# ==========================================
async def translate_to_language(session, en_master, target_lang):
    if not en_master: return False
    
    lang_id = target_lang['id']
    lang_name = target_lang['name']
    
    prompt = f"""Translate these English sentences into {lang_name}: {en_master['sentences']}
    Return ONLY JSON: {{"reply": "Original English", "translation": "Translated in {lang_name}", "reason": "Grammar tip"}}"""
    
    final_data = await call_gemini_api(session, prompt)
    
    if final_data:
        path = f"{OUTPUT_DIR}/{lang_id}"
        os.makedirs(path, exist_ok=True)
        with open(f"{path}/{en_master['word']}.json", "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)
        return True
    return False

# ==========================================
# 메인 실행부
# ==========================================
async def main():
    async with aiohttp.ClientSession() as session:
        for word in WORDS_TO_GENERATE:
            print(f"🚀 작업 시작: {word}")
            en_master = await generate_english_master(session, word)
            
            if en_master:
                tasks = [translate_to_language(session, en_master, lang) for lang in LANGUAGES]
                results = await asyncio.gather(*tasks)
                print(f"✅ 완료: {word} ({sum(results)}개 언어 성공)")
            
            await asyncio.sleep(1) # 과도한 요청 방지

if __name__ == "__main__":
    asyncio.run(main())