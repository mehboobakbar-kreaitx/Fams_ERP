# FAMS — Falcon Academic Management System
## Complete Project Reference Document

> **Document Type:** Master Reference — PRD + Technology Stack  
> **System:** Falcon Academic Management System (FAMS)  
> **Framework:** ASP.NET Core 8 (.NET 8)  
> **Version:** 1.0 — Final Draft  
> **Scale:** 31 Campuses — Enterprise Multi-Campus ERP  
> **Prepared by:** RaideIT Software Solutions / Mehboob.mov  
> **Classification:** Confidential  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Objectives](#3-objectives)
4. [Scope](#4-scope)
5. [System Overview](#5-system-overview)
6. [User Roles and Personas](#6-user-roles-and-personas)
7. [Functional Requirements](#7-functional-requirements)
   - 7.1 [CRM — Student and Parent Management](#71-crm--student-and-parent-management)
   - 7.2 [Admissions and Enrollment Management](#72-admissions-and-enrollment-management)
   - 7.3 [Procurement and Vendor Management](#73-procurement-and-vendor-management)
   - 7.4 [Academic Operations](#74-academic-operations)
   - 7.5 [Results and Reporting](#75-results-and-reporting)
   - 7.6 [Accounting and Finance](#76-accounting-and-finance)
   - 7.7 [Human Resource Management](#77-human-resource-management)
   - 7.8 [Assets and Inventory Management](#78-assets-and-inventory-management)
   - 7.9 [Cross-Cutting Platform Features](#79-cross-cutting-platform-features)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [System Architecture](#9-system-architecture)
10. [Data Flow and Integration](#10-data-flow-and-integration)
11. [Security and Compliance](#11-security-and-compliance)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Risks and Assumptions](#13-risks-and-assumptions)
14. [Technology Stack — .NET Core Edition](#14-technology-stack--net-core-edition)
    - 14.1 [Frontend — Presentation Layer](#141-frontend--presentation-layer)
    - 14.2 [API Gateway and Communication](#142-api-gateway-and-communication)
    - 14.3 [Backend — Application Layer](#143-backend--application-layer)
    - 14.4 [Data Layer](#144-data-layer)
    - 14.5 [Authentication, Security and Compliance](#145-authentication-security-and-compliance)
    - 14.6 [External Integrations](#146-external-integrations)
    - 14.7 [Testing and Quality Assurance](#147-testing-and-quality-assurance)
    - 14.8 [DevOps — Local Now, Cloud-Ready Later](#148-devops--local-now-cloud-ready-later)
    - 14.9 [NFR-to-Technology Mapping](#149-nfr-to-technology-mapping)
    - 14.10 [Complete Stack Quick Reference](#1410-complete-stack-quick-reference)
15. [Technology Decision Rationale](#15-technology-decision-rationale)
16. [Conclusion](#16-conclusion)

---

## 1. Executive Summary

This document is the complete, authoritative reference for the **Falcon Academic Management System (FAMS)** — a purpose-built enterprise ERP platform commissioned by Falcon College to unify the administrative, academic, financial, and human capital operations of its 31-campus network under a single, centralized digital ecosystem.

Falcon College currently operates across 31 geographically distributed campuses, each running partially independent administrative workflows on a combination of legacy software, paper-based processes, and disconnected spreadsheet systems. This fragmentation creates significant operational overhead, data inconsistencies, reporting delays, and a degraded service experience for staff, students, and parents. FAMS is designed to eliminate these inefficiencies by providing a unified, cloud-enabled, web-based platform accessible to all authorized stakeholders through role-differentiated portals.

The system encompasses **eight core functional modules**: Customer Relationship Management (CRM), Admissions, Procurement and Vendor Management, Academic Operations, Results and Reporting, Accounting and Finance, Human Resource Management (HRM), and Assets and Inventory Management. Overlaying all modules are cross-cutting enterprise features including real-time analytics dashboards, AI-powered chatbot support, tablet-based attendance capture, e-learning integration, and fully paperless transactional workflows.

| Attribute | Value |
|---|---|
| Total Campuses | 31 |
| Deployment Model | Centralized Cloud-Enabled Web Application |
| Primary Stakeholders | Board of Governors, Campus Principals, Administrative Staff, Teaching Staff, Students, Parents |
| Core Modules | 8 Functional Modules + Cross-Cutting Platform Layer |
| Backend Framework | ASP.NET Core 8 (.NET 8) |
| Document Version | 1.0 — Final Draft |
| Classification | Confidential |

---

## 2. Product Vision

The vision for FAMS is to establish Falcon College as a digitally mature, data-driven educational institution capable of delivering consistent, high-quality services across all 31 campuses through a single, integrated technology platform. FAMS is conceived not merely as a software tool but as the **central nervous system of the institution** — connecting every operational domain, surfacing actionable intelligence in real time, and enabling leadership to make informed decisions grounded in accurate, institution-wide data.

The platform embodies four foundational design principles:

- **Centralization** — All campuses operate from a single source of truth, eliminating data silos
- **Transparency** — Every transaction and approval is logged, traceable, and auditable
- **Accessibility** — Role-appropriate portals ensure every stakeholder can access relevant information securely
- **Scalability** — The architecture accommodates institutional growth without structural re-engineering

The long-term product vision positions FAMS as an **AI-augmented institutional intelligence platform** where predictive analytics inform admissions strategy, machine learning models identify at-risk performance patterns, and automated workflows eliminate manual overhead across all departments.

---

## 3. Objectives

### 3.1 Operational Objectives

- Consolidate all campus-level administrative operations onto a single platform, eliminating standalone legacy systems and paper-based workflows
- Reduce administrative processing time for key transactions (admissions, fee collection, result publication, payroll) by a minimum of **60 percent**
- Enable real-time attendance capture across all campuses using tablet-based hardware, replacing manual register systems
- Automate end-to-end fee management from invoice generation to receipt issuance and defaulter identification, with zero manual reconciliation
- Provide principals and administrative officers with role-specific dashboards surfacing live KPIs relevant to their area of responsibility

### 3.2 Strategic Objectives

- Create a unified institutional data repository supporting cross-campus benchmarking, performance analysis, and evidence-based policy decisions
- Improve the service experience for students and parents through self-service portals providing 24/7 access to academic records, fee statements, and communications
- Enable the Board of Governors to monitor institution-wide KPIs through a consolidated executive dashboard
- Establish the data infrastructure required to support future AI-driven analytics and predictive modeling capabilities
- Transition Falcon College to a **fully paperless operational model within 18 months** of go-live

### 3.3 Technology Objectives

- Deliver a cloud-enabled, centrally hosted architecture with **99.9% uptime availability** across all campuses and user roles
- Implement enterprise-grade security including role-based access control, data encryption at rest and in transit, and comprehensive audit logging
- Ensure real-time data synchronization across all 31 campuses with maximum propagation latency under **5 seconds** for critical transactional data
- Integrate an AI-powered chatbot capable of resolving Tier-1 support queries for all user roles without human intervention
- Build the platform on an **API-first architecture** to facilitate future integrations with third-party services, government data systems, and e-learning platforms

---

## 4. Scope

### 4.1 In Scope

| Deliverable | Description |
|---|---|
| Core ERP Modules | All eight functional modules as defined in Section 7 |
| Multi-Campus Management | Centralized data management for all 31 campuses with campus-level configuration and reporting |
| Role-Based Portals | Distinct portals for System Administrator, Principal, Teacher, Student, Parent, Accountant, HR Officer, and Procurement Officer |
| Real-Time Dashboards | KPI dashboards with live graphs, trend analytics, and exportable reports for all management roles |
| Tablet Attendance System | Tablet-optimized interface for attendance capture in classrooms and examination halls |
| Online Services | Web-accessible services for admissions, fee payment, result viewing, and institutional communications |
| AI Chatbot | Integrated conversational AI assistant providing Tier-1 support across all user portals |
| E-Learning Integration | Integration layer connecting FAMS to a designated external LMS for content delivery and progress tracking |
| Notifications Engine | Automated SMS, email, and in-app notifications for defined trigger events |
| Data Migration | Structured migration of existing student, staff, and financial data from legacy systems |
| System Integrations | REST API integrations with payment gateways and SMS gateways |
| Security Framework | Role-based access control, AES-256 encryption, audit trails, and multi-factor authentication |
| Training & Documentation | User manuals, administrator guides, and onboarding training materials for all user roles |

### 4.2 Out of Scope

- Native mobile application development (iOS / Android) — a mobile-responsive web interface will be delivered instead
- Biometric hardware provisioning, installation, and maintenance — hardware is the responsibility of the client's IT team
- Custom Learning Management System (LMS) development — FAMS will integrate with an externally provisioned LMS
- Government examination board integration — planned for Phase 2 roadmap
- Alumni management and post-graduation tracking modules
- Library management, hostel/accommodation, and transportation management
- Third-party ERP system data synchronization beyond the agreed migration scope
- Custom BI tooling beyond the built-in dashboards

---

## 5. System Overview

FAMS is architected as a cloud-enabled, multi-tier web application built on a **microservices-influenced backend**, a centralized relational database, and a responsive single-page application (SPA) frontend. The system is accessible via any modern web browser on desktops, laptops, and tablet devices, with the attendance module optimized for tablet-first interaction as a progressive web application (PWA) supporting offline operation.

The platform operates on a **centralized database model** — all 31 campuses write to and read from a single logical data store. Campus-level data isolation is enforced at the application layer through a tenant-aware data access model using a `campus_id` discriminator, ensuring administrators can only access data pertaining to their assigned campus unless explicitly granted cross-campus visibility.

| Layer | Component | Technology |
|---|---|---|
| Presentation | Web Portal (SPA) | React.js — Responsive, role-based UI |
| Presentation | Tablet Attendance UI | Progressive Web App (PWA) — Offline-capable |
| API Gateway | Centralized Gateway | RESTful API, JWT auth, rate limiting |
| Application | Core Business Logic | ASP.NET Core 8 (.NET 8) |
| Application | AI Chatbot Engine | NLP-based conversational AI (Claude API) |
| Application | Notifications Service | Async event-driven message broker (Hangfire) |
| Data | Primary Database | PostgreSQL 16 — row-level security (RLS) |
| Data | Cache Layer | Redis — sessions and hot data |
| Data | File Storage | S3-compatible object storage (MinIO / AWS S3) |
| Infrastructure | Cloud Hosting | Azure / AWS — multi-AZ deployment |
| Integration | Payment Gateway | REST API — JazzCash / Easypaisa |
| Integration | SMS / Email Gateway | Twilio / Jazz SMS, MailKit |
| Integration | LMS Bridge | REST API + SSO to external LMS (Moodle) |

---

## 6. User Roles and Personas

FAMS implements a strict **role-based access control (RBAC)** model. Each user is assigned one or more roles at account provisioning. Roles determine portal access, module visibility, data scope, and permitted actions.

| Role | Organizational Context | Primary Responsibilities |
|---|---|---|
| System Administrator | IT / RaideIT ops team | Full system access, all campuses. User provisioning, system configuration, security, integrations |
| Executive / Board | Board of Governors, Group Director | Read-only institution-wide KPI dashboards. Financial summaries, enrollment trends, academic performance across all campuses |
| Principal | Campus Principal / Head | Full operational access scoped to assigned campus: staff, students, timetables, results, financials |
| Academic Coordinator | HOD, Exam Controller | Academic operations: timetable management, examination scheduling, result processing, attendance reporting |
| Teacher | Teaching staff | Class timetables, attendance marking, gradebook entry, assigned student profiles |
| Accountant | Campus finance team | Fee management, payment records, payroll processing, vendor invoices, financial reports |
| HR Officer | Human resources team | Staff profiles, recruitment, leave management, attendance records, HR reporting |
| Student | Enrolled students | Self-service: timetable, attendance, exam schedule, results, fee statements, e-learning, communications |
| Parent / Guardian | Parents and legal guardians | Child's attendance, academic performance, fee status, examination results. Notification receipt and query submission |
| Procurement Officer | Campus procurement team | Purchase requisitions, vendor records, purchase orders, goods receipts, vendor invoices |

---

## 7. Functional Requirements

### 7.1 CRM — Student and Parent Management

The CRM module serves as the central repository for all student and parent profiles, managing the complete lifecycle from initial inquiry through active enrollment to alumni status. It provides a 360-degree view of each student, aggregating data from academic, financial, attendance, and communication modules.

| ID | Feature | Description |
|---|---|---|
| FR-CRM-01 | Student Profile Management | Create, update, and archive comprehensive student profiles including personal information, emergency contacts, medical notes, and academic history |
| FR-CRM-02 | Parent/Guardian Profiles | Maintain linked parent profiles with contact preferences, communication history, and portal access credentials |
| FR-CRM-03 | Student Lifecycle Tracking | Track status transitions: Prospect → Applicant → Enrolled → Active → Graduated / Withdrawn, with timestamps and officer attribution |
| FR-CRM-04 | 360-Degree Student View | Unified interface aggregating attendance, academic performance, fee status, behavioral notes, and communication history |
| FR-CRM-05 | Communication Log | Record all institutional communications (SMS, email, in-app) with timestamps and initiating officer attribution |
| FR-CRM-06 | Segmentation and Filtering | Advanced search allowing filtered views by campus, class, performance band, fee status, or custom criteria |
| FR-CRM-07 | Document Management | Attach and manage digital copies of admission forms, birth certificates, transfer certificates against student profiles |
| FR-CRM-08 | Inquiry Management | Capture and track prospective inquiries from all channels with follow-up task assignment and status tracking |
| FR-CRM-09 | Family Linkage | Link multiple student profiles within the same family for consolidated parent-facing views and family-level fee management |

---

### 7.2 Admissions and Enrollment Management

The Admissions module manages the end-to-end enrollment pipeline from initial inquiry through application submission, merit evaluation, offer issuance, fee deposit, and final enrollment confirmation.

| ID | Feature | Description |
|---|---|---|
| FR-ADM-01 | Online Application Portal | Applicants complete and submit enrollment applications via web portal with document upload capability |
| FR-ADM-02 | Application Pipeline Dashboard | Visual funnel view of all applications by stage: Inquiry, Applied, Under Review, Offered, Enrolled, Declined |
| FR-ADM-03 | Merit List Generation | Automated merit list computation based on configurable criteria (marks, entry test, quotas). PDF export |
| FR-ADM-04 | Seat Availability Management | Real-time seat tracking per campus, program, and section. Automatic wait-list management |
| FR-ADM-05 | Offer Letter Generation | Automated generation and email delivery of offer letters with enrollment deadline and fee instructions |
| FR-ADM-06 | Enrollment Confirmation | Enrollment confirmed upon fee deposit receipt, triggering profile activation and portal credential issuance |
| FR-ADM-07 | Transfer Applications | Manage inter-campus transfer requests with approvals, document verification, and academic record migration |
| FR-ADM-08 | Bulk Import | Support bulk enrollment data import via structured CSV/Excel templates for large cohort onboarding |
| FR-ADM-09 | Admissions Analytics | Conversion funnel analytics: inquiry-to-application rate, application-to-enrollment rate, campus-wise trends |

---

### 7.3 Procurement and Vendor Management

The Procurement module governs the institutional purchasing lifecycle from requisition to payment, ensuring compliance with approval hierarchies, budget controls, and vendor contractual obligations.

| ID | Feature | Description |
|---|---|---|
| FR-PRC-01 | Vendor Registry | Centralized vendor master with profiles, payment terms, approved categories, and performance ratings |
| FR-PRC-02 | Purchase Requisition | Digital requisition workflow with multi-level approval (HOD → Principal → Finance) based on value thresholds |
| FR-PRC-03 | Purchase Order Management | Automated PO generation from approved requisitions with version control and vendor delivery |
| FR-PRC-04 | Goods Receipt Note (GRN) | Digital GRN creation upon delivery with quantity verification against PO and inventory update trigger |
| FR-PRC-05 | Vendor Invoice Processing | Three-way match (PO, GRN, Invoice) verification before invoice approval |
| FR-PRC-06 | Budget Integration | Real-time budget utilization checks against departmental budgets before requisition approval |
| FR-PRC-07 | Vendor Performance Tracking | Scorecard tracking of on-time delivery, quality compliance, and invoice accuracy |
| FR-PRC-08 | Contract Management | Store and track vendor contracts with expiry alerts and renewal workflow |
| FR-PRC-09 | Procurement Analytics | Spend analysis by campus, category, vendor, and time period. Supplier concentration risk reporting |

---

### 7.4 Academic Operations

The Academic Operations module is the operational core of FAMS, managing timetabling, attendance, and examination administration across all campuses.

#### 7.4.1 Timetable Management

| ID | Feature | Description |
|---|---|---|
| FR-TT-01 | Automated Timetable Generation | Configurable engine generating weekly schedules based on teacher availability, subject load, room capacity, and section assignment |
| FR-TT-02 | Conflict Detection | Real-time prevention of teacher double-bookings, room conflicts, and student schedule overlaps |
| FR-TT-03 | Substitute Teacher Assignment | Workflow for assigning substitute teachers to absent teacher slots with one-click student notification |
| FR-TT-04 | Timetable Publishing | Campus-specific timetables published to teacher and student portals with printable PDF export |
| FR-TT-05 | Session Scheduling | Support for term/semester-based academic calendars with holiday and examination period blocking |

#### 7.4.2 Attendance Management

| ID | Feature | Description |
|---|---|---|
| FR-ATT-01 | Tablet-Based Attendance Capture | Teachers mark student attendance via tablet-optimized interface. No paper registers required |
| FR-ATT-02 | Real-Time Attendance Sync | Records synchronize to central database within seconds, immediately visible to parents and administrators |
| FR-ATT-03 | Staff Attendance Tracking | Daily staff check-in/check-out with late arrival and early departure flagging |
| FR-ATT-04 | Absence Alerts | Automated SMS/email notifications to parents upon student absence within the same session |
| FR-ATT-05 | Attendance Analytics | Daily, weekly, and monthly reports by student, class, section, subject, and campus |
| FR-ATT-06 | Leave Application Workflow | Students submit leave requests via portal. Teachers and principals approve with documentation attachment |
| FR-ATT-07 | Attendance-Based Eligibility | Configurable attendance thresholds for examination eligibility with automated eligibility reports |

#### 7.4.3 Examination Management

| ID | Feature | Description |
|---|---|---|
| FR-EXM-01 | Examination Scheduling | Create and publish examination timetables by term, subject, and section with room allocation |
| FR-EXM-02 | Admit Card Generation | Automated admit card generation and distribution via student portal with eligibility enforcement |
| FR-EXM-03 | Seating Plan Management | Automated seating plan generation for examination halls based on enrollment and hall capacity |
| FR-EXM-04 | Invigilator Assignment | Assign invigilators per examination session with conflict-of-interest checks against teaching assignments |
| FR-EXM-05 | Answer Script Tracking | Log and track answer script bundles from collection to marking to return |
| FR-EXM-06 | Examination Fee Management | Integrated with Finance module for examination fee invoicing and payment verification |

---

### 7.5 Results and Reporting

The Results module manages the complete academic assessment lifecycle from marks entry through result computation, grade card generation, and institutional performance reporting.

| ID | Feature | Description |
|---|---|---|
| FR-RES-01 | Marks Entry Interface | Teacher-facing marks entry by subject, assessment type, and student. Bulk import via structured templates |
| FR-RES-02 | Configurable Grading System | Support for percentage-based, GPA, and custom grading scales configured per program or campus |
| FR-RES-03 | Automated Result Computation | System computes final grades, aggregate scores, division classification, and pass/fail status |
| FR-RES-04 | Grade Card Generation | Automated production of individual grade cards in institutional format, available on student and parent portals |
| FR-RES-05 | Result Publishing Workflow | Multi-stage approval: Teacher submits → Coordinator verifies → Principal approves → Published |
| FR-RES-06 | Academic Progress Tracking | Longitudinal performance records across terms and academic years with trend visualization |
| FR-RES-07 | Class/Section Rank Computation | Automatic ranking of students within class and section based on aggregate scores |
| FR-RES-08 | Institutional Performance Reports | Cross-campus analytics: subject pass rates, grade distributions, teacher effectiveness proxies |
| FR-RES-09 | At-Risk Student Reports | Automated identification of students below passing threshold for timely intervention |
| FR-RES-10 | Result Notifications | Parents and students notified upon result publication via configured notification channels |

---

### 7.6 Accounting and Finance

The Accounting and Finance module provides comprehensive financial management covering fee collection, payroll processing, and financial reporting, integrated with payment gateways for online transactions.

#### 7.6.1 Fee Management

| ID | Feature | Description |
|---|---|---|
| FR-FEE-01 | Fee Structure Configuration | Define fee heads, amounts, due dates, and discounts per campus, program, and term |
| FR-FEE-02 | Automated Invoice Generation | System generates fee invoices for all enrolled students at each billing cycle without manual intervention |
| FR-FEE-03 | Multi-Channel Payment Collection | Accept payments via bank transfer, online payment gateway, and cash with receipt confirmation |
| FR-FEE-04 | Digital Receipt Issuance | Automatic digital receipt generation and delivery to portal upon payment confirmation |
| FR-FEE-05 | Defaulter Management | Automated overdue account identification with configurable escalation: reminder → late fee → access restriction |
| FR-FEE-06 | Concession and Scholarship Management | Manage merit-based, sibling, and need-based concessions with approval workflows and financial impact reporting |
| FR-FEE-07 | Fee Refund Processing | Structured refund workflow with approval routing, adjustment posting, and bank transfer initiation |
| FR-FEE-08 | Fee Collection Analytics | Daily, monthly, and annual dashboards by campus, program, and payment method. Outstanding liability reporting |

#### 7.6.2 Payroll Management

| ID | Feature | Description |
|---|---|---|
| FR-PAY-01 | Employee Payroll Setup | Configure salary components (basic, allowances, deductions, EOBI, income tax) per employee grade |
| FR-PAY-02 | Monthly Payroll Processing | Automated payroll computation incorporating attendance deductions, leave adjustments, and incremental changes |
| FR-PAY-03 | Payslip Generation | Digital payslip generation and delivery via employee portal upon payroll approval |
| FR-PAY-04 | Payroll Approval Workflow | HR prepares → Finance reviews → Principal/Director approves → Disbursement authorized |
| FR-PAY-05 | Tax and Statutory Compliance | Automated computation of income tax deductions and EOBI contributions per regulatory schedules |
| FR-PAY-06 | Payroll Analytics | Cost center-wise payroll analysis, headcount cost trends, and year-over-year salary expenditure reporting |

---

### 7.7 Human Resource Management

The HRM module manages the complete employee lifecycle from recruitment through offboarding, supporting all staff categories across all 31 campuses.

| ID | Feature | Description |
|---|---|---|
| FR-HRM-01 | Employee Master Records | Comprehensive digital personnel files: personal data, qualifications, employment history, and contracts |
| FR-HRM-02 | Recruitment Pipeline | Post vacancies, manage applications, schedule interviews, issue offer letters, and onboard new hires |
| FR-HRM-03 | Contract Management | Track employment contracts, probation periods, confirmation dates, and renewals with expiry alerts |
| FR-HRM-04 | Leave Management | Digital leave application, balance tracking, and multi-level approval. Support for annual, casual, medical, and maternity leave types |
| FR-HRM-05 | Staff Attendance Tracking | Daily attendance recording with late/early departure flagging and payroll integration for deductions |
| FR-HRM-06 | Performance Management | Annual appraisal workflows with configurable criteria, self-assessment, and principal/HOD review |
| FR-HRM-07 | Training and Development | Log completed training programs, certifications, and professional development per employee |
| FR-HRM-08 | Disciplinary Record Management | Document warnings, show-cause notices, and disciplinary actions with full audit trail |
| FR-HRM-09 | Separation Management | Process resignations, terminations, and retirements with clearance checklists and final settlement |
| FR-HRM-10 | Organizational Chart | Live auto-generated organizational chart reflecting current staff assignments by campus and department |
| FR-HRM-11 | HR Analytics | Headcount reports, turnover analysis, leave utilization rates, and staff qualification distribution |

---

### 7.8 Assets and Inventory Management

The Assets and Inventory module provides complete visibility and control over institutional fixed assets and consumable inventory across all campuses.

| ID | Feature | Description |
|---|---|---|
| FR-AST-01 | Asset Registry | Centralized register of all fixed assets with unique tags, location, custodian assignment, and acquisition details |
| FR-AST-02 | Asset Lifecycle Management | Track asset status: Active, Under Maintenance, Condemned, Disposed. Record maintenance events and costs |
| FR-AST-03 | Depreciation Tracking | Configurable straight-line and reducing balance depreciation schedules with automated annual posting |
| FR-AST-04 | Asset Allocation and Transfer | Workflow for allocating assets to staff/departments and transferring between campuses with custody chain documentation |
| FR-AST-05 | Inventory Stock Management | Real-time stock levels for consumables with configurable reorder point alerts triggering procurement requisitions |
| FR-AST-06 | Stock Issue and Return | Digital stock issue vouchers and return receipts with requisitioning department attribution |
| FR-AST-07 | Annual Asset Verification | System-guided verification workflow with physical count reconciliation and variance reporting |
| FR-AST-08 | Disposal Management | Structured write-off and disposal workflow with approval routing and auction/scrap record maintenance |
| FR-AST-09 | Asset Analytics | Asset utilization reports, depreciation schedules, maintenance cost analysis, and campus-wise valuation |

---

### 7.9 Cross-Cutting Platform Features

The following features are embedded throughout the FAMS platform, providing consistent enterprise-grade capabilities across all functional modules.

| ID | Feature | Description |
|---|---|---|
| FR-PLT-01 | Real-Time Analytics Dashboards | Executive and module-specific dashboards with live KPI tiles, trend charts (line, bar, pie, heat map), and exportable reports in PDF and Excel |
| FR-PLT-02 | AI Chatbot | NLP-based conversational assistant resolving Tier-1 queries (fee balances, exam schedules, results, timetables) with escalation routing |
| FR-PLT-03 | Notifications Engine | Event-driven system delivering SMS, email, and in-app alerts for 40+ defined trigger events across all modules |
| FR-PLT-04 | E-Learning Integration | SSO bridge to external LMS. Synchronize enrollment data, track completion, and surface progress within the FAMS student portal |
| FR-PLT-05 | Document Generation Engine | Template-driven generation of grade cards, fee receipts, offer letters, payslips, purchase orders, and asset labels |
| FR-PLT-06 | Multi-Campus Configuration | Campus-level configuration of academic calendars, fee structures, grading scales, and organizational hierarchies |
| FR-PLT-07 | Audit Trail and Activity Logging | Immutable log of all create, update, delete, and access events across every module, user, and campus |
| FR-PLT-08 | Role-Based Access Control | Granular permission management at module, feature, and data-record levels. All access changes require administrator authorization |
| FR-PLT-09 | Bulk Operations | Bulk data import, export, and update capabilities across all modules for high-volume administrative workflows |
| FR-PLT-10 | Offline-Capable Attendance | Attendance data captured on tablets queued locally when offline and synchronized automatically upon reconnection |

---

## 8. Non-Functional Requirements

Non-functional requirements define the quality attributes that FAMS must exhibit in addition to its functional capabilities. These requirements govern performance, reliability, security, maintainability, and usability and are **binding** on the development and infrastructure teams.

| ID | Category | Attribute | Requirement |
|---|---|---|---|
| NFR-01 | Performance | Web portal response time | Page load under **2 seconds** (10 Mbps). API 95th-percentile response under **500 ms** |
| NFR-02 | Performance | Concurrent user load | Minimum **5,000 concurrent** authenticated sessions without performance degradation |
| NFR-03 | Availability | Uptime SLA | **99.9% availability** — maximum 8.7 hours unplanned downtime per year |
| NFR-04 | Availability | Planned maintenance | Scheduled windows ≤ 4 hours/month, outside peak hours (06:00–22:00 PKT) |
| NFR-05 | Reliability | Data backup | Automated daily backups. **90-day retention**. RTO: 4 hours. RPO: 24 hours |
| NFR-06 | Reliability | Failover | Automatic failover to secondary infrastructure; service restoration within **15 minutes** |
| NFR-07 | Scalability | Horizontal scaling | Application tier auto-scales to accommodate peak loads up to **3× baseline** |
| NFR-08 | Scalability | Data growth | Database supports growth to **10 million records** without architectural changes |
| NFR-09 | Security | Authentication | **MFA mandatory** for all administrator and principal accounts. Password complexity enforced |
| NFR-10 | Security | Data encryption | **AES-256** at rest. **TLS 1.3** in transit. No plaintext PII transmission |
| NFR-11 | Security | Session management | Idle timeout: **30 min** (staff), **60 min** (student/parent). Re-auth for sensitive operations |
| NFR-12 | Usability | Browser compatibility | Full support on latest 2 versions of Chrome, Firefox, Safari, Edge. Responsive ≥ **768px** |
| NFR-13 | Usability | Accessibility | **WCAG 2.1 Level AA** compliance for all portal pages |
| NFR-14 | Maintainability | Code quality | Minimum **80% unit test coverage**. CI/CD with zero-downtime deployments for patches |
| NFR-15 | Compliance | Data privacy | Compliance with applicable **Pakistani data protection regulations** |
| NFR-16 | Audit | Log retention | All system and user activity logs retained for minimum **5 years** in tamper-evident storage |

---

## 9. System Architecture

FAMS is built on a modern multi-tier, microservices-influenced architecture designed for cloud deployment. The architecture prioritizes separation of concerns, independent deployability of modules, horizontal scalability, and data security.

### 9.1 Presentation Layer

The presentation layer consists of a single-page web application (SPA) built using **React.js**, served via a global CDN ensuring fast load times for all campus locations. The UI is fully responsive, supporting desktop, laptop, and tablet viewports. The tablet attendance interface is developed as a **progressive web application (PWA)** to support offline operation and local data queuing. Role-based rendering ensures each authenticated user sees only modules and data elements relevant to their role. All API calls are authenticated via **JSON Web Tokens (JWT)** with short expiry windows and refresh token rotation.

### 9.2 API Gateway Layer

All client requests pass through a centralized **API Gateway** handling authentication token validation, rate limiting, request routing to downstream services, and response aggregation. The gateway exposes a versioned RESTful API (v1, v2, etc.) to maintain backward compatibility across client upgrades and provides a single ingress point for all API traffic, simplifying security enforcement and traffic monitoring.

### 9.3 Application Layer

The application layer is decomposed into domain-aligned service groups corresponding to the eight FAMS functional modules plus shared services (notifications, document generation, AI chatbot, analytics). Each service group is independently deployable and horizontally scalable. Services communicate synchronously via HTTP/REST for user-facing operations and asynchronously via a **message broker** for event-driven workflows such as notification dispatch and audit logging.

### 9.4 Data Layer

The primary data store is a **PostgreSQL** relational database with automated replication, failover, and point-in-time recovery. Multi-campus data isolation is enforced through **row-level security (RLS)** with `campus_id` as the discriminator column across all tenant-scoped tables. A **Redis** cache layer handles session storage and high-frequency read operations. A **cloud object store (S3-compatible)** holds all binary assets including uploaded documents, generated PDFs, and report exports.

### 9.5 Infrastructure Layer

The platform is deployed in a **multi-availability-zone** configuration. Application containers are orchestrated using **Docker / Kubernetes** with horizontal pod autoscaling (HPA) tied to CPU utilization and request queue depth metrics. Infrastructure-as-code (**Terraform**) is used for all environment provisioning. All external traffic is routed through a **Web Application Firewall (WAF)** providing protection against OWASP Top 10 vulnerabilities.

---

## 10. Data Flow and Integration

### 10.1 Internal Data Flows

| ID | Flow | Description |
|---|---|---|
| DF-INT-01 | Admissions → CRM | Enrollment confirmation triggers creation of full student profile and portal credential provisioning |
| DF-INT-02 | Admissions → Finance | Enrollment confirmation triggers student fee account creation and first-term invoice generation |
| DF-INT-03 | Attendance → Results | Attendance records feed examination eligibility computation, enforcing minimum attendance thresholds |
| DF-INT-04 | Attendance → Finance | Approved leave and attendance data feed payroll for leave-without-pay deductions |
| DF-INT-05 | HR → Finance | Employee profile data from HRM feeds the payroll processing engine |
| DF-INT-06 | Procurement → Finance | Approved vendor invoices generate financial liability entries and trigger payment authorization |
| DF-INT-07 | Procurement → Assets | Goods receipt confirmations for capital assets trigger asset registration entries |
| DF-INT-08 | Results → CRM | Published result data appended to student CRM profile for longitudinal academic history |
| DF-INT-09 | All Modules → Notify | Defined system events trigger the Notifications Engine to dispatch SMS, email, or in-app alerts |
| DF-INT-10 | All Modules → Analytics | All transactional events stream to the Analytics layer for real-time dashboard updates |

### 10.2 External Integrations

| ID | Integration | Protocol | Direction & Description |
|---|---|---|---|
| INT-EXT-01 | Payment Gateway | REST API | Bi-directional — FAMS sends payment requests and receives real-time confirmation webhooks |
| INT-EXT-02 | SMS Gateway | REST API | Outbound — Transactional SMS notifications. Delivery receipts logged |
| INT-EXT-03 | Email Service | SMTP / API | Outbound — Transactional emails: receipts, result notifications, offer letters, payslips |
| INT-EXT-04 | Learning Management System | REST API + SSO | Bi-directional — FAMS pushes enrollment/class data; pulls e-learning completion status |
| INT-EXT-05 | Exam Board (Phase 2) | REST API | Outbound — Registration and result data submission to external examination bodies |
| INT-EXT-06 | Biometric Devices | Device SDK | Inbound — Optional integration for staff biometric check-in/check-out data ingestion |

---

## 11. Security and Compliance

Security is treated as a first-class system attribute in FAMS. The platform implements a **defense-in-depth security model** spanning identity management, data protection, network security, and application-level controls.

### 11.1 Identity and Access Management

- Multi-factor authentication (MFA) is mandatory for all administrative roles
- Single sign-on (SSO) is supported via **SAML 2.0** for institutional identity provider integration
- All accounts are subject to the **principle of least privilege** enforced at provisioning
- Dormant accounts are automatically suspended after **90 days** of inactivity

### 11.2 Data Encryption

- **AES-256** encryption applied for all data at rest
- **TLS 1.3** enforced for all data in transit between clients, the API gateway, and backend services
- Database backups are encrypted before storage
- Encryption keys managed via a cloud-native KMS with automatic rotation policies

### 11.3 Application Security

- Platform developed in compliance with **OWASP Application Security Verification Standard (ASVS) Level 2**
- Automated **SAST** and **DAST** scans integrated into the CI/CD pipeline
- Independent third-party penetration testing conducted before production deployment and annually thereafter

### 11.4 Network Security

- All inbound public traffic routed through a **WAF**
- Backend services deployed in private subnets with no direct public internet exposure
- Security group rules enforce deny-by-default ingress policies
- **DDoS protection** active at CDN and load balancer tiers

### 11.5 Audit and Logging

- Immutable audit log records every authenticated user action — data read, create, update, and delete events — with timestamps, user identity, IP address, and affected record identifiers
- Logs stored in tamper-evident storage with a minimum **5-year retention**
- Anomalous access patterns trigger automated security alerts

### 11.6 Data Privacy and Compliance

- FAMS complies with applicable **Pakistani data protection frameworks**
- PII is pseudonymized in non-production environments
- Data subject access and deletion request workflows are provided
- Data sharing with third parties is governed by explicit data processing agreements

---

## 12. Scalability Considerations

FAMS is architected to scale both **horizontally** (additional compute nodes) and **vertically** (increased node capacity) in response to institutional growth and demand variability.

### 12.1 Campus Growth

The multi-tenant architecture supports the addition of new campuses without schema changes or application redeployment. A new campus is provisioned through an administrative configuration workflow. The system is certified to support up to **100 campuses** under the current architecture without performance impact.

### 12.2 User Volume Growth

HPA policies automatically provision additional application instances when CPU utilization or request queue depth exceeds defined thresholds. Load testing benchmarks must validate the system at **3× projected peak concurrent user volume** before go-live.

### 12.3 Data Volume Growth

PostgreSQL is deployed with **read replicas** to distribute query load. Partitioning by `campus_id` and academic year is implemented for high-volume tables. Archive policies move records older than 7 years to cold storage while maintaining query accessibility.

### 12.4 Module Extensibility

The modular architecture allows new functional modules to be developed and deployed independently without impacting existing modules. The API Gateway routing configuration and shared authentication service ensure new modules are immediately accessible upon deployment.

### 12.5 Integration Scalability

The event-driven messaging architecture ensures increases in event volume do not create cascading latency in notification and analytics pipelines. Message broker capacity scales independently of the application tier.

---

## 13. Risks and Assumptions

### 13.1 Project Assumptions

- Falcon College will designate a dedicated Product Owner and steering committee with authority to make product decisions within agreed timelines
- All 31 campuses have adequate internet connectivity (minimum **10 Mbps** dedicated broadband) to support web application access and real-time synchronization
- The client will provide access to existing data in structured format for migration and assign a data owner for each module
- Tablet hardware for the attendance system will be procured, configured, and deployed by the client's IT team to RaideIT's hardware specification
- The external LMS for e-learning integration has a publicly documented REST API and will be provisioned before the integration sprint begins
- Content for the AI chatbot knowledge base (FAQs, institutional policies, process guides) will be provided by the client in structured format
- The client accepts that UX design will follow RaideIT's established design system; custom branding is limited to logo, color scheme, and typography

### 13.2 Risk Register

| ID | Risk | Probability | Impact | Description | Mitigation |
|---|---|---|---|---|---|
| R-01 | Data Migration Complexity | High | High | Legacy data in inconsistent formats may extend migration timelines | Data audit in discovery phase. Define acceptance criteria. Dedicated migration sprint with rollback plan |
| R-02 | Campus Connectivity Variance | High | Medium | Inadequate connectivity at some campuses may degrade application performance | Connectivity audit pre-deployment. Offline PWA for attendance. Minimum connectivity standard in infrastructure SLA |
| R-03 | Stakeholder Adoption Resistance | Medium | High | Staff accustomed to legacy processes may resist platform adoption | Phased rollout with pilot campuses. Structured change management and end-user training programs |
| R-04 | Scope Creep | High | Medium | Incremental feature additions may inflate scope and delay delivery | Strict change control. All scope changes require formal CR with impact assessment and steering committee approval |
| R-05 | Third-Party API Instability | Medium | Low | Payment gateway or SMS provider changes or outages may disrupt integrated services | Select tier-1 providers with SLAs. Implement graceful degradation. Maintain fallback provider configurations |
| R-06 | Regulatory Change | Low | High | Changes to Pakistani data protection legislation may require platform modifications | Privacy-by-design architecture. Monitor regulatory developments. Annual compliance review |
| R-07 | Key Personnel Dependency | Medium | Medium | Dependency on specific team members may create delivery risk | Enforce documentation standards and knowledge sharing. Cross-train team members on critical modules |

---

## 14. Technology Stack — .NET Core Edition

> **Framework Decision:** ASP.NET Core 8 (.NET 8) is selected as the backend framework. The PRD §9.3 references Node.js/Python. ASP.NET Core 8 is substituted because C# provides stronger typing for complex financial logic (payroll, EOBI, tax, depreciation), built-in Identity covers MFA/RBAC/SAML SSO without additional dependencies, and QuestPDF enables professional document generation at zero license cost. All other PRD-specified components — React.js, PostgreSQL, Redis, S3-compatible storage, JWT auth, and PWA — remain unchanged.

### 14.1 Frontend — Presentation Layer

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **React.js 18 + Vite** | SPA with 10 role-based portals. Vite for fast builds | PRD §9.1 spec |
| **TypeScript** | Type-safe frontend development. Matches C# backend typing | All modules |
| **Tailwind CSS** | Utility-first styling. Rapid ERP UI development | NFR-12 (responsive ≥ 768px) |
| **shadcn/ui** | Accessible component library. WCAG-compliant by default | NFR-13 (WCAG 2.1 AA) |
| **React Router v6** | Client-side routing with role-based route guards and lazy loading | All portals |
| **TanStack Query** | Server state management. Auto-refetch, caching, optimistic updates | FR-PLT-01 |
| **Recharts / ApexCharts** | Live KPI tiles, trend lines, heat maps for executive dashboards | FR-PLT-01 |
| **Axios + interceptors** | HTTP client. JWT injection, refresh token rotation on 401 | PRD §9.1 |
| **PWA (Workbox)** | Offline tablet attendance module | FR-PLT-10, PRD §9.1 |
| **IndexedDB (Dexie.js)** | Local offline data store for pending attendance records | FR-PLT-10 |
| **Background Sync API** | Auto-sync queued attendance data on reconnect | FR-PLT-10 |

---

### 14.2 API Gateway and Communication

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **YARP Reverse Proxy** | .NET-native API gateway — JWT validation, rate limiting, routing. Runs inside ASP.NET Core pipeline | PRD §9.2 |
| **ASP.NET Core JWT Bearer** | Token validation. Short-lived access tokens, refresh rotation | PRD §9.1 |
| **ASP.NET SignalR** | Real-time push for live dashboard updates and attendance sync (≤ 5s latency) | PRD §3.3, FR-ATT-02 |
| **API Versioning (Asp.Versioning)** | Versioned RESTful API (v1, v2) for backward compatibility | PRD §9.2 |
| **Rate Limiting Middleware** | Built into ASP.NET Core 7+. Abuse prevention per endpoint | NFR-01, NFR-02 |

---

### 14.3 Backend — Application Layer

#### Core Framework

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **ASP.NET Core 8 Web API** | Primary backend framework. Cross-platform, high-performance | PRD §9.3 |
| **C# 12** | Backend language. Strong typing for financial computation, exact decimal math | FR-PAY, FR-FEE |
| **Clean Architecture** | Domain → Application → Infrastructure → API layers. Testable, maintainable | PRD §12.4 |
| **CQRS + MediatR** | Separates read (queries) from write (commands). Optimise each independently | All 8 modules |
| **FluentValidation** | Strongly-typed validation rules for all 8 module API inputs | All modules |
| **AutoMapper** | DTO ↔ domain entity mapping | All modules |

#### Document Generation

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **QuestPDF** | PDF generation — grade cards, payslips, offer letters, POs, fee receipts. Free & open-source | FR-PLT-05 |
| **ClosedXML** | Excel report generation and bulk data import/export | FR-PLT-01, FR-PLT-09 |

#### Background Processing

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **Hangfire** | Job scheduler — payroll batch runs, PDF generation, notification dispatch | FR-PAY-02, FR-PLT-03 |
| **Hangfire PostgreSQL Storage** | Persistent job store — jobs survive restarts. Uses same Postgres instance | NFR-05 |
| **Hangfire Dashboard** | Built-in web UI to monitor job status, retry failures, view logs | Ops |

#### Supporting Libraries

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **Decimal type (C#)** | Exact decimal math for financial computations. No floating-point errors | FR-PAY, FR-FEE |
| **NodaTime** | PKT timezone handling for attendance, session timeouts, reports | NFR-11, FR-ATT |
| **Polly** | Retry + circuit breaker for payment gateway, SMS, LMS API calls | R-05 mitigation |
| **StackExchange.Redis** | Redis client for sessions, distributed cache, Hangfire backing store | PRD §9.4 |
| **MailKit** | Transactional emails — receipts, results, offer letters, payslips | INT-EXT-03 |

---

### 14.4 Data Layer

#### Primary Database

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **PostgreSQL 16** | Primary relational database. RLS for campus_id isolation | PRD §9.4 |
| **Entity Framework Core 8** | .NET ORM. Code-first migrations, LINQ queries, Npgsql driver | PRD §9.4 |
| **Npgsql** | Official .NET PostgreSQL driver. Supports RLS, JSONB, arrays | PRD §9.4 |
| **Dapper** | Lightweight ORM for complex cross-campus analytics SQL alongside EF Core | FR-RES-08, FR-PLT-01 |
| **pg_partman** | Table partitioning by campus_id + academic_year for high-volume tables | PRD §12.3, NFR-08 |

#### Cache and File Storage

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **Redis 7** | Cache + session store. Hot data, sessions, Hangfire queue | PRD §9.4 |
| **MinIO (local)** | S3-compatible object storage for local deployment. Stores PDFs, docs, exports | PRD §9.4 |
| **AWS S3 (live)** | Same S3 API as MinIO. Zero code changes when switching local to live | PRD §9.4 |
| **pg_dump + Barman** | Automated daily backups, 90-day retention, encrypted at rest | NFR-05 |

> **Multi-Campus Isolation:** Campus-level data isolation is enforced via PostgreSQL Row-Level Security (RLS) with `campus_id` as the discriminator column. Every tenant-scoped table has an RLS policy. EF Core global query filters are set per-request based on the authenticated user's campus scope.

---

### 14.5 Authentication, Security and Compliance

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **ASP.NET Core Identity** | User management, password hashing, role store for all 10 FAMS roles | NFR-09 |
| **JWT Bearer Auth** | Short-lived access tokens + refresh token rotation | PRD §9.1 |
| **TOTP MFA (built-in)** | ASP.NET Core Identity has TOTP MFA built in. Mandatory for admins + principals | NFR-09 |
| **Policy-based RBAC** | ASP.NET Core authorization policies. Campus-scoped, module-level permissions | NFR-09, FR-PLT-08 |
| **Sustainsys.Saml2** | SAML 2.0 SSO for institutional identity provider integration | PRD §11.1 |
| **AES-256 (pgcrypto / TDE)** | Data at rest encryption for PostgreSQL | NFR-10 |
| **TLS 1.3 via YARP** | Self-signed cert locally; Let's Encrypt when live | NFR-10 |
| **MinIO / S3 server-side encryption** | File storage AES-256 encryption | NFR-10 |
| **Audit.NET** | Hooks into EF Core. Captures every CRUD event with user, IP, timestamp | NFR-16, FR-PLT-07 |
| **SonarQube** | SAST — static code analysis in CI pipeline | NFR-14, PRD §11.3 |
| **OWASP ZAP** | DAST — automated security scan against staging environment | PRD §11.3 |

---

### 14.6 External Integrations

| Integration | Technology | Protocol | PRD Reference |
|---|---|---|---|
| **AI Chatbot** | Anthropic Claude API | REST (HttpClient) | FR-PLT-02 |
| **Payment Gateway** | JazzCash / Easypaisa REST API | REST + Webhooks | INT-EXT-01 |
| **SMS Notifications** | Twilio SDK / Jazz SMS REST | REST | INT-EXT-02 |
| **Email Service** | MailKit / SendGrid | SMTP / REST | INT-EXT-03 |
| **E-Learning LMS** | Moodle REST API + OAuth2 SSO | REST + OAuth2 | INT-EXT-04 |
| **Biometric Devices** | Device SDK integration | SDK / Serial | INT-EXT-06 |
| **All External APIs** | Polly resilience library | — | R-05 mitigation |

> **Pakistan-Specific:** JazzCash and Easypaisa are the dominant payment service providers in Pakistan. For SMS, Twilio provides an official .NET SDK; Jazz (Mobilink) SMS REST API is the local Pakistan alternative.

---

### 14.7 Testing and Quality Assurance

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **xUnit** | Unit testing framework — standard for .NET | NFR-14 (80% coverage) |
| **Moq** | Mocking library for repositories, services, external APIs | NFR-14 |
| **FluentAssertions** | Readable test assertions. Improves test maintenance | NFR-14 |
| **Testcontainers + WebApplicationFactory** | Real Postgres + Redis in Docker for integration tests — no mocking the DB | NFR-14 |
| **SonarQube / SonarCloud** | SAST + code coverage gate at 80% | NFR-14, PRD §11.3 |
| **OWASP ZAP** | DAST automated in CI against staging | PRD §11.3 |
| **k6** | Load testing — validates 5,000 concurrent sessions before go-live | NFR-02 |
| **Playwright** | End-to-end browser automation for critical user flows | NFR-12, NFR-13 |
| **axe-core** | Automated accessibility testing in CI | NFR-13 (WCAG 2.1 AA) |

---

### 14.8 DevOps — Local Now, Cloud-Ready Later

#### Containerisation and Local Deployment

| Technology | Purpose | Notes |
|---|---|---|
| **Docker** | All services containerised | Identical images run locally and on cloud |
| **Docker Compose** | Local orchestration | Single `docker compose up` starts: ASP.NET API, React, PostgreSQL, Redis, MinIO, YARP |
| **Multi-stage Dockerfile** | Optimised .NET image | Build stage (SDK) + runtime stage (ASP.NET runtime). ~200MB final image |

#### CI/CD Pipeline

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **GitHub Actions** | Build → test → SAST → containerise → deploy. Zero-downtime rolling deploy | NFR-14 |
| **Docker Hub / GHCR** | Container registry. Tag by branch + git SHA | Deployment |
| **Terraform** | Infrastructure as code. Provision cloud resources | PRD §9.5 |

#### Observability

| Technology | Purpose | PRD / NFR Reference |
|---|---|---|
| **Serilog** | Structured JSON logging across all modules. Sinks: console, Seq, Azure Monitor | PRD §11.5 |
| **Seq** | Searchable log UI for local development. Free for single node | Ops |
| **Prometheus + ASP.NET metrics** | ASP.NET Core exposes `/metrics` natively. No extra library | NFR-03 |
| **Grafana** | Uptime, latency, error rates, DB query times | NFR-03 (99.9% SLA) |
| **Application Insights** | Full distributed tracing when deployed to Azure | NFR-03 |

#### Deployment Path

```
Phase 1 — Local
└── docker compose up
    ├── ASP.NET Core 8 API
    ├── React SPA (Vite)
    ├── PostgreSQL 16
    ├── Redis 7
    ├── MinIO (object storage)
    └── YARP (reverse proxy / gateway)

Phase 2 — Cloud (Azure recommended for .NET)
└── Same Docker images →
    ├── Azure App Service / Azure Container Apps
    ├── Azure Database for PostgreSQL (managed)
    ├── Azure Cache for Redis (managed)
    ├── Azure Blob Storage (S3-compatible, replaces MinIO)
    └── Azure CDN (React SPA delivery)

Phase 3 — Scale
└── Azure Kubernetes Service (AKS)
    ├── Horizontal Pod Autoscaling (HPA) — NFR-07 (3× peak)
    ├── Azure Active Directory SSO — PRD §11.1
    └── Application Insights full tracing
```

> **Why Azure for .NET:** Microsoft Azure provides first-class .NET support — managed ASP.NET Core runtimes, native Application Insights telemetry, Azure Active Directory for SAML 2.0 SSO, and GitHub Actions pipelines with built-in .NET build agents.

---

### 14.9 NFR-to-Technology Mapping

| NFR ID | Requirement | Technology Solution |
|---|---|---|
| NFR-01 | Page load < 2s, API p95 < 500ms | Vite-bundled React SPA + CDN. ASP.NET Core Kestrel + Redis cache for sub-100ms responses |
| NFR-02 | 5,000 concurrent sessions | ASP.NET Core async/non-blocking. Kestrel high-concurrency. Redis session offload. k6 validation |
| NFR-03 | 99.9% uptime SLA | Docker restarts on failure. Azure multi-AZ. Grafana + Prometheus alerting. Barman failover |
| NFR-04 | Planned maintenance ≤ 4h/month | Rolling deployment via GitHub Actions. Zero-downtime patches |
| NFR-05 | Daily backups, 90-day retention, RTO 4h | pg_dump via cron + Barman. MinIO/S3 versioning. Encrypted at rest |
| NFR-06 | Failover within 15 minutes | Docker Compose restarts + Azure health probes. Barman point-in-time recovery |
| NFR-07 | Auto-scale 3× baseline | Azure Container Apps / AKS HPA scales .NET pods on CPU + queue depth |
| NFR-08 | 10M records, no arch change | PostgreSQL partitioning by campus_id + academic_year. Read replicas. Dapper for analytics |
| NFR-09 | MFA mandatory for admins | ASP.NET Core Identity TOTP MFA. Policy-based RBAC. Principle of least privilege |
| NFR-10 | AES-256 at rest, TLS 1.3 | PostgreSQL pgcrypto/TDE. TLS 1.3 via YARP + Let's Encrypt. MinIO server-side encryption |
| NFR-11 | Session timeouts 30/60 min | ASP.NET Core JWT expiry. Refresh token rotation. Re-auth middleware for sensitive operations |
| NFR-12 | Browser compatibility, ≥ 768px | React + Tailwind responsive. Playwright E2E on Chrome, Firefox, Safari, Edge |
| NFR-13 | WCAG 2.1 Level AA | shadcn/ui WCAG-compliant components. axe-core automated accessibility tests in CI |
| NFR-14 | 80% unit test, zero-downtime CI/CD | xUnit + Moq + FluentAssertions. SonarQube quality gate. GitHub Actions rolling deployment |
| NFR-15 | Pakistani data protection | Privacy-by-design. PII pseudonymised in non-production. Data subject request workflows |
| NFR-16 | 5-year immutable audit logs | Audit.NET hooks into EF Core. Append-only audit table + cold storage archive |

---

### 14.10 Complete Stack Quick Reference

| Technology | Layer | Purpose | PRD/NFR |
|---|---|---|---|
| React.js 18 + Vite + TypeScript | Frontend | SPA role-based portals | PRD §9.1 |
| Tailwind CSS + shadcn/ui | Frontend | Styling + accessible components | NFR-12, NFR-13 |
| PWA (Workbox + IndexedDB) | Frontend | Offline tablet attendance | FR-PLT-10 |
| Recharts / ApexCharts | Frontend | Dashboard charts | FR-PLT-01 |
| YARP Reverse Proxy | API Gateway | Rate limiting, routing, JWT validation | PRD §9.2 |
| ASP.NET SignalR | API Gateway | Real-time push | FR-ATT-02 |
| ASP.NET Core 8 Web API (C# 12) | Backend | Core business logic | PRD §9.3 |
| Clean Architecture + CQRS + MediatR | Backend | Application pattern | PRD §12.4 |
| FluentValidation + AutoMapper | Backend | Validation + mapping | All modules |
| QuestPDF | Backend | PDF generation | FR-PLT-05 |
| ClosedXML / EPPlus | Backend | Excel import/export | FR-PLT-09 |
| Hangfire | Backend | Background job scheduler | Payroll, notifications |
| PostgreSQL 16 | Data | Primary database | PRD §9.4 |
| Entity Framework Core 8 + Npgsql | Data | .NET ORM | PRD §9.4 |
| Dapper | Data | Complex reporting SQL | FR-PLT-01 |
| Redis 7 + StackExchange.Redis | Data | Cache + session store | PRD §9.4 |
| MinIO (local) / AWS S3 (live) | Data | Object file storage | PRD §9.4 |
| ASP.NET Core Identity + JWT | Security | Auth + user management | PRD §9.1, NFR-09 |
| TOTP MFA (built-in) | Security | Multi-factor auth | NFR-09 |
| Policy-based RBAC | Security | Role permissions | FR-PLT-08 |
| Sustainsys.Saml2 | Security | SSO — SAML 2.0 | PRD §11.1 |
| Audit.NET | Security | Immutable audit log | NFR-16, FR-PLT-07 |
| Anthropic Claude API | Integration | AI chatbot | FR-PLT-02 |
| JazzCash / Easypaisa REST | Integration | Payment gateway | INT-EXT-01 |
| Twilio / Jazz SMS API | Integration | SMS notifications | INT-EXT-02 |
| MailKit / SendGrid | Integration | Email service | INT-EXT-03 |
| Moodle LMS REST + OAuth2 | Integration | E-learning bridge | INT-EXT-04 |
| Polly | Integration | Resilience + retry | R-05 mitigation |
| xUnit + Moq + FluentAssertions | Testing | Unit + integration tests | NFR-14 |
| Testcontainers + WebApplicationFactory | Testing | Full-stack integration testing | NFR-14 |
| k6 | Testing | Load testing | NFR-02 |
| Playwright | Testing | End-to-end testing | NFR-12, NFR-13 |
| axe-core | Testing | Accessibility testing | NFR-13 |
| SonarQube / SonarCloud | Testing | SAST + code coverage gate | NFR-14, PRD §11.3 |
| OWASP ZAP | Testing | DAST security scan | PRD §11.3 |
| Docker + Docker Compose | DevOps | Containerisation + local deploy | All |
| GitHub Actions CI/CD | DevOps | Build + deploy pipeline | NFR-14 |
| Serilog + Seq | DevOps | Structured logging | PRD §11.5 |
| Prometheus + Grafana | DevOps | Metrics + monitoring | NFR-03 |
| Application Insights | DevOps | APM (Azure live) | NFR-03 |
| pg_dump + Barman | DevOps | Database backups | NFR-05 |
| Terraform | DevOps | Infrastructure as code | PRD §9.5 |
| Azure App Service / AKS | Cloud | Cloud hosting | NFR-07, PRD §9.5 |

---

## 15. Technology Decision Rationale

### 15.1 Why ASP.NET Core 8 Over Node.js

The PRD §9.3 references Node.js / Python. ASP.NET Core 8 is selected instead for the following reasons:

| Concern | Node.js Issue | ASP.NET Core 8 Advantage |
|---|---|---|
| Financial accuracy | JavaScript `number` type causes float rounding errors | C# `decimal` type is exact — critical for payroll, EOBI, tax, depreciation |
| Type safety | Dynamic typing increases runtime errors in complex domain logic | C# 12 strong typing catches integration bugs at compile time |
| Auth built-in | Requires third-party libraries (Passport.js, etc.) | ASP.NET Core Identity covers MFA, RBAC, SAML SSO out of the box |
| PDF generation | Requires external services or fragile libraries | QuestPDF — fully C#, free, open-source, professional output |
| Enterprise ecosystem | Ecosystem varies in maturity | EF Core, Hangfire, Audit.NET, MediatR are production-proven with Microsoft backing |
| Performance | Good for I/O-bound; GC pressure at scale | ASP.NET Core benchmarks among top 3 frameworks globally |

### 15.2 Why Modular Monolith Over Microservices

FAMS starts as a **modular monolith** — eight domain modules in one deployable unit:

- **Simpler local deployment:** one Docker Compose file, one process, easier for client IT team to operate
- **Lower DevOps complexity:** no service mesh, no distributed tracing setup, no inter-service networking issues
- **PRD §12.4 compliance:** module boundaries are already correctly defined for future extraction into microservices when scale demands it
- **Migration path:** any module can be extracted to an independent service by moving its code to a new project and replacing in-process MediatR calls with HTTP/gRPC calls — no business logic rewrite

### 15.3 Technology Decisions — Risk Mitigations

| PRD Risk | Technology Mitigation |
|---|---|
| R-01: Data migration complexity | Dedicated .NET ETL scripts using EF Core + ClosedXML for CSV/Excel import |
| R-02: Campus connectivity variance | PWA offline attendance (Workbox + IndexedDB) queues data during outages |
| R-03: Stakeholder adoption resistance | Role-based portals with minimal learning curve. React SPA is web-standard |
| R-04: Scope creep | Clean Architecture module boundaries prevent unplanned feature bleed |
| R-05: Third-party API instability | Polly retry + circuit breaker on all external API calls. Graceful degradation |
| R-06: Regulatory change | Privacy-by-design. PII pseudonymisation. Data subject request workflows ready to extend |
| R-07: Key personnel dependency | Clean Architecture + CQRS enforces consistent patterns. Easy for new developers to onboard |

---

## 16. Conclusion

This document represents the complete, authoritative specification for the Falcon Academic Management System (FAMS) — covering the full product requirements, all functional and non-functional specifications, system architecture, data flows, security model, scalability considerations, risk register, and the complete .NET Core technology stack.

FAMS addresses a critical institutional need: consolidation of fragmented, campus-level administrative operations into a unified, centrally governed digital ecosystem. By delivering a single platform spanning CRM, Admissions, Procurement, Academic Operations, Results and Reporting, Finance, HRM, and Asset Management, FAMS enables Falcon College to operate with greater efficiency, data accuracy, and service quality across every campus and every stakeholder touchpoint.

The .NET Core technology stack — built on ASP.NET Core 8, PostgreSQL, Redis, React.js, and Docker — is specifically selected to handle FAMS's complex financial computation requirements, enterprise-grade security mandates, and the unique constraint of needing to run locally on institutional hardware while remaining fully cloud-ready for future deployment on Azure or AWS.

The platform's commitment to real-time data synchronization, AI-augmented support, tablet-based operational workflows, and fully paperless transactional processes positions Falcon College at the forefront of institutional digital maturity. The architecture is designed to accommodate future technology investments without architectural debt.

---

> *This document is the proprietary and confidential property of Mehboob.mov. Unauthorized reproduction, distribution, or disclosure is strictly prohibited. © 2026 Mehboob.mov / RaideIT Software Solutions. All rights reserved.*
