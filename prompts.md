We are creating pokelive backend . A Livecommerce platform where people can buy and sell their products . 
A user can create a live stream and sell products in the live stream . A user can also buy products in the live stream . 
The platform will be used for e-commerce purposes.
In the livestream people can chat also. 


CodeBase-
Backend Codebase- 
C:\20300\github\jack\backend
 
( This backend will be used by the flutter app and the dashboard )
 
Dashboard Codebase-
C:\20300\github\jack\dash

FLutter App Codebase-
C:\20300\github\jack\flutter_app




GENERAL FLOW:


User roles are Admin and User. 
Users can sign up and buy products.
To sell a product, a user must apply to become a seller. 
Admin will approve the request from the dashboard.
After admin approval that user will have the ability to sell and create live streams.
Before creating a livestream, the seller can select the products to feature during that stream. 


SELLER APPROVAL AND ROLE RULES:

A newly registered user must have the default User role/status and must not be able to sell products or create livestreams.

Seller application and approval must be handled through the backend.

The backend must enforce the seller approval state server-side. Do not rely on Flutter or dashboard UI restrictions for authorization.

Only an approved seller can:
- Create and manage their own products where applicable
- Create a livestream
- Select products for their livestream
- Perform any other seller-only action identified in the Flutter app/dashboard

Admin can:
- View seller applications
- Approve or reject seller applications
- Perform other admin actions that are actually available in the dashboard

A User must never be able to grant themselves seller privileges by modifying a request, JWT payload, client state, or API parameters.

The backend must verify the user's current role and seller approval status on every seller-protected operation.

If an approved seller is suspended, rejected, disabled, or otherwise loses seller permission in the existing application flow, the backend must immediately prevent further seller-only operations according to the actual requirements found in the codebase.

Do not assume additional seller statuses or workflows unless they are found in the Flutter app, dashboard, or existing backend.


Our app frontend and the dashboard is almost ready.


BEFORE IMPLEMENTATION:
First thoroughly analyze the complete Flutter app and dashboard codebase.

Identify and document:
- All screens and user flows
- Existing mock data/models
- Required entities and relationships
- All user actions
- Dashboard operations
- Existing API/service structures
- Required API request/response data
- Real-time requirements
- Authentication/authorization requirements

Do not design the backend based only on this prompt. The existing Flutter app and dashboard are the source of truth for required functionality.

Do not modify plan.md or progress.md based on assumptions before analyzing the codebases. First inspect the actual code and then create the plan from the findings.

Create a feature/API inventory before implementation:
Flutter/Dashboard screen → API → Controller → Service → Model → Socket/GetStream integration.


GETSTREAM:
Create a dedicated GetStream service/integration layer.

Clearly separate responsibilities between:
- REST API
- Socket.IO
- GetStream

Do not duplicate real-time functionality unnecessarily.

Never expose the GetStream secret to the Flutter app or dashboard.

Do not implement features that are not required by the existing Flutter app or dashboard.



Now we are creating the backend for it. 







I want to connect backend with the frontend and the dashboard.

The backend is created using nodejs, expressjs, mongoose and socket.io.

BACKEND ARCHITECTURE:
Use a modular architecture with clear separation of:
- Routes
- Controllers
- Services
- Models
- Middleware
- Validators
- Utilities
- Configuration
- Socket.IO handlers
- GetStream integration
- S3 integration

Keep business logic inside service/helper layers, not inside route files or controllers.

Use API versioning such as /api/v1 where appropriate.

Maintain consistent:
- API response format
- Error response format
- HTTP status codes
- Validation
- Pagination
- Filtering
- Sorting




The frontend is created using flutter.


The dashboard is created using vite and react.

For streaming we will be using getstream.io 
We already have the API key and secret of getstream.io saved in the .env file. 
We will be using mongodb for all kind of data storing.  


For auth we will be using JWT token for auth. 


AUTHORIZATION AND SECURITY:
JWT authentication must be combined with proper authorization.

Every protected resource must verify:
- Authentication
- User role
- Resource ownership where applicable

Implement secure validation and protection against:
- Unauthorized access
- IDOR/resource ownership issues
- Invalid MongoDB ObjectIds
- Malicious input
- Excessive requests/rate abuse
- Oversized requests
- Unsafe file uploads
- Duplicate/abnormal requests

Never expose JWT secrets, GetStream secrets, AWS credentials, or other private environment variables to Flutter or the dashboard.

Use secure password hashing, token expiration, appropriate CORS configuration, security headers, and rate limiting where appropriate.

For all the image upload we will be using AWS s3 bucket. 


AWS S3:
Flutter and dashboard must never receive AWS credentials.

Use the backend to manage secure uploads, preferably through presigned upload URLs where appropriate.

Validate:
- File type
- File size
- Upload authorization
- File naming/key structure

Never trust client-provided file metadata without server-side validation.


E-COMMERCE DATA AND TRANSACTION RULES:
Before implementing products, carts, orders, payments, inventory, shipping, refunds, or related functionality, inspect the Flutter and dashboard code to determine exactly which of these are required.

