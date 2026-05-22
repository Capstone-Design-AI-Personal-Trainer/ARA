package com.ara.controller;

import com.ara.controller.dto.MedicalReportRequest;
import com.ara.controller.dto.MedicalReportResponse;
import com.ara.service.MedicalReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-reports")
public class MedicalReportController {

    private final MedicalReportService medicalReportService;

    public MedicalReportController(MedicalReportService medicalReportService) {
        this.medicalReportService = medicalReportService;
    }

    @PostMapping
    public ResponseEntity<MedicalReportResponse> createReport(
        Authentication authentication,
        @RequestBody MedicalReportRequest request
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(medicalReportService.createReport(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<MedicalReportResponse>> getReports(Authentication authentication) {
        return ResponseEntity.ok(medicalReportService.getReports(authentication.getName()));
    }
}
