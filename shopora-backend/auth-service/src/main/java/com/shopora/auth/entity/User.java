package com.shopora.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // @Builder.Default : indique à Lombok d'utiliser cette valeur si le champ
    // n'est pas explicitement renseigné dans un appel .builder()...build().
    // Corrige le warning, et garantit qu'un compte est actif par défaut.
    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(updatable = false, nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // On garde @PrePersist comme filet de sécurité supplémentaire :
    // si jamais l'entité est créée d'une autre façon que via le builder
    // (ex: new User() + setters), createdAt sera quand même renseigné
    // juste avant l'insertion en base.
    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}