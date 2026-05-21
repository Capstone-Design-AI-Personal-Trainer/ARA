package com.ara.controller.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardResponse {
    private Integer rank;
    private String name;
    private Integer score;
    private Integer sessionCount;
    private String badge;
    private Boolean currentUser;
}
