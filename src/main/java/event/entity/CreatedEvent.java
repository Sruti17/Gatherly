package event.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "events")
public class CreatedEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String type;
    private String revenue;
    private String audience;
    private LocalDateTime date;
    private String venue;
    private String country;
    private String city;
    private String area;
    private String description;
    private String organizerEmail;

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getRevenue() { return revenue; }
    public void setRevenue(String revenue) { this.revenue = revenue; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getOrganizerEmail() { return organizerEmail; }
    public void setOrganizerEmail(String organizerEmail) { this.organizerEmail = organizerEmail; }
}
