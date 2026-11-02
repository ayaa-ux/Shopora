package com.shopora.groupbuying.dto;

import java.util.Map;

/** Statistiques globales des achats groupés. */
public record AdminSessionStatsResponse(
        long totalSessions,
        long activeSessions,
        long successfulSessions,
        long failedSessions,
        long successRatePercent,
        long totalParticipations,
        Map<String, Long> participationsByPaymentStatus) {
}
