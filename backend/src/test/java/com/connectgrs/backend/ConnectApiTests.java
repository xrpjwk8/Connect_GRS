package com.connectgrs.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ConnectApiTests {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void returnsFeaturedStores() throws Exception {
        mockMvc.perform(get("/api/stores/featured")
                        .param("bookerId", "33333333-3333-3333-3333-333333333333")
                        .param("region", "신촌"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("스페이스 아지트"));
    }

    @Test
    void createsReservation() throws Exception {
        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "storeId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                                  "bookerId": "33333333-3333-3333-3333-333333333333",
                                  "date": "2030-07-16",
                                  "timeSlots": ["19:00:00", "19:30:00"],
                                  "people": 20,
                                  "budgetPerPerson": 22000,
                                  "eventPurpose": "종강파티",
                                  "requestMessage": "창가석 가능하면 부탁드려요."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.storeName").value("스페이스 아지트"));
    }

    @Test
    void returnsAvailabilitySlotsWithoutHanging() throws Exception {
        mockMvc.perform(get("/api/owners/11111111-1111-1111-1111-111111111111/availability")
                        .param("storeId", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
                        .param("date", "2030-07-16"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slots.length()").value(16))
                .andExpect(jsonPath("$.slots[0].time").value("16:00:00"))
                .andExpect(jsonPath("$.slots[15].time").value("23:30:00"));
    }

    @Test
    void updatesReservation() throws Exception {
        mockMvc.perform(patch("/api/reservations/dddddddd-dddd-dddd-dddd-dddddddddddd")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2030-07-18",
                                  "timeSlots": ["20:00:00", "20:30:00"],
                                  "people": 16,
                                  "budgetPerPerson": 24000,
                                  "eventPurpose": "회식",
                                  "requestMessage": "프로젝터 요청"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.people").value(16))
                .andExpect(jsonPath("$.eventPurpose").value("회식"));
    }

    @Test
    void sendsAndListsChatMessages() throws Exception {
        mockMvc.perform(post("/api/reservations/dddddddd-dddd-dddd-dddd-dddddddddddd/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "senderId": "33333333-3333-3333-3333-333333333333",
                                  "senderRole": "BOOKER",
                                  "text": "계좌번호 알려주세요"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("계좌번호 알려주세요"))
                .andExpect(jsonPath("$.senderRole").value("BOOKER"));

        mockMvc.perform(get("/api/reservations/dddddddd-dddd-dddd-dddd-dddddddddddd/messages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("계좌번호 알려주세요"));
    }

    @Test
    void registersDeviceTokenAndNotifiesOwnerOnReservationRequest() throws Exception {
        mockMvc.perform(post("/api/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": "11111111-1111-1111-1111-111111111111",
                                  "role": "OWNER",
                                  "expoPushToken": "ExponentPushToken[test-token]"
                                }
                                """))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/reservations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "storeId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                  "bookerId": "33333333-3333-3333-3333-333333333333",
                                  "date": "2030-08-01",
                                  "timeSlots": ["19:00:00"],
                                  "people": 10,
                                  "eventPurpose": "동아리 모임"
                                }
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void looksUpBookerAndOwnerForLogin() throws Exception {
        mockMvc.perform(get("/api/auth/bookers/lookup").param("schoolEmail", "jiyun@yonsei.ac.kr"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.realName").value("김지윤"));

        mockMvc.perform(get("/api/auth/owners/lookup").param("contact", "010-1111-2222"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storeName").value("캠퍼스 포차"));

        mockMvc.perform(get("/api/auth/bookers/lookup").param("schoolEmail", "nobody@nowhere.com"))
                .andExpect(status().isNotFound());
    }
}
