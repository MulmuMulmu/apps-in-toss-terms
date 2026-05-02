package com.team200.graduation_project.global.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.storage.Storage;
import com.team200.graduation_project.domain.ingredient.entity.Ingredient;
import com.team200.graduation_project.domain.ingredient.entity.IngredientAlias;
import com.team200.graduation_project.domain.ingredient.repository.IngredientAliasRepository;
import com.team200.graduation_project.domain.ingredient.repository.IngredientRepository;
import com.team200.graduation_project.domain.recipe.entity.Recipe;
import com.team200.graduation_project.domain.recipe.entity.RecipeIngredient;
import com.team200.graduation_project.domain.recipe.entity.RecipeStep;
import com.team200.graduation_project.domain.recipe.repository.RecipeIngredientRepository;
import com.team200.graduation_project.domain.recipe.repository.RecipeRepository;
import com.team200.graduation_project.domain.recipe.repository.RecipeStepRepository;
import com.team200.graduation_project.domain.user.entity.Role;
import com.team200.graduation_project.domain.user.entity.User;
import com.team200.graduation_project.domain.user.entity.UserStatus;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("local")
public class LocalDevConfig {

    @Bean
    public Storage localNoOpStorage() {
        return (Storage) Proxy.newProxyInstance(
                Storage.class.getClassLoader(),
                new Class<?>[]{Storage.class},
                (proxy, method, args) -> defaultValue(method.getReturnType())
        );
    }

    @Bean
    public CommandLineRunner localSeedData(
            UserRepository userRepository,
            IngredientRepository ingredientRepository,
            IngredientAliasRepository ingredientAliasRepository,
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            RecipeStepRepository recipeStepRepository,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        return args -> {
            seedUser(userRepository, passwordEncoder, "mulmuAdmin", "최고관리자", Role.ADMIN);
            seedUser(userRepository, passwordEncoder, "user1", "나연", Role.USER);
            seedUser(userRepository, passwordEncoder, "user2", "다연", Role.USER);

            seedIngredients(ingredientRepository, objectMapper);
            seedIngredientAliases(ingredientRepository, ingredientAliasRepository, objectMapper);
            seedRecipes(
                    ingredientRepository,
                    recipeRepository,
                    recipeIngredientRepository,
                    recipeStepRepository,
                    ingredientAliasRepository,
                    objectMapper
            );
        };
    }

