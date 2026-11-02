package com.shopora.orders.repository;

import com.shopora.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Toutes les lignes vendues par un vendeur (page "Commandes" du dashboard vendeur)
    List<OrderItem> findByVendorEmailOrderByOrder_CreatedAtDesc(String vendorEmail);

    // Lignes d'un vendeur depuis une date (statistiques sur 30 jours)
    List<OrderItem> findByVendorEmailAndOrder_CreatedAtAfter(String vendorEmail, LocalDateTime since);
}
