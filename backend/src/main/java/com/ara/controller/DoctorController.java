package com.ara.controller;

import com.ara.controller.dto.DoctorRequest;
import com.ara.controller.dto.DoctorResponse;
import com.ara.service.DoctorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    public ResponseEntity<DoctorResponse> createDoctor(
        Authentication authentication,
        @RequestBody DoctorRequest request
    ) {
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(doctorService.createDoctor(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<DoctorResponse>> getDoctors(Authentication authentication) {
        return ResponseEntity.ok(doctorService.getDoctors(authentication.getName()));
    }
}
