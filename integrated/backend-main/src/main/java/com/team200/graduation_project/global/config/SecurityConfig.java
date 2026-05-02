package com.team200.graduation_project.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team200.graduation_project.domain.user.repository.UserRepository;
import com.team200.graduation_project.global.apiPayload.ApiResponse;
import com.team200.graduation_project.global.jwt.JwtAuthenticationFilter;
import com.team200.graduation_project.global.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectProvider<JwtAuthenticationFilter> jwtAuthenticationFilterProvider;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origin-patterns}")
    private String allowedOriginPatterns;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationFilter jwtAuthenticationFilter = jwtAuthenticationFilterProvider.getIfAvailable();

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) ->
                                writeSecurityError(response, 401, "COMMON401", "인증이 필요합니다."))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeSecurityError(response, 403, "COMMON403", "접근 권한이 없습니다."))
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/",
                                "/error",
                                "/actuator/health",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/local-uploads/**"
                        ).permitAll()
                        .requestMatchers(
                                "/auth/signup",
                                "/auth/signup/**",
                                "/auth/login",
                                "/auth/login/**",
                                "/auth/toss/login",
                                "/admin/auth/login"
                        ).permitAll()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/ingredient/analyze").authenticated()
                        .requestMatchers(HttpMethod.POST, "/ingredient/input").authenticated()
                        .requestMatchers(HttpMethod.POST, "/ingredient/prediction").authenticated()
                        .requestMatchers(HttpMethod.GET, "/ingredient/all/my/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/ingredient/all/my").authenticated()
                        .requestMatchers("/ingredient/first/login", "/ingredient/allergy", "/ingredient/prefer").authenticated()
                        .requestMatchers(HttpMethod.POST, "/recipe/recommendations").authenticated()
                        .requestMatchers("/share/**", "/chat/**").authenticated()
                        .requestMatchers("/auth/logout", "/auth/deletion", "/auth/mypage/**", "/auth/nickName", "/auth/password").authenticated()
                        .anyRequest().permitAll());

        if (jwtAuthenticationFilter != null) {
            http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(parseCsv(allowedOriginPatterns));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private List<String> parseCsv(String value) {
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(pattern -> !pattern.isBlank())
                .toList();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            ObjectProvider<JwtTokenProvider> jwtTokenProvider,
            ObjectProvider<UserRepository> userRepository
    ) {
        JwtTokenProvider provider = jwtTokenProvider.getIfAvailable();
        UserRepository repository = userRepository.getIfAvailable();
        if (provider == null || repository == null) {
            return null;
        }
        return new JwtAuthenticationFilter(provider, repository);
    }

    private void writeSecurityError(HttpServletResponse response, int status, String code, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.onFailure(code, message));
    }
}
