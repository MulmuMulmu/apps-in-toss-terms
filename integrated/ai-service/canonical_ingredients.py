from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
import re
from typing import Any, Iterable


CANONICAL_CATEGORY_BY_NAME = {
    "계란": "정육/계란",
    "고춧가루": "소스/조미료/오일",
    "고추": "채소/과일",
    "대파": "채소/과일",
    "마늘": "채소/과일",
    "김치": "가공식품",
    "김": "해산물",
    "가쓰오부시": "해산물",
    "간장": "소스/조미료/오일",
    "깨": "소스/조미료/오일",
    "고사리": "채소/과일",
    "곤약": "가공식품",
    "된장": "소스/조미료/오일",
    "대구": "해산물",
    "도라지": "채소/과일",
    "동태": "해산물",
    "멸치": "해산물",
    "무": "채소/과일",
    "모짜렐라 치즈": "유제품",
    "바지락": "해산물",
    "버터": "유제품",
    "브로콜리": "채소/과일",
    "북어": "해산물",
    "다시마": "해산물",
    "당면": "쌀/면/빵",
    "파마산 치즈": "유제품",
    "리코타 치즈": "유제품",
    "마스카포네 치즈": "유제품",
    "꼬막": "해산물",
    "꽃게": "해산물",
    "두부": "가공식품",
    "들깨": "소스/조미료/오일",
    "명태": "해산물",
    "삼겹살": "정육/계란",
    "새우": "해산물",
    "생강": "채소/과일",
    "숙주": "채소/과일",
    "스파게티": "쌀/면/빵",
    "시금치": "채소/과일",
    "소고기": "정육/계란",
    "오징어": "해산물",
    "옥수수": "쌀/면/빵",
    "올리브유": "소스/조미료/오일",
    "레몬즙": "소스/조미료/오일",
    "매실청": "소스/조미료/오일",
    "맛살": "해산물",
    "미역": "해산물",
    "소시지": "가공식품",
    "전분": "쌀/면/빵",
    "조랭이떡": "쌀/면/빵",
    "조개살": "해산물",
    "주꾸미": "해산물",
    "참치": "해산물",
    "케찹": "소스/조미료/오일",
    "크림치즈": "유제품",
    "래디시": "채소/과일",
    "피망": "채소/과일",
    "파프리카": "채소/과일",
    "표고버섯": "채소/과일",
    "새송이버섯": "채소/과일",
    "느타리버섯": "채소/과일",
    "양송이버섯": "채소/과일",
    "팽이버섯": "채소/과일",
    "떡국떡": "쌀/면/빵",
    "떡볶이떡": "쌀/면/빵",
    "양파": "채소/과일",
    "우유": "유제품",
    "요거트": "유제품",
    "돼지고기": "정육/계란",
    "닭고기": "정육/계란",
    "후추": "소스/조미료/오일",
    "홍합": "해산물",
    "황태": "해산물",
    "굴소스": "소스/조미료/오일",
    "햄": "가공식품",
    "피클": "가공식품",
    "어묵": "가공식품",
}

