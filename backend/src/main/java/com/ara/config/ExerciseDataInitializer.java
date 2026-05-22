package com.ara.config;

import com.ara.entity.ExerciseDefinition;
import com.ara.repository.ExerciseDefinitionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExerciseDataInitializer implements CommandLineRunner {

    private static final String DUMMY_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
    private static final String SHOULDER_ABDUCTION_VIDEO_URL = "https://www.youtube.com/embed/Lyhpfw_tP5c";
    private static final String WALL_SLIDE_VIDEO_URL = "https://www.youtube.com/embed/i_0zLUcE-zk";

    private final ExerciseDefinitionRepository repository;
    private final ObjectMapper objectMapper;

    public ExerciseDataInitializer(ExerciseDefinitionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        save("wall-squat", "벽 스쿼트", "무릎", "무릎 재활 · 10 min", "초",
            List.of(
                "벽을 지지대로 사용해 천천히 내려가며 무릎 정렬을 연습합니다.",
                "엉덩이와 허벅지 근육을 함께 사용해 하체 안정성을 높입니다."
            ),
            List.of(
                "등을 벽에 기대고 발을 골반 너비로 벌립니다.",
                "무릎이 발끝보다 안쪽으로 모이지 않게 천천히 내려갑니다.",
                "통증 없는 범위에서 멈춘 뒤 천천히 올라옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("leg-raise", "slow-lunge"));

        save("leg-raise", "레그 레이즈", "무릎", "무릎 재활 · 10 min", "중",
            List.of(
                "다리를 곧게 들어 올려 허벅지 앞쪽 근육을 활성화합니다.",
                "무릎에 큰 부담을 주지 않고 기초 근력을 기르는 운동입니다."
            ),
            List.of(
                "바닥에 누워 한쪽 무릎은 세우고 반대쪽 다리는 곧게 폅니다.",
                "편 다리를 천천히 들어 올린 뒤 1초간 유지합니다.",
                "허리가 뜨지 않게 복부에 힘을 주며 천천히 내립니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("wall-squat", "slow-lunge"));

        save("slow-lunge", "슬로우 런지", "무릎", "무릎 재활 · 12 min", "중",
            List.of(
                "좌우 균형을 유지하며 무릎과 고관절을 함께 강화합니다.",
                "내려갈 때 무릎이 안쪽으로 모이지 않도록 주의합니다."
            ),
            List.of(
                "한쪽 발을 앞으로 내딛고 뒤꿈치는 자연스럽게 듭니다.",
                "앞쪽 무릎이 발끝 방향을 따라가도록 천천히 내려갑니다.",
                "발바닥으로 바닥을 밀며 시작 자세로 돌아옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("wall-squat", "leg-raise"));

        save("bird-dog", "버드독", "허리", "허리 재활 · 10 min", "초",
            List.of(
                "허리 안정성과 코어 조절 능력을 함께 강화합니다.",
                "손과 무릎으로 바닥을 지지한 뒤 반대쪽 팔과 다리를 들어 올립니다."
            ),
            List.of(
                "네발기기 자세에서 척추를 중립으로 유지합니다.",
                "왼팔과 오른다리를 동시에 천천히 뻗습니다.",
                "몸통이 흔들리지 않게 유지하며 시작 자세로 돌아옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("bridge", "dead-bug"));

        save("bridge", "브릿지", "허리", "허리 재활 · 10 min", "중",
            List.of(
                "둔근과 햄스트링을 활성화해 허리 지지력을 높입니다.",
                "골반을 들어 올릴 때 무릎과 발의 정렬을 유지합니다."
            ),
            List.of(
                "바닥에 누워 무릎을 세우고 발을 붙입니다.",
                "골반을 천천히 들어 올려 어깨부터 무릎까지 일직선을 만듭니다.",
                "허리를 꺾지 않게 주의하며 천천히 내려옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("bird-dog", "dead-bug"));

        save("dead-bug", "데드버그", "허리", "허리 재활 · 10 min", "중",
            List.of(
                "코어를 안정화하고 척추를 중립으로 유지하는 연습입니다.",
                "팔과 다리를 교차로 움직이며 복부 조절 능력을 기릅니다."
            ),
            List.of(
                "바닥에 누워 무릎과 팔을 들어 준비합니다.",
                "한쪽 팔과 반대쪽 다리를 천천히 내립니다.",
                "허리가 뜨지 않게 유지하며 시작 자세로 돌아옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("bridge", "bird-dog"));

        save("shoulder-abduction", "어깨 외전", "어깨", "어깨 재활 · 10 min", "초",
            List.of(
                "팔을 몸 옆에서 바깥쪽으로 들어 올려 어깨 가동 범위를 확인합니다.",
                "통증 없는 범위에서 천천히 움직이며 어깨 주변 근육을 활성화합니다."
            ),
            List.of(
                "등을 곧게 세우고 팔을 몸 옆에 둡니다.",
                "팔꿈치를 편 상태로 팔을 옆으로 천천히 들어 올립니다.",
                "어깨가 올라가지 않게 유지하며 천천히 시작 자세로 돌아옵니다."
            ),
            SHOULDER_ABDUCTION_VIDEO_URL,
            List.of("wall-slide", "band-rotation"));

        save("band-rotation", "밴드 외회전", "어깨", "어깨 재활 · 10 min", "초",
            List.of(
                "어깨 회전근개를 강화하고 안정성을 높입니다.",
                "밴드를 이용해 천천히 외회전 동작을 수행합니다."
            ),
            List.of(
                "몸 옆에 팔꿈치를 붙이고 팔꿈치를 90도로 굽힙니다.",
                "어깨 높이를 유지하며 손을 바깥쪽으로 회전합니다.",
                "반동 없이 천천히 시작 위치로 돌아옵니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("shoulder-abduction", "wall-slide"));

        save("scapula-retraction", "견갑골 모으기", "어깨", "어깨 재활 · 10 min", "중",
            List.of(
                "어깨뼈 안정성을 높이고 자세를 교정하는 운동입니다.",
                "양쪽 견갑골을 등 중앙으로 모으며 어깨 주변 긴장을 줄입니다."
            ),
            List.of(
                "등을 곧게 세우고 어깨에 힘을 뺍니다.",
                "양쪽 견갑골을 뒤로 모으듯 천천히 당깁니다.",
                "목에 힘이 들어가지 않게 유지하며 반복합니다."
            ),
            DUMMY_VIDEO_URL,
            List.of("shoulder-abduction", "wall-slide"));

        save("wall-slide", "벽 슬라이드", "어깨", "어깨 재활 · 10 min", "중",
            List.of(
                "어깨 가동 범위와 안정성을 함께 개선합니다.",
                "벽과 팔을 이용해 천천히 팔을 위로 미는 운동입니다."
            ),
            List.of(
                "벽을 마주보고 서서 팔을 벽에 붙입니다.",
                "팔을 위로 미끄러뜨리며 가능한 범위까지 올립니다.",
                "어깨가 과하게 올라가지 않게 유지하며 천천히 내려옵니다."
            ),
            WALL_SLIDE_VIDEO_URL,
            List.of("shoulder-abduction", "scapula-retraction"));
    }

    private void save(
        String id,
        String name,
        String part,
        String subtitle,
        String level,
        List<String> intro,
        List<String> steps,
        String guideVideoUrl,
        List<String> futureMoveIds
    ) {
        repository.save(ExerciseDefinition.builder()
            .id(id)
            .name(name)
            .part(part)
            .subtitle(subtitle)
            .level(level)
            .introJson(writeJson(intro))
            .stepsJson(writeJson(steps))
            .guideVideoUrl(guideVideoUrl)
            .futureMoveIdsJson(writeJson(futureMoveIds))
            .mediaPipeJson("{}")
            .build());
    }

    private String writeJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize exercise definition JSON", e);
        }
    }
}
