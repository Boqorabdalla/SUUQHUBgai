# Firebase Security Rules Specification & TDD Spec

## 1. Data Invariants
- **Authentication**: All writes (create, update, delete) must require fully authenticated and verified users.
- **Identity Lock**: A user's profile can only be read or written by the user themselves (with UID mapping matching `request.auth.uid`), or by an authenticated `admin`/`superadmin`.
- **System Role Locking**: Standard users cannot modify or upgrade their own role (e.g. self-assign the `admin` or `superadmin` role). RBAC values are immutable from client SDK level unless processed through verified management or admin routes.
- **Product Verification Gate**: Vendor submitted products cannot set `"isApproved": true` directly at create or update time unless the administrator grants that state.
- **Atomic Integrity**: Order paths must belong to the logged-in customer who submitted the shopping checkout session.

## 2. The "Dirty Dozen" Threat Payloads (Insecure Requests Denied by Fortress Rules)
1. **Self-Elevated Admin Role**: Custom payload trying to sign up / create a user profile with role `admin` or `superadmin`.
2. **Identity Theft Write**: User `UserB` attempting to create, edit, or overwrite resource belonging to `UserA` (mismatched UID path variables versus `request.auth.uid`).
3. **Ghost Profile Overwrite**: Attempting to query or overwrite another user's private profile block without being logged in.
4. **Instant Self-Product Approval**: Vendor posting a product listing with the property `"isApproved": true` pre-set.
5. **Direct Store Price Manipulation**: Malicious buyer attempting to modify the product's listed price inside `/products/{productId}` documents.
6. **Malicious ID Char Poisoning**: Writing a payload with a document ID string larger than 128 characters or containing bad Unicode/character entities.
7. **Bypassing Mandatory Field Schema**: Attempting to write a Product document containing missing required fields (like `price` or `title`).
8. **Malicious Negative-Price Input**: Attempting to write a negative or non-numerical value inside the product price field.
9. **Tampering with Immutable Timestamps**: Adjusting order or product registration metrics to change history by overriding `createdAt` and mocking timestamp streams.
10. **Foreign Order Ingestion**: Posting an Order resource where `customerId` does not equal `request.auth.uid`.
11. **Shadow Update injection**: Injecting unmapped key-value properties like `isUltimateVip: true` onto user profiles.
12. **Anonymous Admin Claim**: Attempting to query Admin actions using an anonymous or non-email-verified authentication token.

## 3. Test Runner Design (`firestore.rules.test.ts`)
The matching unit testing checks enforce that all "Dirty Dozen" operations fail with a standard `PERMISSION_DENIED` rejection code inside Firestore mock environments.