    private void seedRecipes(
            IngredientRepository ingredientRepository,
            RecipeRepository recipeRepository,
            RecipeIngredientRepository recipeIngredientRepository,
            RecipeStepRepository recipeStepRepository,
            IngredientAliasRepository ingredientAliasRepository,
            ObjectMapper objectMapper
    ) throws Exception {
        if (recipeRepository.count() > 0) {
            return;
        }

        List<SeedRecipe> seedRecipes = loadSeedRecipes(objectMapper);
        List<SeedRecipeIngredient> seedRecipeIngredients = loadSeedRecipeIngredients(objectMapper);
        List<SeedRecipeStep> seedRecipeSteps = loadSeedRecipeSteps(objectMapper);
        Map<UUID, SeedSourceIngredient> sourceIngredients = loadSeedSourceIngredients(objectMapper).stream()
                .filter(ingredient -> ingredient.ingredientId() != null)
                .collect(Collectors.toMap(SeedSourceIngredient::ingredientId, Function.identity(), (left, right) -> left));

        Map<String, Ingredient> ingredientsByName = ingredientRepository.findAll().stream()
                .collect(Collectors.toMap(Ingredient::getIngredientName, Function.identity(), (left, right) -> left));

        for (SeedRecipe seedRecipe : seedRecipes) {
            recipeRepository.save(Recipe.builder()
                    .recipeId(seedRecipe.recipeId())
                    .name(seedRecipe.name())
                    .category(seedRecipe.category())
                    .imageUrl(seedRecipe.imageUrl())
                    .build());
        }

        Map<UUID, Recipe> recipesById = recipeRepository.findAll().stream()
                .collect(Collectors.toMap(Recipe::getRecipeId, Function.identity()));

        for (SeedRecipeIngredient seedRecipeIngredient : seedRecipeIngredients) {
            Recipe recipe = recipesById.get(seedRecipeIngredient.recipeId());
            SeedSourceIngredient sourceIngredient = sourceIngredients.get(seedRecipeIngredient.ingredientId());
            Ingredient ingredient = resolveCanonicalIngredient(sourceIngredient, ingredientsByName, ingredientAliasRepository);
            if (recipe == null || sourceIngredient == null || sourceIngredient.ingredientName() == null
                    || sourceIngredient.ingredientName().isBlank()) {
                continue;
            }

            recipeIngredientRepository.save(RecipeIngredient.builder()
                    .recipeIngredientId(seedRecipeIngredient.recipeIngredientId())
                    .recipe(recipe)
                    .ingredient(ingredient)
                    .sourceIngredientName(sourceIngredient.ingredientName())
                    .amount(seedRecipeIngredient.amount())
                    .unit(seedRecipeIngredient.unit())
                    .build());
        }

        for (SeedRecipeStep seedRecipeStep : seedRecipeSteps) {
            Recipe recipe = recipesById.get(seedRecipeStep.recipeId());
            if (recipe == null) {
                continue;
            }

            recipeStepRepository.save(RecipeStep.builder()
                    .recipeStepId(seedRecipeStep.recipeStepId())
                    .recipe(recipe)
                    .stepOrder(seedRecipeStep.stepOrder())
                    .description(seedRecipeStep.description())
                    .build());
        }
    }

    private Ingredient resolveCanonicalIngredient(
            SeedSourceIngredient sourceIngredient,
            Map<String, Ingredient> ingredientsByName,
            IngredientAliasRepository ingredientAliasRepository
    ) {
        if (sourceIngredient == null || sourceIngredient.ingredientName() == null) {
            return null;
        }

        Ingredient exactIngredient = ingredientsByName.get(sourceIngredient.ingredientName());
        if (exactIngredient != null) {
            return exactIngredient;
        }

        return ingredientAliasRepository
                .findByNormalizedAliasName(IngredientAlias.normalize(sourceIngredient.ingredientName()))
                .map(IngredientAlias::getIngredient)
                .orElse(null);
    }

    private void seedIngredientAliases(
            IngredientRepository ingredientRepository,
            IngredientAliasRepository ingredientAliasRepository,
            ObjectMapper objectMapper
    ) throws Exception {
        for (SeedIngredientAlias seedAlias : loadSeedIngredientAliases(objectMapper)) {
            if (seedAlias.aliasName() == null || seedAlias.aliasName().isBlank()
                    || seedAlias.ingredientName() == null || seedAlias.ingredientName().isBlank()) {
                continue;
            }
            seedIngredientAlias(
                    ingredientRepository,
                    ingredientAliasRepository,
                    seedAlias.aliasName(),
                    seedAlias.ingredientName()
            );
        }
    }

    private void seedIngredients(IngredientRepository ingredientRepository, ObjectMapper objectMapper) throws Exception {
        for (SeedIngredient seedIngredient : loadSeedIngredients(objectMapper)) {
            if (seedIngredient.ingredientName() == null || seedIngredient.ingredientName().isBlank()) {
                continue;
            }
            if (ingredientRepository.findByIngredientName(seedIngredient.ingredientName()).isEmpty()) {
                ingredientRepository.save(Ingredient.builder()
                        .ingredientName(seedIngredient.ingredientName())
                        .category(seedIngredient.category())
                        .build());
            }
        }
    }

