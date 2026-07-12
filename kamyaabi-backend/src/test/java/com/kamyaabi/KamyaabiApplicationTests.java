package com.kamyaabi;

import com.kamyaabi.entity.Order;
import com.kamyaabi.repository.OrderRepository;
import com.kamyaabi.security.CurrentUser;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.File;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("local")
@AutoConfigureMockMvc
class KamyaabiApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @MockBean
    private CurrentUser currentUser;

    @Test
    @WithMockUser(username = "test@kamyaabi.in", roles = {"USER"})
    void testDownloadInvoiceRegeneration() throws Exception {
        System.out.println("=== TESTING INVOICE REGENERATION FOR ORDER 1016 ===");
        Optional<Order> orderOpt = orderRepository.findByIdWithInvoiceDetails(1016L);
        if (orderOpt.isEmpty()) {
            System.out.println("Order 1016 not found!");
            return;
        }
        Order order = orderOpt.get();
        System.out.println("Order ID: " + order.getId() + " (User ID: " + order.getUser().getId() + ")");
        
        when(currentUser.getUserId()).thenReturn(order.getUser().getId());
        when(currentUser.getUser()).thenReturn(order.getUser());

        MvcResult result = mockMvc.perform(get("/api/orders/1016/invoice"))
                .andExpect(status().isOk())
                .andReturn();

        System.out.println("Response Status: " + result.getResponse().getStatus());
        System.out.println("Content-Type: " + result.getResponse().getContentType());
        System.out.println("Content-Length: " + result.getResponse().getContentLength());
        
        // Query database again to see new path
        Order updatedOrder = orderRepository.findById(1016L).get();
        System.out.println("Updated Order Invoice URL: " + updatedOrder.getInvoiceUrl());
        if (updatedOrder.getInvoiceUrl() != null) {
            File f = new File(updatedOrder.getInvoiceUrl());
            System.out.println("New File Exists: " + f.exists() + ", Size: " + (f.exists() ? f.length() : 0));
        }
    }
}
