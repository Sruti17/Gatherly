package com.gatherly.gatherly;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = {"com", "common", "event"}) // This tells Spring to look in all your root folders
@EnableJpaRepositories(basePackages = {"com.auth.repository", "event.repository"})
@EntityScan(basePackages = {"com.auth.entity", "event.entity"})
public class GatherlyApplication {

	public static void main(String[] args) {
		SpringApplication.run(GatherlyApplication.class, args);
	}

}
