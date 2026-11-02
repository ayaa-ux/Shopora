package com.shopora.auth.service;

import com.shopora.auth.dto.AdminUserResponse;
import com.shopora.auth.dto.AdminUserStatsResponse;
import com.shopora.auth.entity.Role;
import com.shopora.auth.entity.User;
import com.shopora.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int STATS_DAYS = 30;

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminUserResponse setEnabled(Long id, boolean enabled, String adminEmail) {
        User user = findUser(id);
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalStateException("Vous ne pouvez pas désactiver votre propre compte.");
        }
        user.setEnabled(enabled);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AdminUserResponse setRole(Long id, Role role, String adminEmail) {
        User user = findUser(id);
        if (user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new IllegalStateException("Vous ne pouvez pas modifier votre propre rôle.");
        }
        user.setRole(role);
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AdminUserStatsResponse getStats() {
        List<User> users = userRepository.findAll();

        long clients = users.stream().filter(u -> u.getRole() == Role.CLIENT).count();
        long vendors = users.stream().filter(u -> u.getRole() == Role.VENDOR).count();
        long admins = users.stream().filter(u -> u.getRole() == Role.ADMIN).count();
        long enabled = users.stream().filter(User::isEnabled).count();

        LocalDate today = LocalDate.now();
        Map<LocalDate, Long> byDay = new TreeMap<>();
        for (int i = STATS_DAYS - 1; i >= 0; i--) {
            byDay.put(today.minusDays(i), 0L);
        }
        for (User u : users) {
            LocalDate day = u.getCreatedAt().toLocalDate();
            if (byDay.containsKey(day)) {
                byDay.merge(day, 1L, Long::sum);
            }
        }
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        List<AdminUserStatsResponse.DayCount> signups = byDay.entrySet().stream()
                .map(e -> new AdminUserStatsResponse.DayCount(e.getKey().format(fmt), e.getValue()))
                .toList();

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        long newLast7 = users.stream().filter(u -> u.getCreatedAt().isAfter(weekAgo)).count();

        return new AdminUserStatsResponse(users.size(), clients, vendors, admins,
                enabled, users.size() - enabled, newLast7, signups);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
    }

    private AdminUserResponse toResponse(User u) {
        return new AdminUserResponse(u.getId(), u.getFullName(), u.getEmail(),
                u.getRole().name(), u.isEnabled(), u.getCreatedAt());
    }
}
