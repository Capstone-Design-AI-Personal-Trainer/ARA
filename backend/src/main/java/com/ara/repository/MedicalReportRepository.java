package com.ara.repository;

import com.ara.entity.MedicalReport;
import com.ara.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    List<MedicalReport> findByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
}
