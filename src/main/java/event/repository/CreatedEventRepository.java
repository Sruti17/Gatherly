package event.repository;

import event.entity.CreatedEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreatedEventRepository extends JpaRepository<CreatedEvent, Long> {
    List<CreatedEvent> findAllByOrderByDateAsc();
}
