# Étape 1 : compilation avec Maven, dans une image temporaire qui ne sera
# JAMAIS incluse dans l'image finale (elle contient tout l'écosystème Maven,
# inutile une fois le .jar produit).
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# On copie le pom.xml SEUL d'abord, et on télécharge les dépendances avant
# de copier le code source : Docker mémorise cette étape en cache, donc si
# tu modifies juste un fichier Java (sans toucher au pom.xml), cette étape
# ne sera PAS ré-exécutée -> reconstructions bien plus rapides.
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# Étape 2 : image finale, légère. Seul le .jar compilé est copié depuis
# l'étape précédente -> Maven et le code source ne font PAS partie de
# l'image livrée, ce qui la rend bien plus petite.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]