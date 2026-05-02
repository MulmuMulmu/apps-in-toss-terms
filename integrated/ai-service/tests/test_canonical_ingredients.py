from __future__ import annotations

from canonical_ingredients import canonicalize_ingredient_name, canonicalize_db_rows


def test_canonicalize_ingredient_name_removes_recipe_amounts_and_descriptors() -> None:
    assert canonicalize_ingredient_name("저지방우유") == "우유"
    assert canonicalize_ingredient_name("흰우유 1컵&1큰술") == "우유"
    assert canonicalize_ingredient_name("다진마늘 1큰술") == "마늘"
    assert canonicalize_ingredient_name("양념장 : 고춧가루") == "고춧가루"
    assert canonicalize_ingredient_name("달걀 1개") == "계란"
    assert canonicalize_ingredient_name("배추김치") == "김치"
    assert canonicalize_ingredient_name("돼기고기") == "돼지고기"


def test_canonicalize_ingredient_name_keeps_meaningful_specific_foods() -> None:
    assert canonicalize_ingredient_name("파프리카") == "파프리카"
    assert canonicalize_ingredient_name("대패삼겹살") == "삼겹살"
    assert canonicalize_ingredient_name("소고기 등심(스테이크용)") == "소고기"


def test_canonicalize_common_recipe_aliases_from_audit() -> None:
    assert canonicalize_ingredient_name("가쯔오부시") == "가쓰오부시"
    assert canonicalize_ingredient_name("가츠오부시") == "가쓰오부시"
    assert canonicalize_ingredient_name("가다랑어포") == "가쓰오부시"
    assert canonicalize_ingredient_name("김밥용 김") == "김"
    assert canonicalize_ingredient_name("구운김") == "김"
    assert canonicalize_ingredient_name("떡국 떡") == "떡국떡"
    assert canonicalize_ingredient_name("떡볶이 떡") == "떡볶이떡"
    assert canonicalize_ingredient_name("검정깨") == "깨"
    assert canonicalize_ingredient_name("검은깨 조금") == "깨"
    assert canonicalize_ingredient_name("플레인 요구르트") == "요거트"
    assert canonicalize_ingredient_name("그릭요거트") == "요거트"
    assert canonicalize_ingredient_name("모짜렐라치즈") == "모짜렐라 치즈"
    assert canonicalize_ingredient_name("파마산치즈가루") == "파마산 치즈"


def test_canonicalize_common_condiment_and_protein_aliases_from_audit() -> None:
    assert canonicalize_ingredient_name("올리브 오일") == "올리브유"
    assert canonicalize_ingredient_name("저염간장") == "간장"
    assert canonicalize_ingredient_name("진간장 2큰술") == "간장"
    assert canonicalize_ingredient_name("미소된장") == "된장"
    assert canonicalize_ingredient_name("토마토케첩") == "케찹"
    assert canonicalize_ingredient_name("후춧가루 약간") == "후추"
    assert canonicalize_ingredient_name("감자전분") == "전분"
    assert canonicalize_ingredient_name("다진생강") == "생강"
    assert canonicalize_ingredient_name("생 표고버섯") == "표고버섯"
    assert canonicalize_ingredient_name("새송이 버섯") == "새송이버섯"
    assert canonicalize_ingredient_name("닭 가슴살") == "닭고기"
    assert canonicalize_ingredient_name("닭다리살") == "닭고기"
    assert canonicalize_ingredient_name("칵테일새우") == "새우"
    assert canonicalize_ingredient_name("마른오징어") == "오징어"
    assert canonicalize_ingredient_name("국물용 멸치") == "멸치"


def test_canonicalize_third_pass_safe_aliases_from_audit() -> None:
    assert canonicalize_ingredient_name("브로컬리") == "브로콜리"
    assert canonicalize_ingredient_name("시금치나물") == "시금치"
    assert canonicalize_ingredient_name("고사리나물") == "고사리"
    assert canonicalize_ingredient_name("도라지나물") == "도라지"
    assert canonicalize_ingredient_name("숙주나물") == "숙주"
    assert canonicalize_ingredient_name("다진 청피망") == "피망"
    assert canonicalize_ingredient_name("홍 피망") == "피망"
    assert canonicalize_ingredient_name("노란 파프리카") == "파프리카"
    assert canonicalize_ingredient_name("빨강파프리카") == "파프리카"
    assert canonicalize_ingredient_name("황태채") == "황태"
    assert canonicalize_ingredient_name("북어포") == "북어"
    assert canonicalize_ingredient_name("동태살") == "동태"
    assert canonicalize_ingredient_name("대구살") == "대구"
    assert canonicalize_ingredient_name("홍합살") == "홍합"
    assert canonicalize_ingredient_name("바지락살") == "바지락"
    assert canonicalize_ingredient_name("무염버터") == "버터"
    assert canonicalize_ingredient_name("녹인버터") == "버터"
    assert canonicalize_ingredient_name("크림치즈") == "크림치즈"
    assert canonicalize_ingredient_name("스파게티면") == "스파게티"
    assert canonicalize_ingredient_name("조랭이 떡") == "조랭이떡"
    assert canonicalize_ingredient_name("캔옥수수") == "옥수수"
    assert canonicalize_ingredient_name("굴 소스") == "굴소스"


