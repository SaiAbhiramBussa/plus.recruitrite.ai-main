## Data Model (ERD)

High-level relationships across primary entities.

```mermaid
erDiagram
  USER ||--o{ COMPANY : created_by
  USER ||--o{ COMPANY : updated_by
  USER ||--o{ CANDIDATE : created_by
  USER ||--o{ CANDIDATE : updated_by
  USER ||--o{ CONVERSATION_THREAD : employer_user
  USER ||--o{ CONVERSATION_THREAD : candidate_user

  COMPANY ||--o{ LOCATION : has
  COMPANY ||--o{ INTEGRATION_KEY : has
  COMPANY ||--o{ JOB_POSTING : posts

  INDUSTRY ||--o{ COMPANY : categorized
  INDUSTRY ||--o{ CANDIDATE : experience_in

  JOB_POSTING ||--o{ CONVERSATION_THREAD : discussed_in
  JOB_POSTING ||--o{ JOB_POSTING_CANDIDATE : maps
  CANDIDATE ||--o{ JOB_POSTING_CANDIDATE : maps

  SHAREABLE_LINK ||--o{ SHAREABLE_CANDIDATES : contains

  POWERED_BY_REQUEST ||--o{ POWERED_BY_REQUEST_ATTACHMENT : includes

  USER {
    UUID id PK
    email
    role
  }
  COMPANY {
    UUID id PK
    name
    website_url
  }
  CANDIDATE {
    UUID id PK
    first_name
    email
    industry_id FK
    user_id FK
  }
  JOB_POSTING {
    UUID id PK
    title
    company_id FK
  }
```

Notes:

- Many models use `SoftDeleteObject` to support soft-deletion semantics.
- Foreign keys to `settings.AUTH_USER_MODEL` consistently capture audit fields.


