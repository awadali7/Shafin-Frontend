# Course Purchase Flow - Frontend Documentation

## Overview

The course purchase flow in this application uses a **request-based system** rather than a direct cart purchase system. Users must request access to courses, which are then reviewed and approved by admins.

---

## Flow Diagram

```
User visits Course Page
    ↓
Views Course Details (First video is FREE)
    ↓
User wants to access remaining videos?
    ↓
Check: Is user logged in?
    ├─ No → Show Login Drawer
    │        ↓
    │   User logs in → Refresh page access status
    │        ↓
    └─ Yes → Check KYC Status
             ├─ Not verified/pending → Redirect to /kyc
             │                          ↓
             │                     Complete KYC
             │                          ↓
             └─ Verified → Show "Request Course Access" button
                           ↓
                    User clicks button
                           ↓
                    Submit request to backend
                           ↓
                    Admin reviews request
                           ↓
                    If approved → User gets course access
                           ↓
                    User can view all videos
```

---

## Detailed Flow Steps

### 1. **Course Discovery** (`/courses`)
- User browses available courses
- Each course card shows:
  - Course name
  - Description
  - Price (₹)
  - Number of lessons/videos
  - Cover image
- Clicking a course navigates to `/courses/[slug]`

### 2. **Course Detail Page** (`/courses/[slug]`)

#### A. First Video Access (FREE)
- The **first video** (order_index = 0) is **always FREE and unlocked**
- No login required to watch the first video
- Users can preview the course content

#### B. Requesting Full Course Access

When user wants to access remaining videos:

**Step 1: Authentication Check**
- If not logged in → Login drawer opens
- User logs in → Page refreshes access status

**Step 2: KYC Verification Check**
- System checks if user has completed KYC (`/api/kyc/my`)
- If no KYC or status is not "verified":
  - User is redirected to `/kyc?redirect=/courses/[slug]`
  - User must complete KYC verification
  - After KYC approval, user can return to course page

**Step 3: Course Access Request**
- If KYC is verified:
  - User clicks "Request Course Access" button
  - Confirmation modal appears
  - User confirms → Request is submitted via `requestsApi.create()`
  - Request includes:
    - `course_id`: The course ID
    - `request_message`: Auto-generated message

**Step 4: Admin Review**
- Admin reviews the request in admin panel
- Admin can approve/reject the request
- If approved:
  - User gets enrolled in the course
  - All videos become unlocked
  - User can access course content

**Step 5: Access Granted**
- System checks enrolled courses via `progressApi.getMyCourses()`
- If user is enrolled, `hasAccess` state becomes `true`
- All videos unlock (except first one which was already free)
- User can navigate through all course videos

---

## Key Components

### 1. **Course List Page** (`app/courses/page.tsx`)
- Displays all available courses
- Each course links to detail page

### 2. **Course Detail Page** (`app/courses/[slug]/page.tsx`)
- Main component: `CourseDetailPage`
- Key features:
  - Video player for current video
  - Sidebar with all course videos
  - Access control logic
  - Request access functionality
  - KYC status checking

### 3. **Video Access Control**
```typescript
isVideoLocked(video: Video, index: number)
```
- First video (index 0) → Always unlocked
- Remaining videos → Locked until access granted
- Checks:
  1. If user has course access (`hasAccess` state)
  2. If video `is_unlocked` property is true
  3. If video `is_locked` property is true

### 4. **Request Access Flow**
```typescript
handleRequestAccessClick()
  ↓
Check KYC Status
  ↓
If verified → Show Request Modal
  ↓
handleConfirmRequest()
  ↓
API Call: requestsApi.create({ course_id, request_message })
  ↓
Success → Show success message
```

---

## API Endpoints Used

### 1. **Get Course by Slug**
```typescript
coursesApi.getBySlug(slug)
```
- Returns course details

### 2. **Get Course Videos**
```typescript
coursesApi.getVideos(courseId)
```
- Returns array of videos with unlock status

### 3. **Check Enrolled Courses**
```typescript
progressApi.getMyCourses()
```
- Returns courses user is enrolled in
- Used to determine if user has access

### 4. **Check KYC Status**
```typescript
kycApi.getMyKYC()
```
- Returns KYC status: "pending" | "verified" | "rejected" | null

### 5. **Create Course Request**
```typescript
requestsApi.create({
  course_id: string,
  request_message: string
})
```
- Submits access request for admin review

---

## State Management

### Key State Variables
- `hasAccess`: Boolean - Whether user has full course access
- `course`: CourseDetails - Course information
- `videos`: Video[] - Array of course videos
- `currentVideoIndex`: number - Currently playing video
- `kycStatus`: "pending" | "verified" | "rejected" | null
- `requestLoading`: Boolean - Request submission state
- `requestSuccess`: Boolean - Request success state

---

## UI Elements

### 1. **Locked Video Overlay**
- Shows lock icon
- Displays "Request Course Access" button
- Only shown when video is locked

### 2. **Course Request Banner**
- Shown after first video
- Prompts user to request access
- Shows price and course details

### 3. **Sidebar Course Info**
- Shows course name
- Displays price (if not accessed)
- "Request Course Access" button
- KYC status indicators

### 4. **Video List Sidebar**
- Shows all course videos
- Locked videos show lock icon
- Unlocked videos show play/check icons
- Current video is highlighted

---

## Differences from Shop/Product Purchase Flow

| Aspect | Courses | Products (Shop) |
|--------|---------|-----------------|
| Purchase Method | Request-based (admin approval) | Direct cart purchase |
| First Access | First video is FREE | Full payment required |
| KYC Required | Yes (must be verified) | Not required |
| Payment | No payment (free after approval) | Razorpay integration |
| Access Control | Admin grants access | Automatic after payment |
| Cart System | Not used | Uses CartContext |

---

## User Journey Examples

### Example 1: New User
1. Visits `/courses`
2. Clicks on a course → `/courses/adas-calibration`
3. Watches first video (FREE)
4. Wants more → Clicks "Request Course Access"
5. Not logged in → Login drawer opens
6. Logs in → Redirected back to course
7. KYC not completed → Redirected to `/kyc`
8. Completes KYC → Waits for admin approval
9. Admin approves → Returns to course
10. All videos now unlocked ✅

### Example 2: Returning User (KYC Verified)
1. Visits course page (already logged in)
2. Watches first video
3. Clicks "Request Course Access"
4. Confirms request
5. Request submitted → Shows success message
6. Waits for admin approval
7. Admin approves → All videos unlock ✅

---

## Important Notes

1. **First Video is Always Free**: This is a marketing strategy to let users preview content
2. **KYC is Mandatory**: Users cannot request course access without verified KYC
3. **No Direct Payment**: Courses use request-based access, not payment-based
4. **Admin Approval Required**: All course access requests require admin approval
5. **Cart System Not Used**: Unlike shop products, courses don't use the cart/checkout flow

---

## Future Enhancements (Potential)

- Direct course purchase (like products)
- Course cart functionality
- Bulk course purchases
- Course bundles
- Subscription-based access
- Payment integration for courses