def test_canonicalize_fourth_pass_safe_aliases_from_audit() -> None:
    assert canonicalize_ingredient_name("리코타치즈") == "리코타 치즈"
    assert canonicalize_ingredient_name("마스카르포네치즈") == "마스카포네 치즈"
    assert canonicalize_ingredient_name("모차렐라치즈") == "모짜렐라 치즈"
    assert canonicalize_ingredient_name("래디쉬") == "래디시"
    assert canonicalize_ingredient_name("레디쉬") == "래디시"
    assert canonicalize_ingredient_name("레몬쥬스") == "레몬즙"
    assert canonicalize_ingredient_name("레몬주스") == "레몬즙"
    assert canonicalize_ingredient_name("매실액기스") == "매실청"
    assert canonicalize_ingredient_name("매실원액") == "매실청"
    assert canonicalize_ingredient_name("불린당면") == "당면"
    assert canonicalize_ingredient_name("조갯살") == "조개살"
    assert canonicalize_ingredient_name("조개 살") == "조개살"
    assert canonicalize_ingredient_name("쭈꾸미") == "주꾸미"
    assert canonicalize_ingredient_name("마른미역") == "미역"
    assert canonicalize_ingredient_name("불린 미역") == "미역"
    assert canonicalize_ingredient_name("건다시마") == "다시마"
    assert canonicalize_ingredient_name("다시마국물") == "다시마"
    assert canonicalize_ingredient_name("게맛살") == "맛살"
    assert canonicalize_ingredient_name("크래미") == "맛살"


def test_canonicalize_fifth_pass_safe_aliases_from_audit() -> None:
    assert canonicalize_ingredient_name("부침두부") == "두부"
    assert canonicalize_ingredient_name("으깬 두부") == "두부"
    assert canonicalize_ingredient_name("비엔나소시지") == "소시지"
    assert canonicalize_ingredient_name("프랑크소시지") == "소시지"
    assert canonicalize_ingredient_name("슬라이스햄") == "햄"
    assert canonicalize_ingredient_name("통조림 햄") == "햄"
    assert canonicalize_ingredient_name("오이피클") == "피클"
    assert canonicalize_ingredient_name("할라피뇨 피클") == "피클"
    assert canonicalize_ingredient_name("실곤약") == "곤약"
    assert canonicalize_ingredient_name("곤약면") == "곤약"
    assert canonicalize_ingredient_name("찰어묵") == "어묵"
    assert canonicalize_ingredient_name("찐 어묵") == "어묵"
    assert canonicalize_ingredient_name("캔참치") == "참치"
    assert canonicalize_ingredient_name("참치통조림") == "참치"
    assert canonicalize_ingredient_name("명태포") == "명태"
    assert canonicalize_ingredient_name("꼬막살") == "꼬막"
    assert canonicalize_ingredient_name("꽃게살") == "꽃게"
    assert canonicalize_ingredient_name("김가루") == "김"
    assert canonicalize_ingredient_name("깨가루") == "깨"
    assert canonicalize_ingredient_name("들깨가루") == "들깨"


def test_canonicalize_db_rows_merges_alias_ids_and_preserves_canonical_id() -> None:
    ingredients = [
        {"ingredientId": "milk", "ingredientName": "우유", "category": "유제품"},
        {"ingredientId": "low-fat-milk", "ingredientName": "저지방우유", "category": "유제품"},
        {"ingredientId": "egg", "ingredientName": "계란", "category": "정육/계란"},
        {"ingredientId": "dalgyal", "ingredientName": "달걀 1개", "category": "기타"},
    ]
    recipe_ingredients = [
        {"recipeIngredientId": "ri1", "recipeId": "r1", "ingredientId": "low-fat-milk"},
        {"recipeIngredientId": "ri2", "recipeId": "r2", "ingredientId": "dalgyal"},
    ]

    result = canonicalize_db_rows(ingredients, recipe_ingredients)

    assert [row["ingredientName"] for row in result.ingredients] == ["계란", "우유"]
    assert result.ingredient_id_map["low-fat-milk"] == "milk"
    assert result.ingredient_id_map["dalgyal"] == "egg"
    assert [row["ingredientId"] for row in result.recipe_ingredients] == ["milk", "egg"]
    assert result.aliases_by_canonical_name["우유"] == ["저지방우유"]
