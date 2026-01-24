import json
from pathlib import Path

path = Path(r'd:\work\studywithme\posts\all-posts.json')
data = json.loads(path.read_text(encoding='utf-8'))
update = {
    "title": "주간 공부 계획 완전 가이드 - 한 주 로드맵 만들기",
    "category": "계획",
    "excerpt": "주간 계획은 벼락치기를 막고 꾸준함을 만든다. 간단한 구조와 여백이 핵심이다.",
    "content": '''<div class="prose prose-invert max-w-none">
  <h3 class="text-xl font-bold text-primary mb-4">들어가며: 계획은 의도를 결과로 바꾼다</h3>
  <p class="text-slate-300 mb-6">주간 로드맵은 공부 시간을 일정하게 만들고 벼락치기를 줄여준다. 모든 시간을 채우는 것이 아니라 중요한 것을 먼저 정하는 게 목표다.</p>

  <h3 class="text-xl font-bold text-primary mb-4 mt-8">핵심 1: 3단계 계획</h3>
  <ul class="list-disc list-inside text-slate-300 space-y-2 mb-6">
    <li><strong class="text-white">장기 목표:</strong> 시험, 과제, 목표 점수</li>
    <li><strong class="text-white">주간 초점:</strong> 이번 주 단원과 문제 범위</li>
    <li><strong class="text-white">일일 계획:</strong> 우선순위 1~3개와 시간 블록</li>
  </ul>

  <h3 class="text-xl font-bold text-primary mb-4 mt-8">팁</h3>
  <p class="text-slate-300">가능한 시간의 70퍼센트만 계획하고 나머지는 여유로 남겨라.</p>
</div>''',
}

for item in data:
    if item.get("id") == 2:
        item.update(update)
        break
else:
    raise SystemExit("id 2 not found")

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
