package event.service;

import event.dto.CreateEventRequest;
import event.entity.CreatedEvent;
import event.repository.CreatedEventRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CreatedEventService {
    private final CreatedEventRepository repository;

    public CreatedEventService(CreatedEventRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> create(CreateEventRequest request) {
        if (isBlank(request.title()) || isBlank(request.date()) || isBlank(request.time())
            || isBlank(request.venue()) || isBlank(request.city())) {
            throw new IllegalArgumentException("Title, date, time, venue, and city are required");
        }

        CreatedEvent event = new CreatedEvent();
        event.setTitle(request.title().trim());
        event.setType(request.type());
        event.setRevenue(request.revenue());
        event.setAudience(request.audience());
        event.setDate(LocalDateTime.of(LocalDate.parse(request.date()), LocalTime.parse(request.time())));
        event.setVenue(request.venue().trim());
        event.setCountry(request.country());
        event.setCity(request.city().trim());
        event.setArea(request.area());
        event.setDescription(request.description());
        event.setOrganizerEmail(request.organizerEmail());
        return toResponse(repository.save(event));
    }

    public List<Map<String, Object>> findAll() {
        return repository.findAllByOrderByDateAsc().stream().map(this::toResponse).toList();
    }

    private Map<String, Object> toResponse(CreatedEvent event) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", event.getId());
        response.put("title", event.getTitle());
        response.put("type", valueOrEmpty(event.getType()));
        response.put("revenue", valueOrEmpty(event.getRevenue()));
        response.put("audience", valueOrEmpty(event.getAudience()));
        response.put("date", event.getDate().toString());
        response.put("venue", event.getVenue());
        response.put("country", valueOrEmpty(event.getCountry()));
        response.put("city", event.getCity());
        response.put("area", valueOrEmpty(event.getArea()));
        response.put("description", valueOrEmpty(event.getDescription()));
        response.put("attendees", 0);
        response.put("image", "");
        response.put("url", "#");
        return response;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
