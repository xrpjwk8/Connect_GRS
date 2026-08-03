package com.connectgrs.backend.service;

import com.connectgrs.backend.api.dto.AdminStatsResponse;
import com.connectgrs.backend.api.dto.AdminStoreResponse;
import com.connectgrs.backend.api.dto.AvailabilityResponse;
import com.connectgrs.backend.api.dto.BookerSignUpRequest;
import com.connectgrs.backend.api.dto.ChatMessageCreateRequest;
import com.connectgrs.backend.api.dto.ChatMessageResponse;
import com.connectgrs.backend.api.dto.DeviceRegisterRequest;
import com.connectgrs.backend.api.dto.FilterMetadataResponse;
import com.connectgrs.backend.api.dto.OwnerDashboardResponse;
import com.connectgrs.backend.api.dto.OwnerSignUpRequest;
import com.connectgrs.backend.api.dto.ReservationCreateRequest;
import com.connectgrs.backend.api.dto.ReservationResponse;
import com.connectgrs.backend.api.dto.ReservationUpdateRequest;
import com.connectgrs.backend.api.dto.StoreSummaryResponse;
import com.connectgrs.backend.api.dto.TimeBlockUpdateRequest;
import com.connectgrs.backend.domain.BookerProfile;
import com.connectgrs.backend.domain.ChatMessage;
import com.connectgrs.backend.domain.DeviceToken;
import com.connectgrs.backend.domain.OwnerProfile;
import com.connectgrs.backend.domain.Reservation;
import com.connectgrs.backend.domain.ReservationStatus;
import com.connectgrs.backend.domain.Store;
import com.connectgrs.backend.domain.TimeBlock;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class ConnectService {
    private final Map<UUID, BookerProfile> bookers = new ConcurrentHashMap<>();
    private final Map<UUID, OwnerProfile> owners = new ConcurrentHashMap<>();
    private final Map<UUID, Store> stores = new ConcurrentHashMap<>();
    private final Map<UUID, Reservation> reservations = new ConcurrentHashMap<>();
    private final Map<UUID, Set<UUID>> favoritesByBooker = new ConcurrentHashMap<>();
    private final Map<UUID, List<TimeBlock>> blocksByOwner = new ConcurrentHashMap<>();
    private final Map<UUID, List<ChatMessage>> messagesByReservation = new ConcurrentHashMap<>();
    private final Map<UUID, String> deviceTokensByUser = new ConcurrentHashMap<>();

    private final PushNotificationService pushNotificationService;

    public ConnectService(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    private final List<String> regions = List.of("신촌", "홍대", "건대", "이태원");
    private final List<String> categories = List.of("전체", "주점", "고깃집", "파티룸", "카페", "일식");
    private final List<String> universities = List.of("연세대학교", "고려대학교", "서강대학교", "성균관대학교", "이화여자대학교", "중앙대학교");
    private final List<String> timeOptions = List.of("상관없음", "18:00", "19:00", "20:00", "21:00", "22:00");

    @PostConstruct
    void seed() {
        UUID ownerId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        UUID secondOwnerId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        UUID bookerId = UUID.fromString("33333333-3333-3333-3333-333333333333");

        UUID firstStoreId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        UUID secondStoreId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        owners.put(ownerId, new OwnerProfile(ownerId, "캠퍼스 포차", "김사장", "010-1111-2222", "123-45-67890", firstStoreId));
        owners.put(secondOwnerId, new OwnerProfile(secondOwnerId, "스페이스 아지트", "박대표", "010-2222-3333", "234-56-78901", secondStoreId));

        bookers.put(bookerId, new BookerProfile(
                bookerId, "연세대학교", "경영학과", "회장", "김지윤", "jiyun@yonsei.ac.kr", "010-9999-8888"
        ));

        Store store1 = new Store(
                firstStoreId,
                ownerId,
                "캠퍼스 포차",
                "주점",
                4.8,
                120,
                40,
                15000,
                96,
                "신촌",
                "단체 예약과 뒤풀이에 강한 신촌 포차입니다.",
                "fork.knife",
                List.of("최대 40명", "단체 환영", "신촌역 도보 4분")
        );
        Store store2 = new Store(
                secondStoreId,
                secondOwnerId,
                "스페이스 아지트",
                "파티룸",
                4.9,
                85,
                60,
                20000,
                92,
                "신촌",
                "행사, 종강 파티, 세미나까지 가능한 대형 공간입니다.",
                "sparkles",
                List.of("최대 60명", "빔프로젝터", "대관 가능")
        );
        Store store3 = new Store(
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                secondOwnerId,
                "구이마을 2호점",
                "고깃집",
                4.7,
                88,
                50,
                30000,
                95,
                "홍대",
                "회식과 동아리 모임에 잘 맞는 고깃집입니다.",
                "flame",
                List.of("최대 50명", "홍대입구역 5분", "무한리필")
        );

        stores.put(store1.id(), store1);
        stores.put(store2.id(), store2);
        stores.put(store3.id(), store3);

        favoritesByBooker.put(bookerId, new LinkedHashSet<>(Set.of(store2.id())));

        Reservation confirmed = new Reservation(
                UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                store1.id(),
                ownerId,
                bookerId,
                "김지윤",
                "연세대학교 경영학과",
                LocalDate.now().plusDays(1),
                List.of(LocalTime.of(19, 0), LocalTime.of(19, 30), LocalTime.of(20, 0), LocalTime.of(20, 30)),
                18,
                25000,
                "종강파티",
                "조용한 자리를 부탁드립니다.",
                ReservationStatus.CONFIRMED,
                LocalDateTime.now().minusDays(1)
        );
        Reservation pending = new Reservation(
                UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                store1.id(),
                ownerId,
                bookerId,
                "김지윤",
                "연세대학교 경영학과",
                LocalDate.now().plusDays(3),
                List.of(LocalTime.of(18, 30), LocalTime.of(19, 0), LocalTime.of(19, 30)),
                24,
                null,
                "개강총회",
                "빔프로젝터가 가능하면 좋겠습니다.",
                ReservationStatus.PENDING,
                LocalDateTime.now().minusHours(8)
        );
        Reservation completed = new Reservation(
                UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                store2.id(),
                secondOwnerId,
                bookerId,
                "김지윤",
                "연세대학교 경영학과",
                LocalDate.now().minusDays(10),
                List.of(LocalTime.of(19, 0), LocalTime.of(19, 30)),
                12,
                18000,
                "뒤풀이",
                "",
                ReservationStatus.COMPLETED,
                LocalDateTime.now().minusDays(15)
        );

        reservations.put(confirmed.id(), confirmed);
        reservations.put(pending.id(), pending);
        reservations.put(completed.id(), completed);

        blocksByOwner.put(ownerId, new ArrayList<>(List.of(
                new TimeBlock(UUID.randomUUID(), ownerId, store1.id(), LocalDate.now().plusDays(1), LocalTime.of(18, 0), "offline"),
                new TimeBlock(UUID.randomUUID(), ownerId, store1.id(), LocalDate.now().plusDays(1), LocalTime.of(18, 30), "offline")
        )));
    }

    public FilterMetadataResponse getMetadata() {
        return new FilterMetadataResponse(regions, categories, universities, timeOptions);
    }

    public BookerProfile createBooker(BookerSignUpRequest request) {
        UUID id = UUID.randomUUID();
        BookerProfile profile = new BookerProfile(
                id,
                request.schoolName(),
                request.departmentName(),
                request.position(),
                request.realName(),
                request.schoolEmail(),
                request.phoneNumber()
        );
        bookers.put(id, profile);
        favoritesByBooker.put(id, new LinkedHashSet<>());
        return profile;
    }

    public OwnerProfile createOwner(OwnerSignUpRequest request) {
        UUID ownerId = UUID.randomUUID();

        Store seededStore = new Store(
                UUID.randomUUID(),
                ownerId,
                request.storeName(),
                "주점",
                0.0,
                0,
                30,
                15000,
                100,
                "신촌",
                "사장님이 막 가입한 매장입니다.",
                "storefront",
                List.of("신규 매장")
        );
        stores.put(seededStore.id(), seededStore);
        blocksByOwner.put(ownerId, new ArrayList<>());

        OwnerProfile owner = new OwnerProfile(ownerId, request.storeName(), request.ownerName(), request.contact(), request.businessNumber(), seededStore.id());
        owners.put(ownerId, owner);
        return owner;
    }

    public List<StoreSummaryResponse> getFeaturedStores(UUID bookerId, String region) {
        return stores.values().stream()
                .filter(store -> region == null || region.isBlank() || store.region().equalsIgnoreCase(region))
                .sorted(Comparator.comparingDouble(Store::rating).reversed())
                .limit(6)
                .map(store -> StoreSummaryResponse.from(store, favoriteSet(bookerId)))
                .toList();
    }

    public List<StoreSummaryResponse> searchStores(UUID bookerId, String region, String category, Integer people, LocalDate date, LocalTime time) {
        return stores.values().stream()
                .filter(store -> region == null || region.isBlank() || store.region().equalsIgnoreCase(region))
                .filter(store -> category == null || category.isBlank() || "전체".equals(category) || store.category().equalsIgnoreCase(category))
                .filter(store -> people == null || store.maxCapacity() >= people)
                .filter(store -> isStoreAvailable(store.id(), store.ownerId(), date, time))
                .sorted(Comparator.comparingDouble(Store::rating).reversed())
                .map(store -> StoreSummaryResponse.from(store, favoriteSet(bookerId)))
                .toList();
    }

    public StoreSummaryResponse getStore(UUID storeId, UUID bookerId) {
        Store store = getStoreEntity(storeId);
        return StoreSummaryResponse.from(store, favoriteSet(bookerId));
    }

    public List<StoreSummaryResponse> getFavorites(UUID bookerId) {
        Set<UUID> favoriteIds = favoriteSet(bookerId);
        return favoriteIds.stream()
                .map(this::getStoreEntity)
                .map(store -> StoreSummaryResponse.from(store, favoriteIds))
                .toList();
    }

    public void addFavorite(UUID bookerId, UUID storeId) {
        ensureBooker(bookerId);
        getStoreEntity(storeId);
        favoritesByBooker.computeIfAbsent(bookerId, unused -> new LinkedHashSet<>()).add(storeId);
    }

    public void removeFavorite(UUID bookerId, UUID storeId) {
        favoriteSet(bookerId).remove(storeId);
    }

    public ReservationResponse createReservation(ReservationCreateRequest request) {
        Store store = getStoreEntity(request.storeId());
        BookerProfile booker = ensureBooker(request.bookerId());
        validateTimeSlots(request.timeSlots());
        validateAvailability(store, request.date(), request.timeSlots(), null);

        Reservation reservation = new Reservation(
                UUID.randomUUID(),
                store.id(),
                store.ownerId(),
                booker.id(),
                booker.realName(),
                booker.schoolName() + " " + booker.departmentName(),
                request.date(),
                sortTimes(request.timeSlots()),
                request.people(),
                request.budgetPerPerson(),
                request.eventPurpose(),
                request.requestMessage() == null ? "" : request.requestMessage(),
                ReservationStatus.PENDING,
                LocalDateTime.now()
        );
        reservations.put(reservation.id(), reservation);
        sendPush(
                store.ownerId(),
                "새 예약 신청이 도착했어요",
                booker.realName() + "님이 " + store.name() + "에 예약을 신청했어요.",
                Map.of("type", "reservation_request", "reservationId", reservation.id().toString())
        );
        return ReservationResponse.from(reservation, store);
    }

    public List<ReservationResponse> getReservationsForBooker(UUID bookerId, String statusGroup) {
        ensureBooker(bookerId);
        return reservations.values().stream()
                .filter(reservation -> reservation.bookerId().equals(bookerId))
                .filter(reservation -> matchesGroup(reservation.status(), statusGroup))
                .sorted(Comparator.comparing(Reservation::date).reversed())
                .map(this::toReservationResponse)
                .toList();
    }

    public List<ReservationResponse> getReservationsForOwner(UUID ownerId, String statusGroup) {
        ensureOwner(ownerId);
        return reservations.values().stream()
                .filter(reservation -> reservation.ownerId().equals(ownerId))
                .filter(reservation -> matchesGroup(reservation.status(), statusGroup))
                .sorted(Comparator.comparing(Reservation::date).reversed())
                .map(this::toReservationResponse)
                .toList();
    }

    public ReservationResponse updateReservation(UUID reservationId, ReservationUpdateRequest request) {
        Reservation current = getReservationEntity(reservationId);
        Store store = getStoreEntity(current.storeId());
        if (current.status() != ReservationStatus.PENDING && current.status() != ReservationStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only active reservations can be edited.");
        }
        validateTimeSlots(request.timeSlots());
        validateAvailability(store, request.date(), request.timeSlots(), reservationId);

        Reservation updated = new Reservation(
                current.id(),
                current.storeId(),
                current.ownerId(),
                current.bookerId(),
                current.bookerName(),
                current.bookerAffiliation(),
                request.date(),
                sortTimes(request.timeSlots()),
                request.people(),
                request.budgetPerPerson(),
                blankToEmpty(request.eventPurpose()),
                blankToEmpty(request.requestMessage()),
                current.status(),
                current.createdAt()
        );
        reservations.put(updated.id(), updated);
        return ReservationResponse.from(updated, store);
    }

    public ReservationResponse cancelReservation(UUID reservationId) {
        Reservation current = getReservationEntity(reservationId);
        Reservation updated = new Reservation(
                current.id(), current.storeId(), current.ownerId(), current.bookerId(),
                current.bookerName(), current.bookerAffiliation(), current.date(), current.timeSlots(),
                current.people(), current.budgetPerPerson(), current.eventPurpose(), current.requestMessage(),
                ReservationStatus.CANCELLED, current.createdAt()
        );
        reservations.put(updated.id(), updated);
        return toReservationResponse(updated);
    }

    public OwnerDashboardResponse getOwnerDashboard(UUID ownerId) {
        OwnerProfile owner = ensureOwner(ownerId);
        List<Reservation> ownerReservations = reservations.values().stream()
                .filter(reservation -> reservation.ownerId().equals(ownerId))
                .toList();
        List<ReservationResponse> pending = ownerReservations.stream()
                .filter(reservation -> reservation.status() == ReservationStatus.PENDING)
                .sorted(Comparator.comparing(Reservation::createdAt).reversed())
                .map(this::toReservationResponse)
                .toList();

        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        int weeklyRevenue = ownerReservations.stream()
                .filter(reservation -> reservation.status() == ReservationStatus.CONFIRMED || reservation.status() == ReservationStatus.COMPLETED)
                .filter(reservation -> !reservation.date().isBefore(weekStart) && !reservation.date().isAfter(weekEnd))
                .mapToInt(reservation -> reservation.people() * (reservation.budgetPerPerson() == null ? 0 : reservation.budgetPerPerson()))
                .sum() / 10_000;
        int weeklyCount = (int) ownerReservations.stream()
                .filter(reservation -> !reservation.date().isBefore(weekStart) && !reservation.date().isAfter(weekEnd))
                .count();

        return new OwnerDashboardResponse(
                owner.storeName(),
                weeklyRevenue,
                weeklyCount,
                pending.size(),
                pending
        );
    }

    public ReservationResponse updateReservationStatus(UUID ownerId, UUID reservationId, ReservationStatus status) {
        ensureOwner(ownerId);
        Reservation current = getReservationEntity(reservationId);
        if (!current.ownerId().equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Reservation does not belong to this owner.");
        }
        return applyReservationStatus(current, status);
    }

    /** 관리자 화면용: 소유자 검증 없이 어떤 예약이든 상태를 바꿀 수 있음. */
    public ReservationResponse adminUpdateReservationStatus(UUID reservationId, ReservationStatus status) {
        Reservation current = getReservationEntity(reservationId);
        return applyReservationStatus(current, status);
    }

    private ReservationResponse applyReservationStatus(Reservation current, ReservationStatus status) {
        Reservation updated = new Reservation(
                current.id(), current.storeId(), current.ownerId(), current.bookerId(),
                current.bookerName(), current.bookerAffiliation(), current.date(), current.timeSlots(),
                current.people(), current.budgetPerPerson(), current.eventPurpose(), current.requestMessage(),
                status, current.createdAt()
        );
        reservations.put(updated.id(), updated);
        if (status == ReservationStatus.CONFIRMED) {
            Store store = getStoreEntity(updated.storeId());
            sendPush(
                    updated.bookerId(),
                    "예약이 수락됐어요",
                    store.name() + " 예약이 확정됐어요.",
                    Map.of("type", "reservation_confirmed", "reservationId", updated.id().toString())
            );
        }
        return toReservationResponse(updated);
    }

    public List<AdminStoreResponse> getAllStoresForAdmin() {
        return stores.values().stream()
                .sorted(Comparator.comparing(Store::name))
                .map(store -> {
                    OwnerProfile owner = owners.get(store.ownerId());
                    return AdminStoreResponse.from(store, owner == null ? "-" : owner.ownerName());
                })
                .toList();
    }

    public List<OwnerProfile> getAllOwners() {
        return owners.values().stream().sorted(Comparator.comparing(OwnerProfile::storeName)).toList();
    }

    public List<BookerProfile> getAllBookers() {
        return bookers.values().stream().sorted(Comparator.comparing(BookerProfile::realName)).toList();
    }

    public List<ReservationResponse> getAllReservationsForAdmin(String statusGroup) {
        return reservations.values().stream()
                .filter(reservation -> matchesGroup(reservation.status(), statusGroup))
                .sorted(Comparator.comparing(Reservation::createdAt).reversed())
                .map(this::toReservationResponse)
                .toList();
    }

    public AdminStatsResponse getAdminStats() {
        int pending = 0;
        int confirmed = 0;
        for (Reservation reservation : reservations.values()) {
            if (reservation.status() == ReservationStatus.PENDING) pending++;
            if (reservation.status() == ReservationStatus.CONFIRMED) confirmed++;
        }
        return new AdminStatsResponse(
                stores.size(),
                owners.size(),
                bookers.size(),
                reservations.size(),
                pending,
                confirmed,
                deviceTokensByUser.size()
        );
    }

    public List<ChatMessageResponse> getMessages(UUID reservationId) {
        getReservationEntity(reservationId);
        return messagesByReservation.getOrDefault(reservationId, List.of()).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    public ChatMessageResponse postMessage(UUID reservationId, ChatMessageCreateRequest request) {
        getReservationEntity(reservationId);
        ChatMessage message = new ChatMessage(
                UUID.randomUUID(),
                reservationId,
                request.senderId(),
                request.senderRole(),
                request.text().trim(),
                LocalDateTime.now()
        );
        messagesByReservation.computeIfAbsent(reservationId, unused -> new ArrayList<>()).add(message);
        return ChatMessageResponse.from(message);
    }

    public void registerDevice(DeviceRegisterRequest request) {
        deviceTokensByUser.put(request.userId(), request.expoPushToken());
    }

    public BookerProfile findBookerByEmail(String schoolEmail) {
        return bookers.values().stream()
                .filter(booker -> booker.schoolEmail().equalsIgnoreCase(schoolEmail))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booker not found."));
    }

    public OwnerProfile findOwnerByContact(String contact) {
        return owners.values().stream()
                .filter(owner -> owner.contact().equals(contact))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found."));
    }

    private void sendPush(UUID userId, String title, String body, Map<String, Object> data) {
        String token = deviceTokensByUser.get(userId);
        if (token != null) {
            pushNotificationService.send(token, title, body, data);
        }
    }

    public Map<LocalDate, List<String>> getCalendar(UUID ownerId, UUID storeId, YearMonth yearMonth) {
        ensureOwner(ownerId);
        getStoreEntity(storeId);
        Map<LocalDate, List<String>> result = new HashMap<>();
        reservations.values().stream()
                .filter(reservation -> reservation.ownerId().equals(ownerId))
                .filter(reservation -> reservation.storeId().equals(storeId))
                .filter(reservation -> YearMonth.from(reservation.date()).equals(yearMonth))
                .forEach(reservation -> result.computeIfAbsent(reservation.date(), unused -> new ArrayList<>()).add(reservation.status().name()));
        return result;
    }

    public AvailabilityResponse getAvailability(UUID ownerId, UUID storeId, LocalDate date) {
        ensureOwner(ownerId);
        getStoreEntity(storeId);
        List<AvailabilityResponse.SlotState> slots = halfHourSlots().stream()
                .map(time -> new AvailabilityResponse.SlotState(time, resolveSlotState(ownerId, storeId, date, time)))
                .toList();
        return new AvailabilityResponse(date, slots);
    }

    public AvailabilityResponse replaceBlockedSlots(UUID ownerId, TimeBlockUpdateRequest request) {
        ensureOwner(ownerId);
        getStoreEntity(request.storeId());
        List<TimeBlock> freshBlocks = request.blockedSlots().stream()
                .distinct()
                .map(time -> new TimeBlock(UUID.randomUUID(), ownerId, request.storeId(), request.date(), time, "manual"))
                .toList();
        List<TimeBlock> existing = new ArrayList<>(blocksByOwner.getOrDefault(ownerId, new ArrayList<>()));
        existing.removeIf(block -> block.storeId().equals(request.storeId()) && block.date().equals(request.date()));
        existing.addAll(freshBlocks);
        blocksByOwner.put(ownerId, existing);
        return getAvailability(ownerId, request.storeId(), request.date());
    }

    private boolean matchesGroup(ReservationStatus status, String statusGroup) {
        if (statusGroup == null || statusGroup.isBlank()) {
            return true;
        }
        return switch (statusGroup.toLowerCase()) {
            case "ongoing" -> status == ReservationStatus.PENDING || status == ReservationStatus.CONFIRMED;
            case "past" -> status == ReservationStatus.COMPLETED || status == ReservationStatus.REJECTED || status == ReservationStatus.CANCELLED;
            case "pending" -> status == ReservationStatus.PENDING;
            case "confirmed" -> status == ReservationStatus.CONFIRMED;
            case "completed" -> status == ReservationStatus.COMPLETED;
            case "cancelled" -> status == ReservationStatus.CANCELLED;
            case "rejected" -> status == ReservationStatus.REJECTED;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown reservation status group.");
        };
    }

    private void validateTimeSlots(List<LocalTime> timeSlots) {
        List<LocalTime> sorted = sortTimes(timeSlots);
        if (sorted.size() > 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reservation can include at most 6 consecutive 30-minute slots.");
        }
        for (int i = 1; i < sorted.size(); i++) {
            if (!sorted.get(i - 1).plusMinutes(30).equals(sorted.get(i))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time slots must be consecutive 30-minute intervals.");
            }
        }
    }

    private void validateAvailability(Store store, LocalDate date, List<LocalTime> requestedSlots, UUID ignoreReservationId) {
        Set<LocalTime> normalized = new HashSet<>(requestedSlots);
        List<Reservation> conflicts = reservations.values().stream()
                .filter(reservation -> ignoreReservationId == null || !reservation.id().equals(ignoreReservationId))
                .filter(reservation -> reservation.storeId().equals(store.id()))
                .filter(reservation -> reservation.date().equals(date))
                .filter(reservation -> reservation.status() == ReservationStatus.PENDING || reservation.status() == ReservationStatus.CONFIRMED)
                .filter(reservation -> reservation.timeSlots().stream().anyMatch(normalized::contains))
                .toList();
        if (!conflicts.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more time slots are already reserved.");
        }

        Set<LocalTime> blocked = blocksByOwner.getOrDefault(store.ownerId(), List.of()).stream()
                .filter(block -> block.storeId().equals(store.id()) && block.date().equals(date))
                .map(TimeBlock::time)
                .collect(Collectors.toSet());
        if (requestedSlots.stream().anyMatch(blocked::contains)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "One or more time slots are blocked by the owner.");
        }
    }

    private boolean isStoreAvailable(UUID storeId, UUID ownerId, LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return true;
        }
        boolean reserved = reservations.values().stream()
                .filter(reservation -> reservation.storeId().equals(storeId))
                .filter(reservation -> reservation.date().equals(date))
                .filter(reservation -> reservation.status() == ReservationStatus.PENDING || reservation.status() == ReservationStatus.CONFIRMED)
                .anyMatch(reservation -> reservation.timeSlots().contains(time));
        if (reserved) {
            return false;
        }
        return blocksByOwner.getOrDefault(ownerId, List.of()).stream()
                .noneMatch(block -> block.storeId().equals(storeId) && block.date().equals(date) && block.time().equals(time));
    }

    private String resolveSlotState(UUID ownerId, UUID storeId, LocalDate date, LocalTime time) {
        if (time.isBefore(LocalTime.of(17, 0)) || time.isAfter(LocalTime.of(23, 30))) {
            return "closed";
        }
        boolean blocked = blocksByOwner.getOrDefault(ownerId, List.of()).stream()
                .anyMatch(block -> block.storeId().equals(storeId) && block.date().equals(date) && block.time().equals(time));
        if (blocked) {
            return "blocked";
        }
        boolean reserved = reservations.values().stream()
                .filter(reservation -> reservation.storeId().equals(storeId))
                .filter(reservation -> reservation.date().equals(date))
                .filter(reservation -> reservation.status() == ReservationStatus.PENDING || reservation.status() == ReservationStatus.CONFIRMED)
                .anyMatch(reservation -> reservation.timeSlots().contains(time));
        return reserved ? "reserved" : "available";
    }

    private List<LocalTime> sortTimes(Collection<LocalTime> times) {
        return times.stream().sorted().toList();
    }

    private List<LocalTime> halfHourSlots() {
        int startMinutes = 16 * 60;
        int endMinutes = 23 * 60 + 30;
        List<LocalTime> slots = new ArrayList<>();
        for (int minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
            slots.add(LocalTime.of(minutes / 60, minutes % 60));
        }
        return slots;
    }

    private ReservationResponse toReservationResponse(Reservation reservation) {
        return ReservationResponse.from(reservation, getStoreEntity(reservation.storeId()));
    }

    private Store getStoreEntity(UUID storeId) {
        Store store = stores.get(storeId);
        if (store == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Store not found.");
        }
        return store;
    }

    private Reservation getReservationEntity(UUID reservationId) {
        Reservation reservation = reservations.get(reservationId);
        if (reservation == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found.");
        }
        return reservation;
    }

    private BookerProfile ensureBooker(UUID bookerId) {
        BookerProfile profile = bookers.get(bookerId);
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booker not found.");
        }
        return profile;
    }

    private OwnerProfile ensureOwner(UUID ownerId) {
        OwnerProfile owner = owners.get(ownerId);
        if (owner == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner not found.");
        }
        return owner;
    }

    private Set<UUID> favoriteSet(UUID bookerId) {
        if (bookerId == null) {
            return Set.of();
        }
        return favoritesByBooker.computeIfAbsent(bookerId, unused -> new LinkedHashSet<>());
    }

    private String blankToEmpty(String value) {
        return value == null ? "" : value;
    }
}
