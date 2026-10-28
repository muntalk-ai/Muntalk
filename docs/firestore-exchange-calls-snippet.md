# Firestore 규칙 스니펫 — MunTalk Exchange 음성통화 (`exchange_calls`)

> ⚠️ **이 규칙을 게시하기 전에는 Preview에서 통화 시그널링이 권한 거부
> (`permission-denied`)로 막힙니다.** 발신 버튼을 눌러도 `exchange_calls`
> 문서가 생성되지 않고, 수신 측에도 ringing 알림이 뜨지 않습니다.
> 콘솔에 아래 규칙을 게시한 뒤에야 통화가 동작합니다.

## 이 파일을 건드리지 말 것

- 레포 루트의 `firestore.rules` 파일은 **절대 수정하지 말 것**. 콘솔에 게시된
  실규칙과 동기화되어 있지 않아, 레포 파일을 게시하면 콘솔 규칙을
  덮어씌울 위험이 있습니다.
- 이 스니펫은 Firebase 콘솔 → Firestore Database → Rules 탭에 직접
  붙여넣는 용도입니다.

## 삽입 위치

콘솔 규칙 파일에서 **`exchange_profiles` 블록 바로 뒤**에 아래 블록 전체를
삽입합니다. (`exchange_profiles` 블록이 보이지 않으면, `users` 블록 등
다른 최상위 `match` 블록 뒤 — 단, `match /{document=**}` 같은 와일드카드
블록보다 앞쪽에 넣어야 합니다.)

## 전제

아래 스니펫은 콘솔 규칙에 이미 정의된 헬퍼를 재사용합니다
(기존 규칙의 패턴 그대로):

- `isSignedIn()`, `isOwner(uid)`, `isAdmin()`
- `onlyAllowedFields(allowed)` — 쓰기 요청이 허용된 필드만 포함하는지 검사

이 헬퍼들이 콘솔 규칙에 없을 경우, 스니펫을 삽입하기 전에 기존 규칙
상단의 헬퍼 정의를 먼저 확인하세요.

## 규칙 본문

```js
// ── Exchange 음성통화 시그널링 ─────────────────────────────────────
// 1:1 음성(WebRTC, 오디오 전용) 시그널링 문서. SDP(offer/answer)와
// 통화 상태만 저장하며, 실제 음성 데이터는 P2P로 흐르고 Firestore에
// 저장되지 않습니다.
match /exchange_calls/{callId} {
  // 읽기: 통화 멤버 본인, 또는 관리자
  allow read: if isAdmin()
    || (isSignedIn() && request.auth.uid in resource.data.members);

  // 생성: 발신자 본인만, members에 본인이 포함되어야 함.
  // 허용 필드: callerId, calleeId, members, status, createdAt
  allow create: if isSignedIn()
    && request.auth.uid == request.resource.data.callerId
    && request.auth.uid in request.resource.data.members
    && onlyAllowedFields(['callerId', 'calleeId', 'members', 'status', 'createdAt'])
    && request.resource.data.status == 'ringing';

  // 수정: 멤버 본인만. SDP/상태/종료 시각만 바꿀 수 있고,
  // callerId / calleeId / members는 변경 불가 (통화 가로채기 방지).
  allow update: if isAdmin()
    || (isSignedIn()
      && request.auth.uid in resource.data.members
      && onlyAllowedFields(['offer', 'answer', 'status', 'endedAt'])
      && request.resource.data.callerId == resource.data.callerId
      && request.resource.data.calleeId == resource.data.calleeId
      && request.resource.data.members == resource.data.members);

  // 삭제: 관리자만
  allow delete: if isAdmin();

  // ── ICE candidate 서브컬렉션 ──────────────────────────────────
  // 발신자 candidate는 발신자만, 수신자 candidate는 수신자만 쓸 수
  // 있고, 읽기는 통화 멤버만 가능합니다. 배열 union 대신 문서 추가
  // 방식이라 경합이 없습니다.
  match /callerCandidates/{candidateId} {
    allow read: if isAdmin()
      || (isSignedIn()
        && request.auth.uid in get(/databases/$(database)/documents/exchange_calls/$(callId)).data.members);
    allow create: if isSignedIn()
      && request.auth.uid == get(/databases/$(database)/documents/exchange_calls/$(callId)).data.callerId
      && onlyAllowedFields(['candidate', 'sdpMid', 'sdpMLineIndex', 'createdAt']);
    allow update, delete: if isAdmin();
  }

  match /calleeCandidates/{candidateId} {
    allow read: if isAdmin()
      || (isSignedIn()
        && request.auth.uid in get(/databases/$(database)/documents/exchange_calls/$(callId)).data.members);
    allow create: if isSignedIn()
      && request.auth.uid == get(/databases/$(database)/documents/exchange_calls/$(callId)).data.calleeId
      && onlyAllowedFields(['candidate', 'sdpMid', 'sdpMLineIndex', 'createdAt']);
    allow update, delete: if isAdmin();
  }
}
```

