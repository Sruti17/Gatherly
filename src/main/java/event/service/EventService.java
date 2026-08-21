package event.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class EventService {

    private static final Logger logger =
        LoggerFactory.getLogger(EventService.class);

    /*
     * IMPORTANT FIX:
     *
     * We now parse complete Event JSON-LD blocks from Eventbrite.
     *
     * Previously, one large regex searched for:
     *
     * name -> image -> date -> URL
     *
     * across the full HTML page.
     *
     * That could combine the title of Event A with the URL of Event B.
     *
     * Parsing one JSON-LD Event object at a time guarantees:
     *
     * title
     * image
     * date
     * location
     * URL
     *
     * all belong to the SAME Eventbrite event.
     */
    private static final Pattern JSON_LD_SCRIPT_PATTERN =
        Pattern.compile(
            "<script\\b(?=[^>]*\\btype\\s*=\\s*[\\\"']application/ld\\+json[\\\"'])[^>]*>(.*?)</script>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
        );

    private static final Pattern EVENTBRITE_EVENT_ID_PATTERN =
        Pattern.compile(
            "(?:tickets-)?(\\d+)$",
            Pattern.CASE_INSENSITIVE
        );

    private static final int NEARBY_PAGE_SIZE = 4;
    private static final int SEARCH_PAGE_SIZE = 12;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    private final String accessToken;
    private final String apiUrl;

    public EventService(

        @Value("${eventbrite.access-token:}")
        String accessToken,

        @Value(
            "${eventbrite.api-url:https://www.eventbriteapi.com/v3/events/search/}"
        )
        String apiUrl
    ) {

        this.objectMapper =
            new ObjectMapper();

        this.accessToken =
            accessToken == null
                ? ""
                : accessToken.trim();

        this.apiUrl =
            apiUrl;

        this.restClient =
            RestClient
                .builder()
                .build();
    }

    /* =========================================================
       NEARBY EVENTS
       ========================================================= */

    public Map<String, Object> getNearbyEvents(

        double latitude,
        double longitude,

        String city,
        String area,
        String query,

        int page
    ) {

        String safeCity =
            safe(city);

        String safeArea =
            safe(area);

        String safeQuery =
            safe(query);

        int safePage =
            Math.max(
                1,
                page
            );

        /*
         * Try API only if an access token exists.
         */
        if (!accessToken.isBlank()) {

            try {

                List<Map<String, Object>>
                    mappedEvents =
                        requestApiEvents(
                            latitude,
                            longitude,
                            safeCity,
                            safeArea,
                            safeQuery,
                            safePage
                        );

                if (!mappedEvents.isEmpty()) {

                    return pageResponse(
                        mappedEvents,
                        safePage,
                        mappedEvents.size()
                            == NEARBY_PAGE_SIZE
                    );
                }

            } catch (Exception exception) {

                logger.warn(
                    "Eventbrite API unavailable; using public city discovery page: {}",
                    exception.getMessage()
                );
            }
        }

        /*
         * Fallback to public Eventbrite discovery page.
         */
        List<Map<String, Object>>
            mappedEvents =
                fetchPublicCityEvents(
                    safeCity,
                    safeArea,
                    safeQuery,
                    safePage
                );

        return pageResponse(
            mappedEvents,
            safePage,
            mappedEvents.size()
                == NEARBY_PAGE_SIZE
        );
    }

    /*
     * Eventbrite API-based retrieval.
     */
    private List<Map<String, Object>> requestApiEvents(

        double latitude,
        double longitude,

        String city,
        String area,
        String query,

        int page
    ) throws Exception {

        String requestUrl =
            UriComponentsBuilder
                .fromUriString(
                    apiUrl
                )

                .queryParamIfPresent(
                    "location.address",

                    city.isBlank()
                        ? java.util.Optional.empty()
                        : java.util.Optional.of(
                            (
                                area
                                    + " "
                                    + city
                            ).trim()
                        )
                )

                .queryParamIfPresent(
                    "location.latitude",

                    city.isBlank()
                        ? java.util.Optional.of(
                            latitude
                        )
                        : java.util.Optional.empty()
                )

                .queryParamIfPresent(
                    "location.longitude",

                    city.isBlank()
                        ? java.util.Optional.of(
                            longitude
                        )
                        : java.util.Optional.empty()
                )

                .queryParamIfPresent(
                    "q",

                    query.isBlank()
                        ? java.util.Optional.empty()
                        : java.util.Optional.of(
                            query
                        )
                )

                .queryParam(
                    "start_date.range_start",
                    java.time.Instant
                        .now()
                        .toString()
                )

                .queryParam(
                    "status",
                    "live"
                )

                .queryParam(
                    "sort_by",
                    "date"
                )

                .queryParam(
                    "expand",
                    "venue"
                )

                .queryParam(
                    "page_size",
                    NEARBY_PAGE_SIZE
                )

                .queryParam(
                    "page",
                    page
                )

                .toUriString();

        String body =
            restClient
                .get()
                .uri(
                    requestUrl
                )
                .header(
                    "Authorization",
                    "Bearer "
                        + accessToken
                )
                .accept(
                    MediaType.APPLICATION_JSON
                )
                .retrieve()
                .body(
                    String.class
                );

        if (
            body == null ||
            body.isBlank()
        ) {

            return List.of();
        }

        JsonNode root =
            objectMapper.readTree(
                body
            );

        List<Map<String, Object>>
            mappedEvents =
                mapApiEvents(
                    root
                );

        sortEventsByDate(
            mappedEvents
        );

        return mappedEvents;
    }

    /*
     * Public city Eventbrite page.
     */
    private List<Map<String, Object>> fetchPublicCityEvents(

        String city,
        String area,
        String query,
        int page
    ) {

        if (city.isBlank()) {
            return List.of();
        }

        String citySlug =
            citySlug(
                city
            );

        String pageUrl =
            "https://www.eventbrite.com/d/india--"
                + citySlug
                + "/events/";

        try {

            String html =
                downloadEventbritePage(
                    pageUrl
                );

            if (html.isBlank()) {

                return List.of();
            }

            /*
             * FIX:
             *
             * Extract every Event as its own JSON-LD object.
             *
             * This ensures title and URL are always connected
             * to the same Eventbrite event.
             */
            List<Map<String, Object>>
                events =
                    extractJsonLdEvents(
                        html,
                        city,
                        200
                    );

            List<Map<String, Object>>
                filteredEvents =
                    new ArrayList<>();

            String areaLower =
                area.toLowerCase();

            String queryLower =
                query.toLowerCase();

            for (
                Map<String, Object> event
                : events
            ) {

                String searchableText =
                    (
                        String.valueOf(
                            event.getOrDefault(
                                "title",
                                ""
                            )
                        )
                            + " "
                            + String.valueOf(
                                event.getOrDefault(
                                    "venue",
                                    ""
                                )
                            )
                            + " "
                            + String.valueOf(
                                event.getOrDefault(
                                    "city",
                                    ""
                                )
                            )
                    )
                        .toLowerCase();

                boolean matchesArea =
                    area.isBlank()
                        ||
                        searchableText.contains(
                            areaLower
                        );

                boolean matchesQuery =
                    query.isBlank()
                        ||
                        searchableText.contains(
                            queryLower
                        );

                if (
                    matchesArea &&
                    matchesQuery
                ) {

                    filteredEvents.add(
                        event
                    );
                }
            }

            sortEventsByDate(
                filteredEvents
            );

            int startIndex =
                (
                    Math.max(
                        1,
                        page
                    )
                        - 1
                )
                    * NEARBY_PAGE_SIZE;

            if (
                startIndex
                    >= filteredEvents.size()
            ) {

                return List.of();
            }

            int endIndex =
                Math.min(
                    startIndex
                        + NEARBY_PAGE_SIZE,

                    filteredEvents.size()
                );

            return new ArrayList<>(
                filteredEvents.subList(
                    startIndex,
                    endIndex
                )
            );

        } catch (Exception exception) {

            logger.warn(
                "Eventbrite public city page request failed for {}: {}",
                city,
                exception.getMessage()
            );

            return List.of();
        }
    }

    /* =========================================================
       SEARCH EVENTS
       ========================================================= */

    public Map<String, Object> searchEvents(

        String query,
        String country,
        String city,

        int page
    ) {

        String cleanQuery =
            safe(
                query
            );

        String resolvedCountry =
            safe(country).isBlank()
                ? "India"
                : safe(country);

        String resolvedCity =
            safe(city).isBlank()
                ? "Bengaluru"
                : safe(city);

        int safePage =
            Math.max(
                1,
                page
            );

        if (cleanQuery.isBlank()) {

            return Map.of(
                "events",
                List.of(),

                "query",
                "",

                "country",
                resolvedCountry,

                "city",
                resolvedCity,

                "page",
                safePage,

                "hasMore",
                false,

                "source",
                "Eventbrite"
            );
        }

        /*
         * Fetch one extra result so we can determine
         * whether another Eventbrite page exists.
         */
        List<Map<String, Object>>
            events =
                fetchEventbriteSearchPage(
                    cleanQuery,
                    resolvedCountry,
                    resolvedCity,
                    safePage,
                    SEARCH_PAGE_SIZE + 1
                );

        boolean hasMore =
            events.size()
                > SEARCH_PAGE_SIZE;

        List<Map<String, Object>>
            visibleEvents =
                hasMore

                    ? new ArrayList<>(
                        events.subList(
                            0,
                            SEARCH_PAGE_SIZE
                        )
                    )

                    : events;

        Map<String, Object>
            response =
                new HashMap<>();

        response.put(
            "events",
            visibleEvents
        );

        response.put(
            "query",
            cleanQuery
        );

        response.put(
            "country",
            resolvedCountry
        );

        response.put(
            "city",
            resolvedCity
        );

        response.put(
            "page",
            safePage
        );

        response.put(
            "hasMore",
            hasMore
        );

        response.put(
            "source",
            "Eventbrite"
        );

        return response;
    }

    /*
     * Eventbrite-style search page.
     *
     * Example:
     *
     * query = tech events
     *
     * creates:
     *
     * https://www.eventbrite.com/d/india--bangalore/tech-events/?page=1
     */
    private List<Map<String, Object>>
        fetchEventbriteSearchPage(

            String query,
            String country,
            String city,
            int page,
            int maximumResults
        ) {

        String countrySlug =
            locationSlug(
                country
            );

        String eventCitySlug =
            citySlug(
                city
            );

        String querySlug =
            searchSlug(
                query
            );

        String pageUrl =
            "https://www.eventbrite.com/d/"
                + countrySlug
                + "--"
                + eventCitySlug
                + "/"
                + querySlug
                + "/?page="
                + page;

        logger.info(
            "Loading Eventbrite search page: {}",
            pageUrl
        );

        try {

            String html =
                downloadEventbritePage(
                    pageUrl
                );

            return html.isBlank()

                ? List.of()

                : extractJsonLdEvents(
                    html,
                    city,
                    maximumResults
                );

        } catch (Exception exception) {

            logger.warn(
                "Eventbrite search request failed for '{}': {}",
                query,
                exception.getMessage()
            );

            return List.of();
        }
    }

    /* =========================================================
       TRENDING EVENTS
       ========================================================= */

    public Map<String, Object> getTrendingEvents(

        String city,
        int limit
    ) {

        String resolvedCity =
            safe(city).isBlank()
                ? "Bengaluru"
                : safe(city);

        int safeLimit =
            Math.max(
                1,
                Math.min(
                    limit,
                    6
                )
            );

        List<Map<String, Object>>
            events =
                fetchTrendingCityEvents(
                    resolvedCity,
                    safeLimit
                );

        Map<String, Object>
            response =
                new HashMap<>();

        response.put(
            "events",
            events
        );

        response.put(
            "city",
            resolvedCity
        );

        response.put(
            "source",
            "Eventbrite"
        );

        response.put(
            "count",
            events.size()
        );

        return response;
    }

    private List<Map<String, Object>>
        fetchTrendingCityEvents(

            String city,
            int limit
        ) {

        if (city.isBlank()) {

            return List.of();
        }

        String pageUrl =
            "https://www.eventbrite.com/d/india--"
                + citySlug(
                    city
                )
                + "/events/";

        try {

            String html =
                downloadEventbritePage(
                    pageUrl
                );

            return html.isBlank()

                ? List.of()

                : extractJsonLdEvents(
                    html,
                    city,
                    limit
                );

        } catch (Exception exception) {

            logger.warn(
                "Unable to load trending Eventbrite events for {}: {}",
                city,
                exception.getMessage()
            );

            return List.of();
        }
    }

    /* =========================================================
       EVENTBRITE PAGE DOWNLOADER
       ========================================================= */

    private String downloadEventbritePage(
        String pageUrl
    ) {

        String html =
            restClient
                .get()
                .uri(
                    pageUrl
                )
                .header(
                    "User-Agent",

                    "Mozilla/5.0 "
                        + "(Windows NT 10.0; Win64; x64) "
                        + "AppleWebKit/537.36 "
                        + "(KHTML, like Gecko) "
                        + "Chrome/124.0 Safari/537.36"
                )
                .header(
                    "Accept-Language",
                    "en-US,en;q=0.9"
                )
                .accept(
                    MediaType.TEXT_HTML
                )
                .retrieve()
                .body(
                    String.class
                );

        return html == null
            ? ""
            : html;
    }

    /* =========================================================
       CORRECT EVENTBRITE JSON-LD PARSER
       ========================================================= */

    /**
     * Parse Eventbrite schema.org JSON-LD.
     *
     * Each Event object is read individually.
     *
     * This fixes the bug where clicking a card opened
     * a different Eventbrite event.
     */
    private List<Map<String, Object>>
        extractJsonLdEvents(

            String html,
            String fallbackCity,
            int maximumResults
        ) {

        List<Map<String, Object>>
            events =
                new ArrayList<>();

        Set<String>
            seenUrls =
                new HashSet<>();

        Matcher scriptMatcher =
            JSON_LD_SCRIPT_PATTERN.matcher(
                html
            );

        while (
            scriptMatcher.find()
                &&
                events.size()
                    < maximumResults
        ) {

            String json =
                scriptMatcher
                    .group(1)
                    .trim();

            if (json.isBlank()) {
                continue;
            }

            try {

                JsonNode root =
                    objectMapper.readTree(
                        json
                    );

                collectEventNodes(
                    root,
                    fallbackCity,
                    events,
                    seenUrls,
                    maximumResults
                );

            } catch (Exception exception) {

                logger.debug(
                    "Skipping invalid Eventbrite JSON-LD block: {}",
                    exception.getMessage()
                );
            }
        }

        logger.info(
            "Parsed {} correctly-linked Eventbrite JSON-LD events",
            events.size()
        );

        return events;
    }

    /*
     * Recursively search JSON-LD objects and arrays.
     *
     * Eventbrite may structure JSON-LD as:
     *
     * Event
     *
     * or:
     *
     * [
     *   Event,
     *   Event
     * ]
     *
     * or nested under @graph.
     */
    private void collectEventNodes(

        JsonNode node,

        String fallbackCity,

        List<Map<String, Object>>
            events,

        Set<String>
            seenUrls,

        int maximumResults
    ) {

        if (
            node == null
                ||
                node.isNull()
                ||
                events.size()
                    >= maximumResults
        ) {

            return;
        }

        /*
         * JSON array.
         */
        if (node.isArray()) {

            for (
                JsonNode child
                : node
            ) {

                collectEventNodes(
                    child,
                    fallbackCity,
                    events,
                    seenUrls,
                    maximumResults
                );

                if (
                    events.size()
                        >= maximumResults
                ) {

                    return;
                }
            }

            return;
        }

        /*
         * Ignore primitive values.
         */
        if (!node.isObject()) {

            return;
        }

        /*
         * Found an Event object.
         */
        if (isEventNode(node)) {

            Map<String, Object>
                mapped =
                    mapJsonLdEvent(
                        node,
                        fallbackCity
                    );

            String url =
                String.valueOf(
                    mapped.getOrDefault(
                        "url",
                        ""
                    )
                );

            /*
             * Deduplicate based on canonical Eventbrite URL.
             */
            if (
                !url.isBlank()
                    &&
                    seenUrls.add(
                        url
                    )
            ) {

                events.add(
                    mapped
                );

                if (
                    events.size()
                        >= maximumResults
                ) {

                    return;
                }
            }
        }

        /*
         * Continue searching nested objects such as @graph.
         */
        node.fields()
            .forEachRemaining(
                entry -> {

                    if (
                        events.size()
                            < maximumResults
                    ) {

                        collectEventNodes(
                            entry.getValue(),
                            fallbackCity,
                            events,
                            seenUrls,
                            maximumResults
                        );
                    }
                }
            );
    }

    /*
     * Determine whether a JSON-LD node represents
     * schema.org Event.
     */
    private boolean isEventNode(
        JsonNode node
    ) {

        JsonNode type =
            node.get(
                "@type"
            );

        if (
            type == null
                ||
                type.isNull()
        ) {

            return false;
        }

        if (type.isTextual()) {

            return "Event"
                .equalsIgnoreCase(
                    type.asText()
                );
        }

        if (type.isArray()) {

            for (
                JsonNode value
                : type
            ) {

                if (
                    value.isTextual()
                        &&
                        "Event"
                            .equalsIgnoreCase(
                                value.asText()
                            )
                ) {

                    return true;
                }
            }
        }

        return false;
    }

    /*
     * Convert one JSON-LD Event object into
     * Gatherly event format.
     */
    private Map<String, Object>
        mapJsonLdEvent(

            JsonNode eventNode,
            String fallbackCity
        ) {

        String title =
            text(
                eventNode.get(
                    "name"
                )
            );

        String date =
            text(
                eventNode.get(
                    "startDate"
                )
            );

        String url =
            canonicalEventUrl(
                text(
                    eventNode.get(
                        "url"
                    )
                )
            );

        String image =
            extractImageUrl(
                eventNode.get(
                    "image"
                )
            );

        String venue =
            extractVenue(
                eventNode.get(
                    "location"
                ),
                fallbackCity
            );

        String city =
            extractCity(
                eventNode.get(
                    "location"
                ),
                fallbackCity
            );

        Map<String, Object>
            event =
                new HashMap<>();

        event.put(
            "id",
            extractEventId(
                url
            )
        );

        event.put(
            "title",
            title.isBlank()
                ? "Eventbrite event"
                : title
        );

        event.put(
            "date",
            date
        );

        event.put(
            "image",
            image
        );

        event.put(
            "venue",
            venue
        );

        event.put(
            "city",
            city
        );

        event.put(
            "url",
            url
        );

        event.put(
            "attendees",
            0
        );

        event.put(
            "source",
            "Eventbrite"
        );

        return event;
    }

    /*
     * Eventbrite JSON-LD image can be:
     *
     * "https://..."
     *
     * or:
     *
     * {
     *   "url": "..."
     * }
     *
     * or an array.
     */
    private String extractImageUrl(
        JsonNode imageNode
    ) {

        if (
            imageNode == null
                ||
                imageNode.isNull()
        ) {

            return "";
        }

        if (imageNode.isTextual()) {

            return imageNode.asText(
                ""
            );
        }

        if (imageNode.isArray()) {

            for (
                JsonNode item
                : imageNode
            ) {

                String image =
                    extractImageUrl(
                        item
                    );

                if (!image.isBlank()) {

                    return image;
                }
            }

            return "";
        }

        if (imageNode.isObject()) {

            String url =
                text(
                    imageNode.get(
                        "url"
                    )
                );

            if (!url.isBlank()) {

                return url;
            }

            String contentUrl =
                text(
                    imageNode.get(
                        "contentUrl"
                    )
                );

            if (!contentUrl.isBlank()) {

                return contentUrl;
            }
        }

        return "";
    }

    /*
     * Extract proper venue information.
     */
    private String extractVenue(

        JsonNode locationNode,
        String fallbackCity
    ) {

        if (
            locationNode == null
                ||
                locationNode.isNull()
        ) {

            return fallbackCity;
        }

        /*
         * Multiple location values.
         */
        if (locationNode.isArray()) {

            for (
                JsonNode location
                : locationNode
            ) {

                String venue =
                    extractVenue(
                        location,
                        fallbackCity
                    );

                if (
                    !venue.isBlank()
                        &&
                        !venue.equals(
                            fallbackCity
                        )
                ) {

                    return venue;
                }
            }

            return fallbackCity;
        }

        /*
         * String-only location.
         */
        if (locationNode.isTextual()) {

            return locationNode.asText(
                fallbackCity
            );
        }

        String venueName =
            text(
                locationNode.get(
                    "name"
                )
            );

        JsonNode address =
            locationNode.get(
                "address"
            );

        String locality =
            "";

        String street =
            "";

        if (
            address != null
                &&
                address.isObject()
        ) {

            locality =
                text(
                    address.get(
                        "addressLocality"
                    )
                );

            street =
                text(
                    address.get(
                        "streetAddress"
                    )
                );

        } else if (
            address != null
                &&
                address.isTextual()
        ) {

            street =
                address.asText(
                    ""
                );
        }

        List<String>
            parts =
                new ArrayList<>();

        addDistinct(
            parts,
            venueName
        );

        addDistinct(
            parts,
            street
        );

        addDistinct(
            parts,
            locality
        );

        return parts.isEmpty()

            ? fallbackCity

            : String.join(
                ", ",
                parts
            );
    }

    /*
     * Extract city from Eventbrite's location object.
     */
    private String extractCity(

        JsonNode locationNode,
        String fallbackCity
    ) {

        if (
            locationNode == null
                ||
                locationNode.isNull()
        ) {

            return fallbackCity;
        }

        if (locationNode.isArray()) {

            for (
                JsonNode location
                : locationNode
            ) {

                String city =
                    extractCity(
                        location,
                        ""
                    );

                if (!city.isBlank()) {

                    return city;
                }
            }

            return fallbackCity;
        }

        if (!locationNode.isObject()) {

            return fallbackCity;
        }

        JsonNode address =
            locationNode.get(
                "address"
            );

        if (
            address != null
                &&
                address.isObject()
        ) {

            String locality =
                text(
                    address.get(
                        "addressLocality"
                    )
                );

            if (!locality.isBlank()) {

                return locality;
            }
        }

        return fallbackCity;
    }

    /*
     * Normalize Eventbrite URL.
     *
     * Removes tracking query parameters so the exact
     * canonical event URL becomes the link used by Gatherly.
     */
    private String canonicalEventUrl(
        String rawUrl
    ) {

        if (rawUrl == null) {

            return "";
        }

        String url =
            rawUrl
                .trim()
                .replace(
                    "\\/",
                    "/"
                )
                .replace(
                    "&amp;",
                    "&"
                );

        if (url.isBlank()) {

            return "";
        }

        /*
         * Remove Eventbrite tracking parameters.
         */
        int queryIndex =
            url.indexOf(
                '?'
            );

        if (
            queryIndex >= 0
        ) {

            url =
                url.substring(
                    0,
                    queryIndex
                );
        }

        /*
         * Remove fragments.
         */
        int fragmentIndex =
            url.indexOf(
                '#'
            );

        if (
            fragmentIndex >= 0
        ) {

            url =
                url.substring(
                    0,
                    fragmentIndex
                );
        }

        /*
         * Remove trailing slash.
         */
        while (
            url.endsWith("/")
        ) {

            url =
                url.substring(
                    0,
                    url.length() - 1
                );
        }

        return url;
    }

    /*
     * Extract Eventbrite event ID.
     */
    private String extractEventId(
        String eventUrl
    ) {

        String canonical =
            canonicalEventUrl(
                eventUrl
            );

        if (canonical.isBlank()) {

            return "";
        }

        int lastSlash =
            canonical.lastIndexOf(
                '/'
            );

        String lastPart =
            lastSlash >= 0

                ? canonical.substring(
                    lastSlash + 1
                )

                : canonical;

        Matcher matcher =
            EVENTBRITE_EVENT_ID_PATTERN.matcher(
                lastPart
            );

        if (matcher.find()) {

            return matcher.group(
                1
            );
        }

        /*
         * Fallback stable ID.
         */
        return Integer.toHexString(
            canonical.hashCode()
        );
    }

    /* =========================================================
       COMMON HELPERS
       ========================================================= */

    private Map<String, Object>
        pageResponse(

            List<Map<String, Object>>
                events,

            int page,

            boolean hasMore
        ) {

        return Map.of(
            "events",
            events,

            "page",
            page,

            "hasMore",
            hasMore
        );
    }

    private void sortEventsByDate(

        List<Map<String, Object>>
            events
    ) {

        events.sort(
            Comparator.comparing(
                event ->
                    String.valueOf(
                        event.getOrDefault(
                            "date",
                            "9999-12-31"
                        )
                    )
            )
        );
    }

    public boolean isConfigured() {

        return !accessToken.isBlank();
    }

    /*
     * Map normal Eventbrite API response into
     * Gatherly event format.
     */
    private List<Map<String, Object>>
        mapApiEvents(
            JsonNode root
        ) {

        List<Map<String, Object>>
            mappedEvents =
                new ArrayList<>();

        for (
            JsonNode event
            : root.path(
                "events"
            )
        ) {

            JsonNode address =
                event
                    .path(
                        "venue"
                    )
                    .path(
                        "address"
                    );

            String venueName =
                event
                    .path(
                        "venue"
                    )
                    .path(
                        "name"
                    )
                    .asText(
                        ""
                    );

            String city =
                address
                    .path(
                        "city"
                    )
                    .asText(
                        ""
                    );

            String area =
                address
                    .path(
                        "localized_area_display"
                    )
                    .asText(
                        ""
                    );

            List<String>
                venueParts =
                    new ArrayList<>();

            addDistinct(
                venueParts,
                venueName
            );

            addDistinct(
                venueParts,
                area
            );

            addDistinct(
                venueParts,
                city
            );

            Map<String, Object>
                mappedEvent =
                    new HashMap<>();

            mappedEvent.put(
                "id",
                event
                    .path(
                        "id"
                    )
                    .asText()
            );

            mappedEvent.put(
                "title",
                event
                    .path(
                        "name"
                    )
                    .path(
                        "text"
                    )
                    .asText(
                        "Local event"
                    )
            );

            mappedEvent.put(
                "date",
                event
                    .path(
                        "start"
                    )
                    .path(
                        "local"
                    )
                    .asText(
                        ""
                    )
            );

            mappedEvent.put(
                "image",
                event
                    .path(
                        "logo"
                    )
                    .path(
                        "url"
                    )
                    .asText(
                        ""
                    )
            );

            mappedEvent.put(
                "venue",
                String.join(
                    ", ",
                    venueParts
                )
            );

            mappedEvent.put(
                "city",
                city
            );

            mappedEvent.put(
                "url",
                canonicalEventUrl(
                    event
                        .path(
                            "url"
                        )
                        .asText(
                            ""
                        )
                )
            );

            mappedEvent.put(
                "attendees",
                0
            );

            mappedEvent.put(
                "source",
                "Eventbrite"
            );

            mappedEvents.add(
                mappedEvent
            );
        }

        return mappedEvents;
    }

    /*
     * Bengaluru is called "bangalore" in Eventbrite URLs.
     */
    private String citySlug(
        String city
    ) {

        String slug =
            locationSlug(
                city
            );

        return "bengaluru".equals(
            slug
        )
            ? "bangalore"
            : slug;
    }

    /*
     * Example:
     *
     * New Delhi
     *
     * becomes:
     *
     * new-delhi
     */
    private String locationSlug(
        String value
    ) {

        return safe(
            value
        )
            .toLowerCase()
            .replaceAll(
                "[^a-z0-9]+",
                "-"
            )
            .replaceAll(
                "^-+|-+$",
                ""
            );
    }

    /*
     * Example:
     *
     * tech events
     *
     * becomes:
     *
     * tech-events
     */
    private String searchSlug(
        String query
    ) {

        String slug =
            locationSlug(
                query
            );

        return slug.isBlank()
            ? "events"
            : slug;
    }

    private String safe(
        String value
    ) {

        return value == null
            ? ""
            : value.trim();
    }

    private String text(
        JsonNode node
    ) {

        return (
            node == null ||
            node.isNull()
        )
            ? ""
            : node.asText(
                ""
            );
    }

    private void addDistinct(

        List<String> parts,
        String value
    ) {

        String clean =
            safe(
                value
            );

        if (
            !clean.isBlank()
                &&
                !parts.contains(
                    clean
                )
        ) {

            parts.add(
                clean
            );
        }
    }
}