# TODO / Roadmap

## Short-Term Objectives
- [ ] **CSV Bulk Upload Framework**: Implement bulk CSV importing for all master data entities.
    - Hook up `ValidationService.validateBatch()` to allow for "Partial Acceptance" of bulk uploads (saving valid rows while logging errors for invalid rows).
- [ ] **Comprehensive System Testing**: Perform end-to-end system testing on the completed PIM entities and multi-tenant constraints.

## Medium-Term Objectives
- [ ] **Product Attributes Expansion**: Expand the JSON schemas and backend data modeling to support dynamic, multi-lingual Product Attributes.
- [ ] **Export & Syndication**: Create outbound endpoints and jobs for extracting formatted product catalogs.
- [ ] **UI Notifications**: Implement robust, future-ready UI notification systems for successful saves, validation errors, and bulk upload feedback.

## Long-Term Objectives
- [ ] **Multilingual Support**: Ensure all entity descriptions, product variants, and UI notifications natively support localization.
- [ ] **Reporting & Analytics**: Dashboards for tenant usage, product catalog health, and audit trail metrics.
