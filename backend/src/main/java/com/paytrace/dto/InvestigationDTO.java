package com.paytrace.dto;

import java.time.Instant;
import java.util.List;

public record InvestigationDTO(
    String id,
    String caseNumber,
    String discrepancyId,
    String runId,
    String discrepancyType,
    String severity,
    String status,
    String assignedAnalyst,
    String assignedAnalystEmail,
    Instant createdAt,
    Instant updatedAt,
    Instant resolvedAt,
    String resolutionCategory,
    String resolutionNote,
    List<NoteDTO> notes
) {
    public record NoteDTO(
        String id,
        String author,
        String authorRole,
        Instant timestamp,
        String text
    ) {}
}

