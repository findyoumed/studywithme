import json
from pathlib import Path

path = Path(r'd:\work\studywithme\posts\all-posts.json')
data = json.loads(path.read_text(encoding='utf-8'))
update = {
    "title": "아침 공부 루틴 - 하루의 흐름을 잡기",
    "category": "습관",
    "excerpt": "아침 10분의 정리가 하루 공부의 방향을 결정한다.",
    "content": '''<div class="prose prose-invert max-w-none">
  <h3 class="text-xl font-bold text-primary mb-4">들어가며: 아침이 하루를 결정한다</h3>
  <p class="text-slate-300 mb-6">짧은 아침 루틴이 결정 피로를 줄이고 흐름을 만든다.</p>

  <h3 class="text-xl font-bold text-primary mb-4 mt-8">핵심 1: 아침 단계</h3>
  <ul class="list-disc list-inside text-slate-300 space-y-2 mb-6">
    <li><strong class="text-white">5분 계획:</strong> 오늘의 최우선 과제 선택</li>
    <li><strong class="text-white">쉬운 성공:</strong> 작은 과제로 워밍업</li>
    <li><strong class="text-white">25분 집중:</strong> 한 번의 깊은 블록</li>
  </ul>

  <h3 class="text-xl font-bold text-primary mb-4 mt-8">핵심 2: 호흡 리셋</h3>
  <p class="text-slate-300 mb-6">시작 전에 천천히 두 번 호흡하며 집중을 정돈하자.</p>

  <h3 class="text-xl font-bold text-primary mb-4 mt-8">팁</h3>
  <p class="text-slate-300">전날 밤에 준비물을 세팅해 마찰을 줄여라.</p>
</div>''',
}

for item in data:
    if item.get("id") == 23:
        item.update(update)
        break
else:
    raise SystemExit("id 23 not found")

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
