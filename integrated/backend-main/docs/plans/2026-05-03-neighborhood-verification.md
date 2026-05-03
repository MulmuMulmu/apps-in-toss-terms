# Neighborhood Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require a verified current-position check before saving a manually selected sharing neighborhood.

**Architecture:** The frontend sends the chosen neighborhood coordinate plus the device's current coordinate. The backend calculates the distance and saves the location only when the current position is within the configured verification radius.

**Tech Stack:** React, Apps in Toss geolocation SDK, browser Geolocation API, Spring Boot, JPA, MySQL.

---

### Task 1: Backend Verification Contract

**Files:**
- Modify: `src/main/java/com/team200/graduation_project/domain/share/dto/request/LocationRequest.java`
- Modify: `src/main/java/com/team200/graduation_project/domain/share/service/ShareService.java`
- Modify: `src/main/java/com/team200/graduation_project/global/apiPayload/code/GeneralErrorCode.java`
- Test: `src/test/java/com/team200/graduation_project/domain/share/service/ShareServiceTest.java`

**Steps:**
1. Add failing tests for rejecting a selected neighborhood when the current coordinate is farther than 3km and accepting it when nearby.
2. Add optional `verificationLatitude` and `verificationLongitude` to `LocationRequest`.
3. In `ShareService.addLocation`, validate base coordinates and, when verification coordinates exist, compare distance before calling Kakao.
4. Add a clear `LOCATION_VERIFICATION_FAILED` error.
5. Run the share service tests against Docker MySQL.

### Task 2: Frontend Manual Neighborhood Flow

**Files:**
- Modify: `../Front-Repository-application-fresh/src/App.tsx`
- Modify: `../Front-Repository-application-fresh/src/services/miniappApi.ts`

**Steps:**
1. Extend `updateShareLocation` to accept optional verification coordinates.
2. In `LocationSettingView.useSelectedLocation`, resolve the selected dong coordinate, then request current location, then call the backend with both coordinates.
3. Keep the current-location-only button as a direct save path.
4. Show clear failure text when permission is denied or selected neighborhood is too far.

### Task 3: Verification

**Commands:**
- `./gradlew.bat test --tests com.team200.graduation_project.domain.share.service.ShareServiceTest`
- Frontend typecheck or existing app test command if available.
