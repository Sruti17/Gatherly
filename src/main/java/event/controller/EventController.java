package event.controller;

import event.dto.CreateEventRequest;
import event.service.CreatedEventService;
import event.service.EventService;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")

public class EventController {

    private final EventService eventService;
    private final CreatedEventService createdEventService;

    public EventController(
        EventService eventService,
        CreatedEventService createdEventService
    ) {
        this.eventService = eventService;
        this.createdEventService = createdEventService;
    }

    /*
     * -----------------------------------------------------
     * CREATE EVENT
     * -----------------------------------------------------
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createEvent(
        @RequestBody CreateEventRequest request
    ) {
        return ResponseEntity.ok(
            createdEventService.create(request)
        );
    }

    /*
     * -----------------------------------------------------
     * CREATED GATHERLY EVENTS
     * -----------------------------------------------------
     */
    @GetMapping("/created")
    public ResponseEntity<Map<String, Object>> getCreatedEvents() {

        return ResponseEntity.ok(
            Map.of(
                "events",
                createdEventService.findAll()
            )
        );
    }

    /*
     * -----------------------------------------------------
     * NEARBY EVENTS
     * -----------------------------------------------------
     */
    @GetMapping("/nearby")
    public ResponseEntity<Map<String, Object>> getNearbyEvents(

        @RequestParam
        double latitude,

        @RequestParam
        double longitude,

        @RequestParam(
            required = false,
            defaultValue = ""
        )
        String city,

        @RequestParam(
            required = false,
            defaultValue = ""
        )
        String area,

        @RequestParam(
            required = false,
            defaultValue = ""
        )
        String query,

        @RequestParam(
            defaultValue = "1"
        )
        int page
    ) {

        return ResponseEntity.ok(
            eventService.getNearbyEvents(
                latitude,
                longitude,
                city,
                area,
                query,
                page
            )
        );
    }

    /*
     * -----------------------------------------------------
     * EVENTBRITE-STYLE SEARCH
     * -----------------------------------------------------
     *
     * Example:
     *
     * GET
     * /api/events/search
     * ?query=tech events
     * &country=India
     * &city=Bengaluru
     * &page=1
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchEvents(

        @RequestParam
        String query,

        @RequestParam(
            required = false,
            defaultValue = "India"
        )
        String country,

        @RequestParam(
            required = false,
            defaultValue = "Bengaluru"
        )
        String city,

        @RequestParam(
            defaultValue = "1"
        )
        int page
    ) {

        return ResponseEntity.ok(
            eventService.searchEvents(
                query,
                country,
                city,
                page
            )
        );
    }

    /*
     * -----------------------------------------------------
     * TRENDING EVENTS
     * -----------------------------------------------------
     */
    @GetMapping("/trending")
    public ResponseEntity<Map<String, Object>> getTrendingEvents(

        @RequestParam(
            defaultValue = "Bengaluru"
        )
        String city,

        @RequestParam(
            defaultValue = "3"
        )
        int limit
    ) {

        return ResponseEntity.ok(
            eventService.getTrendingEvents(
                city,
                limit
            )
        );
    }
}