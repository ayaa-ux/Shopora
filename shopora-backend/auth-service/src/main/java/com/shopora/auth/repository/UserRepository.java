package com.shopora.auth.repository;

import com.shopora.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Interface JPA pour accéder à la table "users".
 *
 * Spring Data JPA génère automatiquement l'implémentation au démarrage,
 * on n'a besoin d'écrire que la signature des méthodes "custom".
 *
 * JpaRepository<User, Long> fournit déjà gratuitement : save(), findById(),
 * findAll(), deleteById(), etc. On ajoute seulement ce qui nous manque.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Recherche un utilisateur par email.
     * Utilisé à 2 endroits critiques :
     * 1. Lors du login (vérifier que l'email existe et comparer le mot de passe)
     * 2. Dans CustomUserDetailsService, pour que Spring Security charge l'utilisateur
     *    à partir du token JWT (qui contient l'email comme identifiant).
     *
     * Optional<User> : évite de retourner null et force l'appelant à gérer
     * explicitement le cas "utilisateur non trouvé" (bonne pratique Java moderne).
     */
    Optional<User> findByEmail(String email);

    /**
     * Vérifie rapidement si un email est déjà utilisé, sans charger l'entité complète.
     * Utilisé lors de l'inscription pour rejeter les doublons avant même
     * de tenter un insert (qui échouerait sinon à cause de la contrainte "unique").
     */
    boolean existsByEmail(String email);
}