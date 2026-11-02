package com.shopora.groupbuying.repository;

import com.shopora.groupbuying.entity.GroupBuySession;
import com.shopora.groupbuying.entity.SessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GroupBuySessionRepository extends JpaRepository<GroupBuySession, Long> {

    List<GroupBuySession> findByStatus(SessionStatus status);

    // Administration
    List<GroupBuySession> findAllByOrderByCreatedAtDesc();

    long countByStatus(SessionStatus status);

    List<GroupBuySession> findByStatusAndEndTimeBefore(SessionStatus status, LocalDateTime now);

    List<GroupBuySession> findByProductOfferIdAndStatus(Long productOfferId, SessionStatus status);

    // Sessions d'un vendeur précis (page "Group Buying" du dashboard vendeur)
    List<GroupBuySession> findByVendorEmailOrderByCreatedAtDesc(String vendorEmail);

    // Verrou pessimiste : empêche deux joins (ou un join + le scheduler) de modifier
    // la même session en même temps -> plus de compteur faux ni de double résolution.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from GroupBuySession s where s.id = :id")
    Optional<GroupBuySession> findByIdForUpdate(@Param("id") Long id);
}