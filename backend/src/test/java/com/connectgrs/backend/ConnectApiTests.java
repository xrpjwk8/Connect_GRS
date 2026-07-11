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
}
