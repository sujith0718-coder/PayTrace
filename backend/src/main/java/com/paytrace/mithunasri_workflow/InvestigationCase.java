package com.paytrace.mithunasri_workflow;

import com.paytrace.thurika_models.Discrepancy;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DEVELOPER: Mithunasri J
 * OBJECTIVE: State machine managing the lifecycle of an investigation case.
 */
public class InvestigationCase {

    // TODO [MITHUNASRI]: Declare private fields
    // - private String caseId;
    // - private Discrepancy discrepancy;
    // - private InvestigationStatus status;
    // - private String assignedAnalyst;
    // - private String resolutionCategory;
    // - private String resolutionNote;
    // - private LocalDateTime createdAt;
    // - private LocalDateTime resolvedAt;
    // - private List<String> notes;
    private String caseId;
    private Discrepancy discrepancy;
    private InvestigationStatus status;
    private String assignedAnalyst;
    private String resolutionCategory;
    private String resolutionNote;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private List<String> notes = new ArrayList<>();

    public InvestigationCase(String caseId, Discrepancy discrepancy, String assignedAnalyst) {
        // TODO [MITHUNASRI]: Initialize caseId, discrepancy, assignedAnalyst
        this.caseId = caseId;
        this.discrepancy = discrepancy;
        this.assignedAnalyst = assignedAnalyst;
        this.status = InvestigationStatus.OPEN;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Transition 1: Moves case to UNDER_REVIEW
     */
    public void moveToUnderReview() {
        // TODO [MITHUNASRI]: Check if this.status == InvestigationStatus.RESOLVED
        // If so, throw new IllegalStateException("Cannot move a RESOLVED case to UNDER_REVIEW directly. Reopen first.");
        if (this.status == InvestigationStatus.RESOLVED) {
            throw new IllegalStateException("Cannot move a RESOLVED case to UNDER_REVIEW directly. Reopen first.");
        }
        this.status = InvestigationStatus.UNDER_REVIEW;
    }

    /**
     * Transition 2: Resolves the case with mandatory category and compliance explanation
     */
    public void resolve(String category, String note) {
        // TODO [MITHUNASRI]: Validate that note is not null and not blank!
        // If blank, throw new IllegalArgumentException("Resolution note is mandatory.");
        if (note == null || note.trim().isEmpty()) {
            throw new IllegalArgumentException("Resolution note is mandatory.");
        }

        this.status = InvestigationStatus.RESOLVED;
        this.resolutionCategory = category;
        this.resolutionNote = note;
        this.resolvedAt = LocalDateTime.now();
        this.notes.add("RESOLVED [" + category + "]: " + note);
    }

    /**
     * Transition 3: Reopens a case
     */
    public void reopen(String reason) {
        // TODO [MITHUNASRI]: Update status to REOPENED and append reason to notes
        this.status = InvestigationStatus.REOPENED;
        this.notes.add("REOPENED: " + reason);
    }

    /**
     * Appends an analyst investigation note
     */
    public void addNote(String author, String text) {
        // TODO [MITHUNASRI]: Add timestamped note string to this.notes
        this.notes.add(author + " (" + LocalDateTime.now() + "): " + text);
    }

    // TODO [MITHUNASRI]: Add Getters below
    public String getCaseId() {
        return caseId;
    }

    public Discrepancy getDiscrepancy() {
        return discrepancy;
    }

    public InvestigationStatus getStatus() {
        return status;
    }

    public String getAssignedAnalyst() {
        return assignedAnalyst;
    }

    public List<String> getNotes() {
        return notes;
    }

    public String getResolutionCategory() {
        return resolutionCategory;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
}

