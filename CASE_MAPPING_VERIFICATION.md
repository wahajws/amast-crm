# Case Mapping Verification

## Overview
This document verifies that case mapping (camelCase ↔ snake_case) is consistent throughout the Lead Generation feature.

## Data Flow

### 1. Frontend → Backend (API Request)
- **Frontend sends**: camelCase (e.g., `companyName`, `userId`, `companyUrl`)
- **Backend receives**: camelCase in `req.body`
- ✅ **Status**: Correct

### 2. Backend → Database (Insert/Update)
- **Service layer**: Uses `mapToSnakeCase()` to convert camelCase → snake_case
- **Database stores**: snake_case (e.g., `company_name`, `user_id`, `company_url`)
- ✅ **Status**: Correct (handled in `CompanyProfileService.create()`)

### 3. Database → Backend (Select)
- **Database returns**: snake_case
- **BaseModel.fromDatabaseRow()**: Automatically converts snake_case → camelCase
- **Model instance**: Has camelCase properties
- ✅ **Status**: Correct

### 4. Backend → Frontend (API Response)
- **Model.toJSON()**: Returns camelCase properties
- **Controller**: Returns model directly via `this.success()`
- **Frontend receives**: camelCase
- ✅ **Status**: Correct

## Key Files Verified

### Backend
1. **models/CompanyProfile.js**
   - ✅ Constructor accepts both camelCase and snake_case
   - ✅ Properties stored as camelCase
   - ✅ `fromDatabaseRow()` converts automatically

2. **services/CompanyProfileService.js**
   - ✅ Normalizes both formats before processing
   - ✅ Uses `mapToSnakeCase()` before database operations
   - ✅ Returns model instances (camelCase)

3. **services/LeadGenerationService.js**
   - ✅ Sets both camelCase and snake_case versions
   - ✅ Passes proper user object to service

4. **controllers/LeadGenerationController.js**
   - ✅ Returns model instances directly
   - ✅ BaseController handles JSON serialization

### Frontend
1. **CompanyAnalysisStep.jsx**
   - ✅ Uses camelCase: `companyName`, `productsServices`, `targetMarket`
   - ✅ Sends camelCase in API requests
   - ✅ Receives camelCase from API responses

## Verification Checklist

- [x] Model constructor handles both formats
- [x] Service converts to snake_case for database
- [x] Repository uses BaseModel.fromDatabaseRow (auto-converts)
- [x] Controller returns models directly (camelCase)
- [x] Frontend uses camelCase consistently
- [x] Metadata JSON is properly stringified/parsed

## Potential Issues Fixed

1. ✅ Added metadata parsing in CompanyProfile model
2. ✅ Ensured both camelCase and snake_case are set in LeadGenerationService
3. ✅ Normalized data in CompanyProfileService before mapping
4. ✅ Verified BaseModel.fromDatabaseRow conversion

## Conclusion

All case mapping is consistent. The system properly:
- Accepts camelCase from frontend
- Converts to snake_case for database
- Converts back to camelCase for frontend
- Handles both formats in model constructors for flexibility

