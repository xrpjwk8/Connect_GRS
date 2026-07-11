# Connect GRS Backend

SwiftUI 프론트가 `MockData` 없이 붙을 수 있도록 만든 Spring Boot 백엔드입니다.

## 스택

- Java 21
- Spring Boot 3.5
- Gradle Wrapper
- In-memory sample data

## 실행

```bash
cd backend
./gradlew bootRun
```

Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

## 주요 샘플 ID

- 기본 예약자 `bookerId`: `33333333-3333-3333-3333-333333333333`
- 기본 사장 `ownerId`: `11111111-1111-1111-1111-111111111111`
- 기본 매장 `storeId`: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`

## 엔드포인트

- `GET /api/meta/filters`
- `POST /api/auth/bookers`
- `POST /api/auth/owners`
- `GET /api/stores/featured?bookerId=...&region=신촌`
- `GET /api/stores?bookerId=...&region=신촌&category=주점&people=20&date=2030-07-16&time=19:00:00`
- `GET /api/stores/{storeId}?bookerId=...`
- `GET /api/bookers/{bookerId}/favorites`
- `POST /api/bookers/{bookerId}/favorites/{storeId}`
- `DELETE /api/bookers/{bookerId}/favorites/{storeId}`
- `POST /api/reservations`
- `GET /api/bookers/{bookerId}/reservations?statusGroup=ongoing`
- `PATCH /api/reservations/{reservationId}`
- `POST /api/reservations/{reservationId}/cancel`
- `GET /api/owners/{ownerId}/dashboard`
- `POST /api/owners/{ownerId}/reservations/{reservationId}/approve`
- `POST /api/owners/{ownerId}/reservations/{reservationId}/reject`
- `GET /api/owners/{ownerId}/calendar?storeId=...&yearMonth=2030-07`
- `GET /api/owners/{ownerId}/availability?storeId=...&date=2030-07-16`
- `PUT /api/owners/{ownerId}/availability/blocks`

## 프론트 연동 포인트

- `MockData.homeFeaturedStores` -> `GET /api/stores/featured`
- `MockData.searchResults` -> `GET /api/stores`
- `MockData.favorites` -> `GET /api/bookers/{bookerId}/favorites`
- `appState.myReservations` -> `GET /api/bookers/{bookerId}/reservations`
- `StoreDetailView.submit()` -> `POST /api/reservations`
- `ReservationEditView.saveChanges()` -> `PATCH /api/reservations/{reservationId}`
- `OwnerDashboardView` -> `GET /api/owners/{ownerId}/dashboard`
- `TimeBlockView` -> `GET/PUT /api/owners/{ownerId}/availability...`

## 메모

- 지금은 빠른 연동용이라 DB 없이 메모리 저장소를 사용합니다.
- 다음 단계로는 `JPA + PostgreSQL`, `JWT 인증`, `Firebase FCM` 연동을 붙이는 게 자연스럽습니다.
