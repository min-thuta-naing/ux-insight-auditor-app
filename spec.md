# UX Insight Auditor - Application Specification

## 1. Overview
**UX Insight Auditor** is a professional-grade, AI-powered web application designed to automate and enhance User Experience (UX) audits. It allows designers, developers, and students to upload UI screenshots and receive detailed heuristic evaluations based on **Nielsen's 10 Usability Heuristics**.

The application leverages **Google's Gemini 2.5 Flash** model to visually analyze interfaces, identify usability issues, and provide actionable recommendations. It supports educational workflows, allowing students to submit audits as assignments and professors to review them via a dashboard.

## 2. Core Functionality

### 2.1. Audit Configuration
*   **Image Upload**: Users can upload screenshots (PNG, JPG) for analysis.
*   **Heuristic Selection**:
    *   **Single Heuristic**: Focus on one specific rule (e.g., "H1: Visibility of System Status").
    *   **Full Audit**: Sequentially analyze against all 10 heuristics.
*   **Persona Simulation**: The AI analyzes the UI from specific perspectives:
    *   *General Public*
    *   *Elderly / Novice User*
    *   *Developer / Expert*
*   **Audit Scope**:
    *   *Standard UX*: Focus on general usability.
    *   *Inclusive Design*: Adds emphasis on accessibility and inclusivity.
*   **Accessibility Level**: Options for WCAG A, AA, or AAA compliance checks.

### 2.2. AI Analysis & Reporting
*   **Visual Analysis**: Gemini 2.5 Flash analyzes the image to identify UI elements.
*   **Findings Generation**:
    *   **Issue Identification**: Locates specific UI problems.
    *   **Severity Rating**: Critical, High, Medium, Low.
    *   **Reasoning**: Explains *why* it violates the heuristic.
    *   **Suggestion**: Provides concrete fixes.
    *   **Bounding Boxes**: (Data structure supports mapping findings to specific image coordinates).
*   **Scoring**: Calculates an overall usability score and violation counts.
*   **Executive Summary**: Generates a high-level overview of the audit.

### 2.3. Educational Workflow (Student & Professor)
*   **Student Mode**:
    *   Onboarding screen to enter Name and Student ID.
    *   Ability to run audits and "Submit Assignment".
    *   Generates a reference code for submissions.
*   **Professor Mode**:
    *   Password-protected dashboard.
    *   View list of student submissions.
    *   Load and review specific student audits in the main auditor view.
    *   Class statistics (implied by data structures).

### 2.4. Data Management
*   **Local History**: Audits are saved to the browser's `localStorage`.
*   **Session Management**: Users can save, load, and delete past audits.
*   **Export/Submit**: "Submitting" an assignment saves the snapshot to a simulated server (local storage in this MVP).

## 3. Architecture & Tech Stack

### 3.1. Frontend
*   **Framework**: React 19 (Functional Components, Hooks).
*   **Language**: TypeScript (Strict typing).
*   **Build Tool**: Vite.
*   **Styling**: Tailwind CSS (Utility-first).
*   **Visualization**: `recharts` for data visualization (scores, stats).

### 3.2. AI Integration
*   **Model**: Google Gemini 2.5 Flash (`gemini-2.5-flash`).
*   **SDK**: `@google/genai`.
*   **Method**: Multimodal analysis (Image + Text Prompting).

### 3.3. State Management
*   **Local State**: `useState` and `useReducer` (implied) for component-level state.
*   **Persistence**: Custom `storageService` wrapping `localStorage`.

## 4. Data Structures (Key Types)

*   **`Finding`**: Represents a single usability issue (Category, Severity, Location, Suggestion).
*   **`UsabilityReport`**: Aggregates findings for a specific heuristic or session.
*   **`SavedAudit`**: A complete snapshot of an audit session (Image, Config, Reports).
*   **`StudentSubmission`**: Links a `SavedAudit` to a student identity.

## 5. User Interface Views
1.  **Landing**: Introduction and role selection (Start Audit / Professor Login).
2.  **Student Onboarding**: Data entry for student details.
3.  **Auditor**: Main workspace with Image Viewer, Controls, and Findings List.
4.  **Submission Success**: Confirmation screen after submitting an assignment.
5.  **Professor Dashboard**: List of submissions and class metrics.

## 6. Future Roadmap (Potential)
*   PDF Export for reports.
*   Real-time cloud database (Firebase/Supabase) for classroom management.
*   Comparison mode (A/B testing audits).