Define the required lifecycle and ownership rules before implementation.

For inventory/limited-stock products, prevent overselling and handle concurrent purchases safely using appropriate MongoDB atomic operations/transactions where required.

Do not invent a payment provider. If payment functionality exists in the frontend/dashboard but the provider is not defined, identify it as a dependency and ask before implementing the integration.

If the Flutter app or dashboard contains payment, checkout, shipping, refund, wallet, or other third-party integrations whose provider/configuration is not available, stop at that integration point and clearly document it as a dependency. Do not guess or substitute a provider.







Always use ponytail for coding. 

No production source code file should exceed 300 lines. If a file approaches this limit, split it into logical, reusable modules before continuing. Do not artificially split tightly coupled code just to satisfy the line count.


Write all the important functions in a separated file.
And then call the function in the main file.


Update the workspace rules based on this. 


IMPORTANT- 
USE PONYTAIL skills to generate code.
BEFORE STARTING ANYTHING ANALYSE THE FLUTTER APP CODEBASE and the DASHBOARD CODEBASE and try to understand how the app works. 
then create the backend for it.
This app will be similar to WHATNOT app but with less feature. 
We will not add any extra feature that is not in the flutter app or dashboard code.
WE WILL NOT CHANGE ANY UI of the app or the dashbnoard without any explicit command. 
Implement the backend properly then wire the app and the dashboard properly.
Make sure there are no security concerns in the final product.
Test each feature thoroughly before moving to the next one. 

TESTING AND DEFINITION OF DONE:
For every feature:

1. Implement backend
2. Test API independently
3. Test validation and error cases
4. Test authentication/authorization
5. Connect Flutter
6. Connect dashboard
7. Test complete user flow
8. Test real-time behavior where applicable
9. Perform a security check
10. Update progress.md

A feature is not considered complete until backend, Flutter, dashboard, integration, testing, and security checks are completed.

populate this  C:\20300\github\jack\plan.md file with proper detailed plan.
we will execute the plans step by step. 


PROGRESS TRACKING:

Use C:\20300\github\jack\progress.md as the single project progress tracker.

For every feature track:
- Feature name
- Current status
- Backend status
- Flutter integration status
- Dashboard integration status
- Testing status
- Security review status
- Remaining issues
- Completion date

Use these statuses:

NOT STARTED
ANALYZING
BACKEND
FLUTTER INTEGRATION
DASHBOARD INTEGRATION
TESTING
SECURITY REVIEW
COMPLETED

Update progress.md after every completed step. Never mark a feature COMPLETED until all required stages are finished.

API DOCUMENTATION:
Maintain API documentation throughout development using Swagger/OpenAPI or an equivalent structured documentation system.

The documentation must reflect the actual implemented API.

All API endpoints must be documented with authentication requirements, authorization requirements, request parameters/body, response format, validation rules, and possible error responses.

ENVIRONMENT:
Create/update .env.example with variable names only. Never commit or expose actual secrets.

DATABASE:
Use appropriate MongoDB indexes, constraints, timestamps, relationships, and atomic operations based on the actual application requirements.

CHANGE DISCIPLINE:
Do not unnecessarily rewrite or restructure existing Flutter or dashboard code.

If frontend changes are required only for backend integration, make the smallest possible integration change and do not change the existing UI/UX.

Never remove or change an existing feature without explicit instruction.

After completing each feature, verify that previously completed features still work.

[senior-backend](slashCommand;senior-backend) [backend-architect](slashCommand;backend-architect) [getstream](slashCommand;getstream)  [getstream-io](slashCommand;getstream-io)  [ponytail](slashCommand;ponytail)  [ponytail-audit](slashCommand;ponytail-audit)  [ponytail-debt](slashCommand;ponytail-debt) [ponytail-gain](slashCommand;ponytail-gain) [ponytail-help](slashCommand;ponytail-help)  [ponytail-review](slashCommand;ponytail-review) 


Use these skills when needed.

IMPORTANT EXECUTION RULE:

Do not start implementing backend features immediately.

First:
1. Analyze Flutter codebase
2. Analyze dashboard codebase
3. Understand all existing flows and mock data
4. Create the feature/API inventory
5. Review the existing backend structure
6. Create/update plan.md
7. Create/update progress.md
8. Then implement the backend step by step.





Follow the plan sequentially. Do not skip ahead unless explicitly instructed.

Use the available Ponytail skills whenever applicable, especially ponytail, ponytail-audit, ponytail-debt, ponytail-gain, ponytail-help, and ponytail-review.

Use senior-backend, backend-architect, getstream, and getstream-io skills whenever their expertise is relevant.

Before making architectural decisions, inspect the existing codebase first.

IMPORTANT:
Never assume that a feature is required simply because it is common in a live-commerce platform or Whatnot-like application.

The Flutter app and dashboard define the required feature scope.

If something is unclear or contradictory between the Flutter app, dashboard, and existing backend, do not guess. Document the conflict and ask for clarification before implementing that part.