DIRECT_ALIASES = {
    "달걀": "계란",
    "흰우유": "우유",
    "저지방우유": "우유",
    "다진마늘": "마늘",
    "다진 마늘": "마늘",
    "다진대파": "대파",
    "다진 대파": "대파",
    "다진파": "대파",
    "다진 파": "대파",
    "쪽파": "대파",
    "파": "대파",
    "고추가루": "고춧가루",
    "굵은고춧가루": "고춧가루",
    "굵은 고춧가루": "고춧가루",
    "고운고춧가루": "고춧가루",
    "고운 고춧가루": "고춧가루",
    "매운고춧가루": "고춧가루",
    "대패삼겹살": "삼겹살",
    "통삼겹살": "삼겹살",
    "돼지고기 삼겹살": "삼겹살",
    "돼기고기": "돼지고기",
    "배추김치": "김치",
    "신김치": "김치",
    "쇠고기": "소고기",
    "가쯔오부시": "가쓰오부시",
    "가츠오부시": "가쓰오부시",
    "가쓰오브시": "가쓰오부시",
    "가다랑어포": "가쓰오부시",
    "가다랑이포": "가쓰오부시",
    "김밥용김": "김",
    "김밥용 김": "김",
    "구운김": "김",
    "구운 김": "김",
    "떡국 떡": "떡국떡",
    "떡볶이 떡": "떡볶이떡",
    "검정깨": "깨",
    "검은깨": "깨",
    "구운깨": "깨",
    "구운 깨": "깨",
    "플레인요구르트": "요거트",
    "플레인 요구르트": "요거트",
    "플레인요거트": "요거트",
    "플레인 요거트": "요거트",
    "그릭요거트": "요거트",
    "그릭 요거트": "요거트",
    "요구르트": "요거트",
    "모짜렐라": "모짜렐라 치즈",
    "모짜렐라치즈": "모짜렐라 치즈",
    "생모짜렐라치즈": "모짜렐라 치즈",
    "파마산치즈": "파마산 치즈",
    "파마산가루": "파마산 치즈",
    "파마산치즈가루": "파마산 치즈",
    "파마산치즈치즈": "파마산 치즈",
    "올리브오일": "올리브유",
    "올리브 오일": "올리브유",
    "올리 브유": "올리브유",
    "저염간장": "간장",
    "저염 간장": "간장",
    "진간장": "간장",
    "양조간장": "간장",
    "맛간장": "간장",
    "미소된장": "된장",
    "일본된장": "된장",
    "일본 된장": "된장",
    "왜된장": "된장",
    "일식된장": "된장",
    "저염된장": "된장",
    "저염 된장": "된장",
    "토마토케첩": "케찹",
    "토마토 케첩": "케찹",
    "케첩": "케찹",
    "후춧가루": "후추",
    "후추가루": "후추",
    "흑후추": "후추",
    "백후추": "후추",
    "흰후추": "후추",
    "흰 후추": "후추",
    "굵은후춧가루": "후추",
    "감자전분": "전분",
    "옥수수전분": "전분",
    "녹말가루": "전분",
    "녹말": "전분",
    "물녹말": "전분",
    "물전분": "전분",
    "전분가루": "전분",
    "다진생강": "생강",
    "다진 생강": "생강",
    "간생강": "생강",
    "간 생강": "생강",
    "깐생강": "생강",
    "생강가루": "생강",
    "생강 파우더": "생강",
    "생강즙": "생강",
    "통생강": "생강",
    "표고": "표고버섯",
    "건표고버섯": "표고버섯",
    "건 표고버섯": "표고버섯",
    "마른표고버섯": "표고버섯",
    "마른 표고버섯": "표고버섯",
    "말린표고버섯": "표고버섯",
    "말린 표고버섯": "표고버섯",
    "생표고버섯": "표고버섯",
    "생 표고버섯": "표고버섯",
    "불린표고버섯": "표고버섯",
    "불린 표고버섯": "표고버섯",
    "새송이": "새송이버섯",
    "새송이 버섯": "새송이버섯",
    "미니새송이": "새송이버섯",
    "미니새송이버섯": "새송이버섯",
    "느타리": "느타리버섯",
    "애느타리버섯": "느타리버섯",
    "참느타리버섯": "느타리버섯",
    "양송이": "양송이버섯",
    "양송이 버섯": "양송이버섯",
    "팽이": "팽이버섯",
    "황금팽이버섯": "팽이버섯",
    "닭": "닭고기",
    "닭 가슴살": "닭고기",
    "닭가슴살": "닭고기",
    "닭다리": "닭고기",
    "닭다리살": "닭고기",
    "닭다릿살": "닭고기",
    "닭안심": "닭고기",
    "닭안심살": "닭고기",
    "닭날개": "닭고기",
    "닭봉": "닭고기",
    "닭살": "닭고기",
    "오리고기": "오리고기",
    "훈제오리": "오리고기",
    "훈제 오리": "오리고기",
    "칵테일새우": "새우",
    "새우살": "새우",
    "새우 살": "새우",
    "냉동새우살": "새우",
    "냉동 새우살": "새우",
    "생새우": "새우",
    "자숙새우": "새우",
    "건새우": "새우",
    "마른새우": "새우",
    "마른 새우": "새우",
    "말린새우": "새우",
    "갑오징어": "오징어",
    "마른오징어": "오징어",
    "물오징어": "오징어",
    "통오징어": "오징어",
    "오징어채": "오징어",
    "대왕오징어채": "오징어",
    "국물용멸치": "멸치",
    "국물용 멸치": "멸치",
    "다시멸치": "멸치",
    "국멸치": "멸치",
    "건멸치": "멸치",
    "육수용멸치": "멸치",
    "육수용 멸치": "멸치",
    "잔멸치": "멸치",
    "브로컬리": "브로콜리",
    "시금치나물": "시금치",
    "고사리나물": "고사리",
    "도라지나물": "도라지",
    "숙주나물": "숙주",
    "청피망": "피망",
    "청 피망": "피망",
    "홍피망": "피망",
    "홍 피망": "피망",
    "붉은피망": "피망",
    "파랑피망": "피망",
    "노란파프리카": "파프리카",
    "노란 파프리카": "파프리카",
    "노랑파프리카": "파프리카",
    "노랑 파프리카": "파프리카",
    "빨간파프리카": "파프리카",
    "빨간 파프리카": "파프리카",
    "빨강파프리카": "파프리카",
    "빨강 파프리카": "파프리카",
    "붉은파프리카": "파프리카",
    "붉은 파프리카": "파프리카",
    "주황파프리카": "파프리카",
    "주황 파프리카": "파프리카",
    "미니파프리카": "파프리카",
    "꼬마파프리카": "파프리카",
    "황태채": "황태",
    "황태포": "황태",
    "황태머리": "황태",
    "황태 머리": "황태",
    "구운황태": "황태",
    "구운 황태": "황태",
    "북어채": "북어",
    "북어포": "북어",
    "통북어": "북어",
    "동태살": "동태",
    "동태포": "동태",
    "대구살": "대구",
    "생대구": "대구",
    "홍합살": "홍합",
    "바지락살": "바지락",
    "무염버터": "버터",
    "무염 버터": "버터",
    "녹인버터": "버터",
    "녹인 버터": "버터",
    "발효버터": "버터",
    "발효 버터": "버터",
    "스파게티면": "스파게티",
    "삶은스파게티": "스파게티",
    "삶은 스파게티": "스파게티",
    "조랭이 떡": "조랭이떡",
    "캔옥수수": "옥수수",
    "캔 옥수수": "옥수수",
    "옥수수콘": "옥수수",
    "옥수수통조림": "옥수수",
    "굴 소스": "굴소스",
    "리코타치즈": "리코타 치즈",
    "마스카르포네치즈": "마스카포네 치즈",
    "마스카포네치즈": "마스카포네 치즈",
    "모차렐라치즈": "모짜렐라 치즈",
    "모차렐라 치즈": "모짜렐라 치즈",
    "슈레드모차렐라치즈": "모짜렐라 치즈",
    "슈레드 모차렐라치즈": "모짜렐라 치즈",
    "래디쉬": "래디시",
    "레디쉬": "래디시",
    "레몬쥬스": "레몬즙",
    "레몬주스": "레몬즙",
    "레몬 주스": "레몬즙",
    "라임즙": "라임즙",
    "매실액": "매실청",
    "매실액기스": "매실청",
    "매실엑기스": "매실청",
    "매실원액": "매실청",
    "매실농축액": "매실청",
    "불린당면": "당면",
    "불린 당면": "당면",
    "당면불린것": "당면",
    "조갯살": "조개살",
    "조개 살": "조개살",
    "쭈꾸미": "주꾸미",
    "마른미역": "미역",
    "마른 미역": "미역",
    "말린미역": "미역",
    "말린 미역": "미역",
    "불린미역": "미역",
    "불린 미역": "미역",
    "건조미역": "미역",
    "건다시마": "다시마",
    "건조다시마": "다시마",
    "마른다시마": "다시마",
    "마른 다시마": "다시마",
    "다시마국물": "다시마",
    "다시마 국물": "다시마",
    "다시마육수": "다시마",
    "다시마 육수": "다시마",
    "다시마우린물": "다시마",
    "다시마 우린 물": "다시마",
    "게맛살": "맛살",
    "크래미": "맛살",
    "부침두부": "두부",
    "단단한두부": "두부",
    "단단한 두부": "두부",
    "으깬두부": "두부",
    "으깬 두부": "두부",
    "생식용두부": "두부",
    "생식용두부 1모": "두부",
    "비엔나소시지": "소시지",
    "프랑크소시지": "소시지",
    "초리조소시지": "소시지",
    "초리조 소시지": "소시지",
    "슬라이스햄": "햄",
    "슬라이스 햄": "햄",
    "통조림햄": "햄",
    "통조림 햄": "햄",
    "햄다진것": "햄",
    "오이피클": "피클",
    "다진오이피클": "피클",
    "다진 오이피클": "피클",
    "고추피클": "피클",
    "할라피뇨피클": "피클",
    "할라피뇨 피클": "피클",
    "실곤약": "곤약",
    "곤약면": "곤약",
    "곤약국수": "곤약",
    "판곤약": "곤약",
    "냉동곤약": "곤약",
    "냉동 곤약": "곤약",
    "찰어묵": "어묵",
    "찐어묵": "어묵",
    "찐 어묵": "어묵",
    "장식용어묵": "어묵",
    "장식용 어묵": "어묵",
    "캔참치": "참치",
    "캔 참치": "참치",
    "참치통조림": "참치",
    "통조림참치": "참치",
    "통조림 참치": "참치",
    "참치살": "참치",
    "명태포": "명태",
    "꼬막살": "꼬막",
    "데친꼬막살": "꼬막",
    "데친 꼬막살": "꼬막",
    "꽃게살": "꽃게",
    "꽃게육수": "꽃게",
    "김가루": "김",
    "깨가루": "깨",
    "들깨가루": "들깨",
    "들깻가루": "들깨",
    "거피들깨가루": "들깨",
    "깐들깨가루": "들깨",
}

