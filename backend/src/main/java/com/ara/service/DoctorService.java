package com.ara.service;

import com.ara.controller.dto.DoctorRequest;
import com.ara.controller.dto.DoctorResponse;
import com.ara.entity.Doctor;
import com.ara.entity.PatientDoctor;
import com.ara.entity.User;
import com.ara.repository.DoctorRepository;
import com.ara.repository.PatientDoctorRepository;
import com.ara.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final PatientDoctorRepository patientDoctorRepository;
    private final UserRepository userRepository;

    public DoctorService(
        DoctorRepository doctorRepository,
        PatientDoctorRepository patientDoctorRepository,
        UserRepository userRepository
    ) {
        this.doctorRepository = doctorRepository;
        this.patientDoctorRepository = patientDoctorRepository;
        this.userRepository = userRepository;
    }

    public DoctorResponse createDoctor(String email, DoctorRequest request) {
        User user = findUser(email);
        Doctor doctor = Doctor.builder()
            .name(required(request.getName(), "Doctor name is required"))
            .hospital(request.getHospital())
            .department(request.getDepartment())
            .phone(request.getPhone())
            .email(request.getEmail())
            .notes(request.getNotes())
            .build();

        Doctor savedDoctor = doctorRepository.save(doctor);
        PatientDoctor link = PatientDoctor.builder()
            .user(user)
            .doctor(savedDoctor)
            .primaryDoctor(Boolean.TRUE.equals(request.getPrimaryDoctor()))
            .build();

        return toResponse(patientDoctorRepository.save(link));
    }

    public List<DoctorResponse> getDoctors(String email) {
        User user = findUser(email);
        return patientDoctorRepository.findByUserOrderByPrimaryDoctorDescAssignedAtDesc(user)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }
        return value;
    }

    private DoctorResponse toResponse(PatientDoctor patientDoctor) {
        Doctor doctor = patientDoctor.getDoctor();
        return DoctorResponse.builder()
            .id(doctor.getId())
            .name(doctor.getName())
            .hospital(doctor.getHospital())
            .department(doctor.getDepartment())
            .phone(doctor.getPhone())
            .email(doctor.getEmail())
            .notes(doctor.getNotes())
            .primaryDoctor(patientDoctor.getPrimaryDoctor())
            .assignedAt(patientDoctor.getAssignedAt() != null ? patientDoctor.getAssignedAt().toString() : "")
            .build();
    }
}
