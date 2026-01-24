import json
from pathlib import Path

path = Path(r'd:\work\studywithme\posts\all-posts.json')
data = json.loads(path.read_text(encoding='utf-8'))

entry = {
    "id": 1,
    "title": "공부 시작하기 - 목표와 흐름 만들기",
    "category": "계획",
    "readTime": "6",
    "image": "/assets/images/mental-health.png",
    "excerpt": "처음엔 방향을 잡는 것이 중요하다. 목표-계획-실행의 기본 구조를 만든다.",
    "title_en": "Starting Study the Right Way - Set Goals and Build Momentum",
    "excerpt_en": "Start with goals, a simple plan, and a small win to build momentum.",
    "category_en": "Planning",
    "content_en": """<div class='prose prose-invert max-w-none'>
  <h3 class='text-xl font-bold text-primary mb-4'>Introduction: Start With Direction</h3>
  <p class='text-slate-300 mb-6'>Studying without a clear direction wastes energy. A simple goal and a plan make the first week easier.</p>

  <h3 class='text-xl font-bold text-primary mb-4 mt-8'>Key Point 1: Define the Goal</h3>
  <ul class='list-disc list-inside text-slate-300 space-y-2 mb-6'>
    <li><strong class='text-white'>Outcome:</strong> exam date, score, or project deadline</li>
    <li><strong class='text-white'>Scope:</strong> chapters, topics, or skills</li>
    <li><strong class='text-white'>Time:</strong> how many hours you can realistically study each week</li>
  </ul>

  <h3 class='text-xl font-bold text-primary mb-4 mt-8'>Key Point 2: Build a Small Win</h3>
  <p class='text-slate-300 mb-6'>Choose one easy task you can finish today. Momentum starts with completion.</p>

  <h3 class='text-xl font-bold text-primary mb-4 mt-8'>Tip</h3>
  <p class='text-slate-300'>Keep the first plan simple. You can refine it after three days.</p>
</div>""",
    "content": """<div class=\"prose prose-invert max-w-none\">
  <h3 class=\"text-xl font-bold text-primary mb-4\">들어가며: 방향부터 정하자</h3>
  <p class=\"text-slate-300 mb-6\">방향 없이 공부하면 에너지만 새고 진도가 느려진다. 간단한 목표와 계획이 첫 주를 훨씬 쉽게 만든다.</p>

  <h3 class=\"text-xl font-bold text-primary mb-4 mt-8\">핵심 1: 목표 정의</h3>
  <ul class=\"list-disc list-inside text-slate-300 space-y-2 mb-6\">
    <li><strong class=\"text-white\">결과:</strong> 시험일, 목표 점수, 과제 마감</li>
    <li><strong class=\"text-white\">범위:</strong> 단원, 주제, 필요한 기술</li>
    <li><strong class=\"text-white\">시간:</strong> 주당 실제로 가능한 공부 시간</li>
  </ul>

  <h3 class=\"text-xl font-bold text-primary mb-4 mt-8\">핵심 2: 작은 성공 만들기</h3>
  <p class=\"text-slate-300 mb-6\">오늘 바로 끝낼 수 있는 쉬운 과제를 하나 고른다. 모멘텀은 완수에서 시작된다.</p>

  <h3 class=\"text-xl font-bold text-primary mb-4 mt-8\">팁</h3>
  <p class=\"text-slate-300\">첫 계획은 단순하게. 3일 뒤에 수정해도 늦지 않다.</p>
</div>""",
}

found = False
for item in data:
    if item.get("id") == 1:
        item.update(entry)
        found = True
        break

if not found:
    data.insert(0, entry)

path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