    private List<SeedIngredient> loadSeedIngredients(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/canonical_ingredients.json");
        if (resource.exists()) {
            return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
            });
        }

        return List.of(
                new SeedIngredient("우유", "유제품"),
                new SeedIngredient("양파", "채소/과일"),
                new SeedIngredient("대파", "채소/과일"),
                new SeedIngredient("김치", "가공식품"),
                new SeedIngredient("돼지고기", "정육/계란"),
                new SeedIngredient("계란", "정육/계란")
        );
    }

    private List<SeedIngredientAlias> loadSeedIngredientAliases(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/canonical_ingredient_aliases.json");
        if (resource.exists()) {
            return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
            });
        }

        return List.of(
                new SeedIngredientAlias("서울우유", "우유"),
                new SeedIngredientAlias("쇠고기", "소고기"),
                new SeedIngredientAlias("달걀", "계란"),
                new SeedIngredientAlias("다진마늘", "마늘")
        );
    }

    private List<SeedRecipe> loadSeedRecipes(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/recipes.json");
        if (!resource.exists()) {
            return List.of();
        }
        return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
        });
    }

    private List<SeedRecipeIngredient> loadSeedRecipeIngredients(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/recipe_ingredients.json");
        if (!resource.exists()) {
            return List.of();
        }
        return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
        });
    }

    private List<SeedRecipeStep> loadSeedRecipeSteps(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/recipe_steps.json");
        if (!resource.exists()) {
            return List.of();
        }
        return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
        });
    }

    private List<SeedSourceIngredient> loadSeedSourceIngredients(ObjectMapper objectMapper) throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/recipe_source_ingredients.json");
        if (!resource.exists()) {
            return List.of();
        }
        return objectMapper.readValue(resource.getInputStream(), new TypeReference<>() {
        });
    }

    private void seedIngredientAlias(
            IngredientRepository ingredientRepository,
            IngredientAliasRepository ingredientAliasRepository,
            String aliasName,
            String ingredientName
    ) {
        String normalizedAliasName = IngredientAlias.normalize(aliasName);
        if (ingredientAliasRepository.findByNormalizedAliasName(normalizedAliasName).isPresent()) {
            return;
        }

        ingredientRepository.findByIngredientName(ingredientName)
                .ifPresent(ingredient -> ingredientAliasRepository.save(IngredientAlias.builder()
                        .aliasName(aliasName)
                        .normalizedAliasName(normalizedAliasName)
                        .ingredient(ingredient)
                        .source("local_seed")
                        .build()));
    }

    private void seedUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String userId,
            String nickName,
            Role role
    ) {
        if (userRepository.findByUserIdIs(userId).isPresent()) {
            return;
        }

        userRepository.save(User.builder()
                .userId(userId)
                .password(passwordEncoder.encode("1234"))
                .nickName(nickName)
                .firstLogin(false)
                .imageUrl("")
                .status(UserStatus.NORMAL)
                .role(role)
                .warmingCount(0L)
                .build());
    }

    private Object defaultValue(Class<?> returnType) {
        if (returnType == Boolean.TYPE) {
            return false;
        }
        if (returnType == Byte.TYPE) {
            return (byte) 0;
        }
        if (returnType == Short.TYPE) {
            return (short) 0;
        }
        if (returnType == Integer.TYPE) {
            return 0;
        }
        if (returnType == Long.TYPE) {
            return 0L;
        }
        if (returnType == Float.TYPE) {
            return 0F;
        }
        if (returnType == Double.TYPE) {
            return 0D;
        }
        if (returnType == Character.TYPE) {
            return '\0';
        }
        return null;
    }

    private record SeedIngredient(String ingredientName, String category) {
    }

    private record SeedIngredientAlias(String aliasName, String ingredientName) {
    }

    private record SeedRecipe(UUID recipeId, String name, String category, String imageUrl) {
    }

    private record SeedRecipeIngredient(
            UUID recipeIngredientId,
            UUID recipeId,
            UUID ingredientId,
            Double amount,
            String unit
    ) {
    }

    private record SeedRecipeStep(UUID recipeStepId, UUID recipeId, Long stepOrder, String description) {
    }

    private record SeedSourceIngredient(UUID ingredientId, String ingredientName, String category) {
    }
}
