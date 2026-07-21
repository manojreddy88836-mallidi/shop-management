package com.shopmanager.controller;

import com.shopmanager.dto.ApiResponse;
import com.shopmanager.dto.DashboardDTO;
import com.shopmanager.service.DashboardService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/stats
     *
     * Supported query params:
     *   period = today | yesterday | week | month (convenience presets)
     *   start  = ISO date (YYYY-MM-DD) }  used when period=custom
     *   end    = ISO date (YYYY-MM-DD) }
     *
     * If period is absent and no start/end given → defaults to today.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardDTO>> getStats(
            @RequestParam(required = false, defaultValue = "today") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        LocalDate today = LocalDate.now();
        LocalDate s, e;
        String label;

        switch (period) {
            case "yesterday":
                s = today.minusDays(1); e = today.minusDays(1); label = "Yesterday"; break;
            case "week":
                s = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                e = today; label = "This Week"; break;
            case "month":
                s = today.with(TemporalAdjusters.firstDayOfMonth());
                e = today; label = "This Month"; break;
            case "custom":
                s = start != null ? start : today;
                e = end   != null ? end   : today;
                label = null; // service will build "DD MMM – DD MMM"
                break;
            default: // "today"
                s = today; e = today; label = "Today"; break;
        }

        return ResponseEntity.ok(ApiResponse.success("Dashboard stats",
                dashboardService.getStatsForRange(s, e, label)));
    }
}