## 필드 정리

| 필드 | 설명 |
| --- | --- |
| `callerId` / `calleeId` | 발신자 / 수신자 uid |
| `members` | `[callerId, calleeId]` — 읽기 권한 판단 기준 |
| `status` | `ringing` → `active` → `ended`, 또는 `declined` |
| `offer` / `answer` | SDP 객체 그대로 (`{ type, sdp }`) |
| `createdAt` / `endedAt` | 서버 타임스탬프 |
| `callerCandidates` / `calleeCandidates` | ICE candidate 문서 서브컬렉션 |

## 게시 후 확인

1. 콘솔 Rules 탭에서 **Publish**를 누릅니다.
2. Preview에서 두 계정으로 로그인해 Discover → 파트너 카드 → **🎤 음성 통화**를
   누르면, 상대 화면에 수신 알림(받기/거절)이 떠야 합니다.
3. 여전히 `permission-denied`가 나오면, 삽입 위치가 와일드카드 블록 뒤가
   아닌지, 그리고 `exchange_profiles` 읽기 규칙도 게시되어 있는지 확인합니다.

## ⚠️ Jay 결정 필요 — 파트너 목록 조회 규칙 (이 PR의 통화 기능과 별개)

Discover 탭은 `exchange_profiles` 전체를 조회(`limit(50)`)해서 파트너를
나열합니다. 그런데 콘솔의 기존 `exchange_profiles` 읽기 규칙은
`allow read: if isOwner(uid) || isAdmin()` — 본인 문서만 읽을 수 있는
규칙입니다. 이 상태로는 **위 `exchange_calls` 스니펫만 게시해도
파트너 목록 조회가 `permission-denied`로 막히고**, Discover는 빈 상태나
오류 안내만 보여줍니다. 통화 자체의 시그널링은 스니펫만으로 되지만,
"파트너를 찾아서 전화를 거는" 흐름은 이 결정 없이는 동작하지 않습니다.

선택지 (Jay가 콘솔에서 직접 결정·게시할 것 — 이 파일은 규칙을 바꾸지 않음):

- **A안 — 로그인 유저에게 프로필 목록 읽기 허용 (교환 서비스의 정상 형태):**
  `exchange_profiles` 읽기 규칙을 `allow read: if isSignedIn();` 수준으로
  완화합니다. 닉네임·언어·레벨·관심사·bio가 로그인 유저에게 노출됩니다
  (실명·연락처는 프로필에 저장하지 않는 설계이므로 노출되지 않음).
- **B안 — 현행 owner-only 유지:** 파트너 목록은 비어 있고, 통화는
  상대 uid를 아는 경우에만(예: 기존 대화 상대) 시작할 수 있습니다.
  사실상 Discover 경유 통화는 동작하지 않습니다.

A안을 선택하면 `exchange_profiles` 블록의 `allow read` 줄만 교체하면 되고,
이 스니펫의 `exchange_calls` 규칙은 그대로 둡니다.