LABEL_PREFIX_RE = re.compile(
    r"^(?:[-·•●]\s*)?(?:필수\s*)?(?:주재료|부재료|재료|양념|양념장|소스|드레싱|육수|국물|장식|고명|토핑|속재료|반죽|마리네이션|곁들임(?:채소)?|타르타르\s*소스|소|완자)\s*[>:：:]",
)
BRACKET_PREFIX_RE = re.compile(r"^\[[^\]]+\]\s*")
PAREN_CONTENT_RE = re.compile(r"\([^)]*\)")
AMOUNT_RE = re.compile(
    r"\d+(?:[.,]\d+)?\s*(?:g|kg|ml|mL|L|cc|큰술|작은술|숟가락|스푼|컵|개|대|줄기|쪽|마리|장|모|봉지|팩|캔|포기|알|큰술반|작은술반)"
    r"|[½¼¾⅓⅔]\s*(?:개|컵|큰술|작은술|대|쪽)?"
    r"|\d+\s*(?:/|~|과)\s*\d+\s*(?:개|컵|큰술|작은술|대|쪽)?",
    re.IGNORECASE,
)
TRAILING_DESCRIPTORS_RE = re.compile(r"(?:약간|조금|적당량|소량|적량|톡톡|채썬것|채친것|다진것|간것|갈은것)$")
SPACE_RE = re.compile(r"\s+")

