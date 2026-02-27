import os
import json

# 데이터 폴더 경로
data_dir = './public/data'

def update_json_files():
    for root, dirs, files in os.walk(data_dir):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        print(f"Error reading {file_path}")
                        continue
                
                # 데이터 구조 업데이트
                if isinstance(data, list):
                    for item in data:
                        if 'translation' in item and 'translations' not in item:
                            # 💡 여기서 한국어(ko-KR)로 기본 설정합니다.
                            # 나중에 다른 언어 번역이 필요하면 이 부분을 더 확장해야 합니다.
                            item['translations'] = {
                                'ko-KR': item.pop('translation')
                            }
                
                # 파일 저장
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print(f"Updated: {file_path}")

if __name__ == '__main__':
    update_json_files()