package com.shopora.auth.dto;

import java.util.List;

/** Statistiques globales sur les comptes. */
public record AdminUserStatsResponse(
        long totalUsers,
        long clients,
        long vendors,
        long admins,
        long enabledUsers,
        long disabledUsers,
        long newUsersLast7Days,
        List<DayCount> signupsByDay) {

    public record DayCount(String day, long count) { }
}