PHRASE_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"저지방\s*우유|흰\s*우유|우유"), "우유"),
    (re.compile(r"달걀|계란"), "계란"),
    (re.compile(r"고추\s*가루|고춧\s*가루"), "고춧가루"),
    (re.compile(r"대패\s*삼겹살|통\s*삼겹살|삼겹살"), "삼겹살"),
    (re.compile(r"쇠고기|소고기|비프"), "소고기"),
    (re.compile(r"돼지고기|돈육"), "돼지고기"),
    (re.compile(r"다진\s*마늘|깐\s*마늘|마늘"), "마늘"),
    (re.compile(r"다진\s*양파|깐\s*양파|채\s*썬\s*양파|양파"), "양파"),
    (re.compile(r"다진\s*대파|대파|쪽파|실파|가는파"), "대파"),
    (re.compile(r"배추\s*김치|신\s*김치|김치"), "김치"),
    (re.compile(r"가쯔오\s*부시|가츠오\s*부시|가쓰오\s*브시|가쓰오\s*부시|가다랑[어이]\s*포"), "가쓰오부시"),
    (re.compile(r"김밥용\s*김|구운\s*김"), "김"),
    (re.compile(r"떡국\s*떡"), "떡국떡"),
    (re.compile(r"떡볶이\s*떡"), "떡볶이떡"),
    (re.compile(r"검정\s*깨|검은\s*깨|구운\s*깨"), "깨"),
    (re.compile(r"플레인\s*요구르트|플레인\s*요거트|그릭\s*요거트|요구르트|요거트"), "요거트"),
    (re.compile(r"모짜렐라\s*치즈|생\s*모짜렐라\s*치즈|모짜렐라"), "모짜렐라 치즈"),
    (re.compile(r"파마산\s*치즈\s*가루|파마산\s*치즈|파마산\s*가루"), "파마산 치즈"),
    (re.compile(r"올리\s*브\s*오일|올리\s*브유"), "올리브유"),
    (re.compile(r"저염\s*간장|진\s*간장|양조\s*간장|맛\s*간장"), "간장"),
    (re.compile(r"미소\s*된장|일본\s*된장|왜\s*된장|일식\s*된장|저염\s*된장"), "된장"),
    (re.compile(r"토마토\s*케첩|케첩|케찹"), "케찹"),
    (re.compile(r"굵은\s*후춧가루|후춧가루|후추\s*가루|흑\s*후추|백\s*후추|흰\s*후추|후추"), "후추"),
    (re.compile(r"감자\s*전분|옥수수\s*전분|녹말\s*가루|물\s*녹말|물\s*전분|전분\s*가루|녹말|전분"), "전분"),
    (re.compile(r"다진\s*생강|간\s*생강|깐\s*생강|생강\s*가루|생강\s*파우더|생강\s*즙|통\s*생강|생강"), "생강"),
    (re.compile(r"건\s*표고버섯|마른\s*표고버섯|말린\s*표고버섯|생\s*표고버섯|불린\s*표고버섯|표고버섯|표고"), "표고버섯"),
    (re.compile(r"미니\s*새송이버섯|미니\s*새송이|새송이\s*버섯|새송이버섯|새송이"), "새송이버섯"),
    (re.compile(r"애\s*느타리버섯|참\s*느타리버섯|느타리버섯|느타리"), "느타리버섯"),
    (re.compile(r"양송이\s*버섯|양송이버섯|양송이"), "양송이버섯"),
    (re.compile(r"황금\s*팽이버섯|팽이버섯|팽이"), "팽이버섯"),
    (re.compile(r"닭\s*가슴살|닭다리살|닭다릿살|닭안심살|닭안심|닭날개|닭봉|닭살|닭고기|닭"), "닭고기"),
    (re.compile(r"훈제\s*오리|오리고기"), "오리고기"),
    (re.compile(r"칵테일\s*새우|냉동\s*새우살|새우\s*살|새우살|생\s*새우|자숙\s*새우|건\s*새우|마른\s*새우|말린\s*새우|새우"), "새우"),
    (re.compile(r"갑\s*오징어|마른\s*오징어|물\s*오징어|통\s*오징어|대왕\s*오징어채|오징어채|오징어"), "오징어"),
    (re.compile(r"국물용\s*멸치|다시\s*멸치|국\s*멸치|건\s*멸치|육수용\s*멸치|잔\s*멸치|멸치"), "멸치"),
    (re.compile(r"브로컬리|브로콜리"), "브로콜리"),
    (re.compile(r"시금치\s*나물|시금치"), "시금치"),
    (re.compile(r"고사리\s*나물|고사리"), "고사리"),
    (re.compile(r"도라지\s*나물|도라지"), "도라지"),
    (re.compile(r"숙주\s*나물|숙주"), "숙주"),
    (re.compile(r"다진\s*(?:청|홍)?\s*피망|청\s*피망|홍\s*피망|붉은\s*피망|파랑\s*피망|피망"), "피망"),
    (re.compile(r"(?:노란|노랑|빨간|빨강|붉은|주황|미니|꼬마)?\s*파프리카"), "파프리카"),
    (re.compile(r"구운\s*황태|황태\s*머리|황태채|황태포|황태"), "황태"),
    (re.compile(r"북어채|북어포|통\s*북어|북어"), "북어"),
    (re.compile(r"동태살|동태포|동태"), "동태"),
    (re.compile(r"생\s*대구|대구살|대구"), "대구"),
    (re.compile(r"홍합살|홍합"), "홍합"),
    (re.compile(r"바지락살|바지락"), "바지락"),
    (re.compile(r"무염\s*버터|녹인\s*버터|발효\s*버터|버터"), "버터"),
    (re.compile(r"스파게티\s*면|삶은\s*스파게티|스파게티"), "스파게티"),
    (re.compile(r"조랭이\s*떡"), "조랭이떡"),
    (re.compile(r"캔\s*옥수수|옥수수콘|옥수수\s*통조림|옥수수"), "옥수수"),
    (re.compile(r"굴\s*소스"), "굴소스"),
    (re.compile(r"리코타\s*치즈"), "리코타 치즈"),
    (re.compile(r"마스카르포네\s*치즈|마스카포네\s*치즈"), "마스카포네 치즈"),
    (re.compile(r"슈레드\s*모차렐라\s*치즈|모차렐라\s*치즈"), "모짜렐라 치즈"),
    (re.compile(r"래디쉬|레디쉬|래디시"), "래디시"),
    (re.compile(r"레몬\s*쥬스|레몬\s*주스|레몬즙"), "레몬즙"),
    (re.compile(r"매실\s*액기스|매실\s*엑기스|매실\s*원액|매실\s*농축액|매실\s*액|매실청"), "매실청"),
    (re.compile(r"불린\s*당면|당면\s*불린것|당면"), "당면"),
    (re.compile(r"조갯살|조개\s*살"), "조개살"),
    (re.compile(r"쭈꾸미|주꾸미"), "주꾸미"),
    (re.compile(r"건조\s*미역|마른\s*미역|말린\s*미역|불린\s*미역|미역"), "미역"),
    (re.compile(r"건조\s*다시마|건\s*다시마|마른\s*다시마|다시마\s*국물|다시마\s*육수|다시마\s*우린\s*물|다시마"), "다시마"),
    (re.compile(r"게\s*맛살|크래미|맛살"), "맛살"),
    (re.compile(r"부침\s*두부|단단한\s*두부|으깬\s*두부|생식용\s*두부"), "두부"),
    (re.compile(r"비엔나\s*소시지|프랑크\s*소시지|초리조\s*소시지|소시지"), "소시지"),
    (re.compile(r"슬라이스\s*햄|통조림\s*햄|햄\s*다진것|햄"), "햄"),
    (re.compile(r"다진\s*오이피클|오이\s*피클|고추\s*피클|할라피뇨\s*피클|피클"), "피클"),
    (re.compile(r"냉동\s*곤약|실\s*곤약|곤약\s*면|곤약\s*국수|판\s*곤약|곤약"), "곤약"),
    (re.compile(r"장식용\s*어묵|찐\s*어묵|찰\s*어묵|어묵"), "어묵"),
    (re.compile(r"캔\s*참치|통조림\s*참치|참치\s*통조림|참치살|참치"), "참치"),
    (re.compile(r"명태포|명태"), "명태"),
    (re.compile(r"데친\s*꼬막살|꼬막살|꼬막"), "꼬막"),
    (re.compile(r"꽃게살|꽃게\s*육수|꽃게"), "꽃게"),
    (re.compile(r"김\s*가루"), "김"),
    (re.compile(r"깨\s*가루"), "깨"),
    (re.compile(r"거피\s*들깨가루|깐\s*들깨가루|들깻가루|들깨\s*가루|들깨"), "들깨"),
]


