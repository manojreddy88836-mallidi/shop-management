package com.shopmanager.controller;

import com.shopmanager.dto.ApiResponse;
import com.shopmanager.dto.ReportItemDTO;
import com.shopmanager.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<ReportItemDTO>>> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success("Daily report", reportService.getDailyReport(date)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<ReportItemDTO>>> weekly() {
        return ResponseEntity.ok(ApiResponse.success("Weekly report", reportService.getWeeklyReport()));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<List<ReportItemDTO>>> monthly() {
        return ResponseEntity.ok(ApiResponse.success("Monthly report", reportService.getMonthlyReport()));
    }

    @GetMapping("/custom")
    public ResponseEntity<ApiResponse<List<ReportItemDTO>>> custom(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success("Custom report",
                reportService.getCustomReport(start, end)));
    }
}
