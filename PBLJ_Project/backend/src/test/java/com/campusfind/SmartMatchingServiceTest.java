package com.campusfind;

import com.campusfind.entity.ItemReport;
import com.campusfind.entity.User;
import com.campusfind.enums.ItemCategory;
import com.campusfind.enums.ReportStatus;
import com.campusfind.enums.ReportType;
import com.campusfind.enums.Role;
import com.campusfind.repository.ItemMatchRepository;
import com.campusfind.repository.ItemReportRepository;
import com.campusfind.service.NotificationService;
import com.campusfind.service.SmartMatchingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SmartMatchingServiceTest {

    @Mock
    private ItemMatchRepository matchRepository;

    @Mock
    private ItemReportRepository reportRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private SmartMatchingService matchingService;

    private User student1;
    private User student2;

    @BeforeEach
    void setUp() {
        student1 = User.builder().id(1L).fullName("Alice").email("alice@campus.edu").role(Role.STUDENT).build();
        student2 = User.builder().id(2L).fullName("Bob").email("bob@campus.edu").role(Role.STUDENT).build();
    }

    @Test
    @DisplayName("Tokenization strips stop words and punctuation")
    void testTokenization() {
        String input = "The blue Hydro-Flask bottle with a dent on the rim!";
        Set<String> tokens = matchingService.tokenize(input);

        assertTrue(tokens.contains("blue"));
        assertTrue(tokens.contains("hydro"));
        assertTrue(tokens.contains("flask"));
        assertTrue(tokens.contains("bottle"));
        assertTrue(tokens.contains("dent"));
        assertTrue(tokens.contains("rim"));
        assertFalse(tokens.contains("the"));
        assertFalse(tokens.contains("with"));
        assertFalse(tokens.contains("on"));
        assertFalse(tokens.contains("a"));
    }

    @Test
    @DisplayName("Identical items should yield High Match score (> 80%)")
    void testHighMatchCalculation() {
        OffsetDateTime now = OffsetDateTime.now();

        ItemReport lostItem = ItemReport.builder()
                .id(10L)
                .title("Navy Blue Hydro Flask Water Bottle")
                .description("Lost my 32oz navy blue Hydro Flask bottle with an engineering sticker on it.")
                .reportType(ReportType.LOST)
                .category(ItemCategory.OTHER)
                .color("Navy Blue")
                .brand("Hydro Flask")
                .location("Central Library 2nd Floor")
                .eventDate(now)
                .status(ReportStatus.OPEN)
                .reporter(student1)
                .build();

        ItemReport foundItem = ItemReport.builder()
                .id(20L)
                .title("Found Hydro Flask Bottle Navy Blue")
                .description("Found a navy blue Hydro Flask bottle near the library study desks.")
                .reportType(ReportType.FOUND)
                .category(ItemCategory.OTHER)
                .color("Navy Blue")
                .brand("Hydro Flask")
                .location("Central Library 2nd Floor")
                .eventDate(now)
                .status(ReportStatus.OPEN)
                .reporter(student2)
                .build();

        SmartMatchingService.MatchResult result = matchingService.calculateSimilarity(lostItem, foundItem);

        assertTrue(result.totalScore >= 80.0, "Expected high match score >= 80, but got: " + result.totalScore);
        assertTrue(result.reasonSummary.contains("Same category"));
        assertTrue(result.reasonSummary.contains("Color matched"));
        assertTrue(result.reasonSummary.contains("Brand matched"));
    }

    @Test
    @DisplayName("Completely different items should yield score < 60%")
    void testUnrelatedItemsLowScore() {
        OffsetDateTime now = OffsetDateTime.now();

        ItemReport lostLaptop = ItemReport.builder()
                .id(10L)
                .title("MacBook Pro 14 Inch M2")
                .description("Silver Apple laptop in grey neoprene sleeve")
                .reportType(ReportType.LOST)
                .category(ItemCategory.ELECTRONICS)
                .color("Silver")
                .brand("Apple")
                .location("Turing Hall Computer Lab")
                .eventDate(now)
                .status(ReportStatus.OPEN)
                .reporter(student1)
                .build();

        ItemReport foundUmbrella = ItemReport.builder()
                .id(20L)
                .title("Black Folding Umbrella")
                .description("Left outside cafeteria entrance during rain")
                .reportType(ReportType.FOUND)
                .category(ItemCategory.ACCESSORIES)
                .color("Black")
                .brand("Totes")
                .location("Campus Cafeteria")
                .eventDate(now.minusDays(15))
                .status(ReportStatus.OPEN)
                .reporter(student2)
                .build();

        SmartMatchingService.MatchResult result = matchingService.calculateSimilarity(lostLaptop, foundUmbrella);

        assertTrue(result.totalScore < 60.0, "Expected score < 60 for unrelated items, but got: " + result.totalScore);
    }
}