@dataclass(frozen=True)
class CanonicalizationResult:
    ingredients: list[dict[str, Any]]
    recipe_ingredients: list[dict[str, Any]]
    ingredient_id_map: dict[str, str]
    aliases_by_canonical_name: dict[str, list[str]]


def canonicalize_ingredient_name(raw_name: str) -> str | None:
    text = _clean_recipe_ingredient_text(raw_name)
    if not text:
        return None

    compact = _compact(text)
    if compact in DIRECT_ALIASES:
        return DIRECT_ALIASES[compact]

    for pattern, canonical_name in PHRASE_RULES:
        if pattern.search(text) or pattern.search(compact):
            return canonical_name

    return text


def canonicalize_db_rows(
    ingredients: Iterable[dict[str, Any]],
    recipe_ingredients: Iterable[dict[str, Any]],
) -> CanonicalizationResult:
    original_rows = [dict(row) for row in ingredients]
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for row in original_rows:
        canonical_name = canonicalize_ingredient_name(str(row.get("ingredientName") or ""))
        if not canonical_name:
            continue
        groups[canonical_name].append(row)

    canonical_rows: list[dict[str, Any]] = []
    ingredient_id_map: dict[str, str] = {}
    aliases: dict[str, set[str]] = defaultdict(set)

    for canonical_name, rows in groups.items():
        canonical_row = _select_canonical_row(canonical_name, rows)
        canonical_id = str(canonical_row["ingredientId"])
        category = _select_category(canonical_name, rows)
        canonical_rows.append(
            {
                "ingredientId": canonical_id,
                "ingredientName": canonical_name,
                "category": category,
            }
        )
        for row in rows:
            original_id = str(row.get("ingredientId") or "")
            if original_id:
                ingredient_id_map[original_id] = canonical_id
            original_name = str(row.get("ingredientName") or "").strip()
            if original_name and original_name != canonical_name:
                aliases[canonical_name].add(original_name)

    remapped_recipe_ingredients: list[dict[str, Any]] = []
    seen_recipe_edges: set[tuple[str, str, float, str]] = set()
    for row in recipe_ingredients:
        copied = dict(row)
        original_id = str(copied.get("ingredientId") or "")
        mapped_id = ingredient_id_map.get(original_id)
        if not mapped_id:
            continue
        copied["ingredientId"] = mapped_id
        edge_key = (
            str(copied.get("recipeId") or ""),
            mapped_id,
            float(copied.get("amount") or 0.0),
            str(copied.get("unit") or ""),
        )
        if edge_key in seen_recipe_edges:
            continue
        seen_recipe_edges.add(edge_key)
        remapped_recipe_ingredients.append(copied)

    return CanonicalizationResult(
        ingredients=sorted(canonical_rows, key=lambda row: str(row["ingredientName"])),
        recipe_ingredients=remapped_recipe_ingredients,
        ingredient_id_map=ingredient_id_map,
        aliases_by_canonical_name={
            name: sorted(values)
            for name, values in sorted(aliases.items())
        },
    )


