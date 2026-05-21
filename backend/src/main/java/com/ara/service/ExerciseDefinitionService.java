package com.ara.service;

import com.ara.controller.dto.ExerciseDetailResponse;
import com.ara.controller.dto.ExerciseSummaryResponse;
import com.ara.entity.ExerciseDefinition;
import com.ara.repository.ExerciseDefinitionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ExerciseDefinitionService {

    private final ExerciseDefinitionRepository repository;
    private final ObjectMapper objectMapper;

    public ExerciseDefinitionService(ExerciseDefinitionRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public List<ExerciseSummaryResponse> getAllSummaries() {
        return repository.findAll().stream()
            .map(this::toSummary)
            .collect(Collectors.toList());
    }

    public Optional<ExerciseDetailResponse> getById(String id) {
        return repository.findById(id).map(this::toDetail);
    }

    public ExerciseDefinition save(ExerciseDefinition definition) {
        return repository.save(definition);
    }

    private ExerciseSummaryResponse toSummary(ExerciseDefinition definition) {
        return ExerciseSummaryResponse.builder()
            .id(definition.getId())
            .name(definition.getName())
            .part(definition.getPart())
            .subtitle(definition.getSubtitle())
            .guideVideoUrl(definition.getGuideVideoUrl())
            .build();
    }

    private ExerciseDetailResponse toDetail(ExerciseDefinition definition) {
        List<String> intro = parseJson(definition.getIntroJson(), new TypeReference<List<String>>() {});
        List<String> steps = parseJson(definition.getStepsJson(), new TypeReference<List<String>>() {});
        List<String> futureIds = parseJson(definition.getFutureMoveIdsJson(), new TypeReference<List<String>>() {});

        List<ExerciseSummaryResponse> futureMoves = futureIds.stream()
            .map(repository::findById)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(this::toSummary)
            .collect(Collectors.toList());

        return ExerciseDetailResponse.builder()
            .id(definition.getId())
            .name(definition.getName())
            .part(definition.getPart())
            .subtitle(definition.getSubtitle())
            .level(definition.getLevel())
            .intro(intro)
            .steps(steps)
            .guideVideoUrl(definition.getGuideVideoUrl())
            .futureMoves(futureMoves)
            .mediaPipeJson(definition.getMediaPipeJson())
            .build();
    }

    private <T> T parseJson(String json, TypeReference<T> typeReference) {
        if (json == null || json.isBlank()) {
            if (typeReference.getType().getTypeName().startsWith("java.util.List")) {
                return (T) Collections.emptyList();
            }
            return null;
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            return (T) Collections.emptyList();
        }
    }
}
