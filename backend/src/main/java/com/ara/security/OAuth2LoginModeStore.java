package com.ara.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OAuth2LoginModeStore {
    private final Map<String, String> modesByState = new ConcurrentHashMap<>();

    public void save(String state, String mode) {
        if (state == null || state.isBlank()) {
            return;
        }
        modesByState.put(state, normalize(mode));
    }

    public Optional<String> find(String state) {
        if (state == null || state.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(modesByState.get(state));
    }

    public Optional<String> remove(String state) {
        if (state == null || state.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(modesByState.remove(state));
    }

    private String normalize(String mode) {
        return "signup".equalsIgnoreCase(mode) ? "signup" : "login";
    }
}