def _clean_recipe_ingredient_text(raw_name: str) -> str:
    text = str(raw_name or "").strip()
    text = BRACKET_PREFIX_RE.sub("", text).strip()
    previous = None
    while previous != text:
        previous = text
        text = LABEL_PREFIX_RE.sub("", text).strip()
    text = PAREN_CONTENT_RE.sub("", text)
    text = text.replace("½", " ½").replace("¼", " ¼").replace("¾", " ¾")
    text = AMOUNT_RE.sub("", text)
    text = re.sub(r"[<>]", " ", text)
    text = re.sub(r"^[\-·•●]+", "", text).strip()
    text = TRAILING_DESCRIPTORS_RE.sub("", text).strip()
    text = SPACE_RE.sub(" ", text).strip(" .,:：-/")
    return text


def _compact(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]", "", value or "").lower()


def _select_canonical_row(canonical_name: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    for row in rows:
        if str(row.get("ingredientName") or "").strip() == canonical_name:
            return row
    return rows[0]


def _select_category(canonical_name: str, rows: list[dict[str, Any]]) -> str:
    if canonical_name in CANONICAL_CATEGORY_BY_NAME:
        return CANONICAL_CATEGORY_BY_NAME[canonical_name]
    counter = Counter(str(row.get("category") or "기타") for row in rows)
    if not counter:
        return "기타"
    return counter.most_common(1)[0][0]
