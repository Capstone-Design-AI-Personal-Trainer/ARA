package com.ara.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfigurationLogger {
    private static final Logger log = LoggerFactory.getLogger(DatabaseConfigurationLogger.class);

    @Bean
    CommandLineRunner logDatabaseConfiguration(Environment environment) {
        return args -> {
            String datasourceUrl = environment.getProperty("spring.datasource.url", "");
            String activeProfiles = String.join(",", environment.getActiveProfiles());
            String database = datasourceUrl.contains("postgresql")
                ? "Supabase/PostgreSQL"
                : datasourceUrl.contains("h2")
                    ? "H2 local"
                    : "Unknown";

            log.info("Active Spring profiles: {}", activeProfiles.isBlank() ? "default" : activeProfiles);
            log.info("Active database: {}", database);
            log.info("Datasource URL: {}", maskDatasourceUrl(datasourceUrl));
        };
    }

    private String maskDatasourceUrl(String datasourceUrl) {
        if (datasourceUrl == null || datasourceUrl.isBlank()) {
            return "(not configured)";
        }

        int queryStart = datasourceUrl.indexOf('?');
        String withoutQuery = queryStart >= 0 ? datasourceUrl.substring(0, queryStart) : datasourceUrl;

        if (withoutQuery.startsWith("jdbc:postgresql://")) {
            String prefix = "jdbc:postgresql://";
            String remainder = withoutQuery.substring(prefix.length());
            int slash = remainder.indexOf('/');
            String host = slash >= 0 ? remainder.substring(0, slash) : remainder;
            String database = slash >= 0 ? remainder.substring(slash) : "";
            return prefix + host + database + "?...";
        }

        return withoutQuery;
    }
}
