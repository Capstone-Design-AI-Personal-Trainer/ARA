package com.ara.repository;

import com.ara.entity.PatientDoctor;
import com.ara.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientDoctorRepository extends JpaRepository<PatientDoctor, Long> {
    List<PatientDoctor> findByUserOrderByPrimaryDoctorDescAssignedAtDesc(User user);
}
