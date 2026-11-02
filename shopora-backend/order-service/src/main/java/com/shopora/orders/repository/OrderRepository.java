package com.shopora.orders.repository;

import com.shopora.orders.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Historique d'un client, du plus récent au plus ancien
    List<Order> findByClientEmailOrderByCreatedAtDesc(String clientEmail);
}
