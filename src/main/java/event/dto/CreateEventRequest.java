package event.dto;

public record CreateEventRequest(
    String title,
    String type,
    String revenue,
    String audience,
    String date,
    String time,
    String venue,
    String country,
    String city,
    String area,
    String description,
    String organizerEmail
) {}
