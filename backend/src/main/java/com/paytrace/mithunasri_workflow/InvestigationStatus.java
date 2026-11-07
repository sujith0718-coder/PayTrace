package com.paytrace.mithunasri_workflow;

/**
 * DEVELOPER: Mithunasri J
 * OBJECTIVE: State machine lifecycle phases for an investigation case.
 */
public enum InvestigationStatus {
    // Brand new discrepancy waiting for analyst pickup
    OPEN,

    // Currently being investigated by an analyst
    UNDER_REVIEW,

    // Formally balanced, approved, and resolved with explanation note
    RESOLVED,

    // Previously resolved case flagged for re-investigation
    REOPENED
}

