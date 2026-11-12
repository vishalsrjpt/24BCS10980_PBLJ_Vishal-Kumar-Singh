package com.campusfind.service;

import com.campusfind.dto.response.ItemImageResponse;
import com.campusfind.dto.response.ItemMatchResponse;
import com.campusfind.dto.response.PageResponse;
import com.campusfind.entity.ItemImage;
import com.campusfind.entity.ItemMatch;
import com.campusfind.entity.ItemReport;
import com.campusfind.entity.User;
import com.campusfind.enums.NotificationType;
import com.campusfind.enums.ReportType;
import com.campusfind.repository.ItemMatchRepository;
import com.campusfind.repository.ItemReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Intelligent deterministic matching engine for CampusFind.
 * Calculates weighted similarity between LOST and FOUND items.
 *
 * Weights:
 * - Title similarity: 25%
 * - Description similarity: 20%
 * - Category match: 15%
 * - Colour match: 10%
 * - Brand match: 10%
 * - Location proximity: 10%
 * - Date proximity: 10%
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmartMatchingService {

    private final ItemMatchRepository matchRepository;
    private final ItemReportRepository reportRepository;
    private final NotificationService notificationService;

    private static final double HIGH_MATCH_THRESHOLD = 80.0;
    private static final double POSSIBLE_MATCH_THRESHOLD = 60.0;

    private static final Set<String> STOP_WORDS = Set.of(
            "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
            "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
            "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from",
            "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself", "him",
            "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
            "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once", "only",
            "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
            "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there",
            "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
            "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with", "would",
            "you", "your", "yours", "yourself", "yourselves"
    );

    private static final Pattern PUNCTUATION_PATTERN = Pattern.compile("[^a-zA-Z0-9\\s]");

    /**
     * Run matching for a newly created or updated report against candidate reports of opposite type.
     */
    @Transactional
    public List<ItemMatch> findAndSaveMatches(ItemReport report) {
        ReportType oppositeType = (report.getReportType() == ReportType.LOST) ? ReportType.FOUND : ReportType.LOST;
        List<ItemReport> candidates = reportRepository.findCandidateMatches(oppositeType, report.getId());

        List<ItemMatch> savedMatches = new ArrayList<>();

        for (ItemReport candidate : candidates) {
            ItemReport lost = (report.getReportType() == ReportType.LOST) ? report : candidate;
            ItemReport found = (report.getReportType() == ReportType.FOUND) ? report : candidate;

            // Prevent self-matching or same reporter match if desired, but allow different items
            if (matchRepository.existsByLostReportIdAndFoundReportId(lost.getId(), found.getId())) {
                continue;
            }

            MatchResult result = calculateSimilarity(lost, found);

            if (result.totalScore >= POSSIBLE_MATCH_THRESHOLD) {
                ItemMatch match = ItemMatch.builder()
                        .lostReport(lost)
                        .foundReport(found)
                        .similarityScore(Math.round(result.totalScore * 10.0) / 10.0)
                        .matchReason(result.reasonSummary)
                        .notificationSent(true)
                        .build();

                ItemMatch saved = matchRepository.save(match);
                savedMatches.add(saved);

                // Notify Lost Reporter
                notifyReporter(lost.getReporter(), lost, found, match.getSimilarityScore(), "found");
                // Notify Found Reporter
                notifyReporter(found.getReporter(), found, lost, match.getSimilarityScore(), "lost");
            }
        }

        return savedMatches;
    }

    private void notifyReporter(User recipient, ItemReport userItem, ItemReport matchedItem, double score, String matchedType) {
        String level = score >= HIGH_MATCH_THRESHOLD ? "High" : "Possible";
        String title = level + " Match Detected (" + (int) score + "%)";
        String message = String.format("A potential matching %s item '%s' has been reported for your item '%s' near %s.",
                matchedType, matchedItem.getTitle(), userItem.getTitle(), matchedItem.getLocation());

        notificationService.createNotification(
                recipient,
                title,
                message,
                NotificationType.MATCH_FOUND,
                "MATCH",
                matchedItem.getId()
        );
    }

    /**
     * Core deterministic scoring algorithm.
     */
    public MatchResult calculateSimilarity(ItemReport lost, ItemReport found) {
        StringBuilder reasons = new StringBuilder();

        // 1. Title Similarity (25%)
        double titleSim = calculateTextJaccard(lost.getTitle(), found.getTitle());
        double titleScore = titleSim * 25.0;
        if (titleSim > 0.3) {
            reasons.append("Title keywords aligned (").append((int)(titleSim * 100)).append("%); ");
        }

        // 2. Description Similarity (20%)
        double descSim = calculateTextJaccard(lost.getDescription(), found.getDescription());
        double descScore = descSim * 20.0;
        if (descSim > 0.25) {
            reasons.append("Description details strongly match; ");
        }

        // 3. Category Match (15%)
        double categoryScore = 0.0;
        if (lost.getCategory() == found.getCategory()) {
            categoryScore = 15.0;
            reasons.append("Same category (").append(lost.getCategory().getDisplayName()).append("); ");
        }

        // 4. Colour Match (10%)
        double colorScore = calculateAttributeMatch(lost.getColor(), found.getColor(), lost.getDescription(), found.getDescription());
        if (colorScore > 5.0) {
            reasons.append("Color matched; ");
        }

        // 5. Brand Match (10%)
        double brandScore = calculateAttributeMatch(lost.getBrand(), found.getBrand(), lost.getTitle(), found.getTitle());
        if (brandScore > 5.0) {
            reasons.append("Brand matched; ");
        }

        // 6. Location Proximity (10%)
        double locSim = calculateTextJaccard(lost.getLocation(), found.getLocation());
        double locScore = locSim * 10.0;
        if (locSim > 0.3) {
            reasons.append("Similar location area (").append(found.getLocation()).append("); ");
        }

        // 7. Date Proximity (10%)
        double dateScore = calculateDateProximity(lost.getEventDate(), found.getEventDate());
        if (dateScore >= 7.0) {
            reasons.append("Dates within close proximity; ");
        }

        double total = titleScore + descScore + categoryScore + colorScore + brandScore + locScore + dateScore;

        if (reasons.length() == 0) {
            reasons.append("General keyword overlap; ");
        }

        return new MatchResult(total, reasons.toString().trim());
    }

    private double calculateAttributeMatch(String attr1, String attr2, String context1, String context2) {
        boolean has1 = StringUtils.hasText(attr1);
        boolean has2 = StringUtils.hasText(attr2);

        if (has1 && has2) {
            double sim = calculateTextJaccard(attr1, attr2);
            return sim * 10.0;
        } else if (has1) {
            // Check if attr1 appears in other item's context
            if (StringUtils.hasText(context2) && context2.toLowerCase().contains(attr1.toLowerCase().trim())) {
                return 8.0;
            }
        } else if (has2) {
            if (StringUtils.hasText(context1) && context1.toLowerCase().contains(attr2.toLowerCase().trim())) {
                return 8.0;
            }
        } else {
            // Both omitted attribute
            return 5.0; // neutral partial score
        }
        return 0.0;
    }

    private double calculateDateProximity(java.time.OffsetDateTime d1, java.time.OffsetDateTime d2) {
        if (d1 == null || d2 == null) return 5.0;
        long daysDiff = Math.abs(ChronoUnit.DAYS.between(d1.toLocalDate(), d2.toLocalDate()));
        if (daysDiff == 0) return 10.0;
        if (daysDiff <= 1) return 9.0;
        if (daysDiff <= 3) return 7.5;
        if (daysDiff <= 7) return 5.0;
        if (daysDiff <= 14) return 2.5;
        return 0.0;
    }

    public double calculateTextJaccard(String text1, String text2) {
        if (!StringUtils.hasText(text1) || !StringUtils.hasText(text2)) {
            return 0.0;
        }

        Set<String> tokens1 = tokenize(text1);
        Set<String> tokens2 = tokenize(text2);

        if (tokens1.isEmpty() || tokens2.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        return (double) intersection.size() / union.size();
    }

    public Set<String> tokenize(String text) {
        if (!StringUtils.hasText(text)) return Collections.emptySet();

        String normalized = PUNCTUATION_PATTERN.matcher(text.toLowerCase()).replaceAll(" ");
        String[] words = normalized.split("\\s+");

        Set<String> result = new HashSet<>();
        for (String word : words) {
            String trimmed = word.trim();
            if (trimmed.length() > 1 && !STOP_WORDS.contains(trimmed)) {
                result.add(trimmed);
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemMatchResponse> getMatchesForUser(Long userId, Pageable pageable) {
        Page<ItemMatch> page = matchRepository.findMatchesForUser(userId, pageable);
        return PageResponse.from(page.map(this::mapToResponse));
    }

    @Transactional(readOnly = true)
    public List<ItemMatchResponse> getTopMatchesForUser(Long userId) {
        return matchRepository.findTopMatchesForUser(userId, org.springframework.data.domain.PageRequest.of(0, 5))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ItemMatchResponse> getMatchesForItem(Long itemId) {
        return matchRepository.findMatchesForItem(itemId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ItemMatchResponse mapToResponse(ItemMatch match) {
        String level = match.getSimilarityScore() >= HIGH_MATCH_THRESHOLD ? "High Match" : "Possible Match";

        String lostImage = match.getLostReport().getImages().isEmpty() ? null :
                "/api/files/" + match.getLostReport().getImages().get(0).getFileName();
        String foundImage = match.getFoundReport().getImages().isEmpty() ? null :
                "/api/files/" + match.getFoundReport().getImages().get(0).getFileName();

        return ItemMatchResponse.builder()
                .id(match.getId())
                .lostReportId(match.getLostReport().getId())
                .lostTitle(match.getLostReport().getTitle())
                .lostCategory(match.getLostReport().getCategory())
                .lostLocation(match.getLostReport().getLocation())
                .lostImageUrl(lostImage)
                .lostReporterId(match.getLostReport().getReporter().getId())
                .foundReportId(match.getFoundReport().getId())
                .foundTitle(match.getFoundReport().getTitle())
                .foundCategory(match.getFoundReport().getCategory())
                .foundLocation(match.getFoundReport().getLocation())
                .foundImageUrl(foundImage)
                .foundReporterId(match.getFoundReport().getReporter().getId())
                .similarityScore(match.getSimilarityScore())
                .matchReason(match.getMatchReason())
                .matchLevel(level)
                .createdAt(match.getCreatedAt())
                .build();
    }

    public static class MatchResult {
        public final double totalScore;
        public final String reasonSummary;

        public MatchResult(double totalScore, String reasonSummary) {
            this.totalScore = totalScore;
            this.reasonSummary = reasonSummary;
        }
    }
}
