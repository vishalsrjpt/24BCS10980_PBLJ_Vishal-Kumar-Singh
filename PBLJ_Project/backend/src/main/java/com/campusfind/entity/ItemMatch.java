package com.campusfind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(
    name = "item_matches",
    schema = "campusfind",
    uniqueConstraints = @UniqueConstraint(name = "uq_lost_found", columnNames = {"lost_report_id", "found_report_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lost_report_id", nullable = false)
    private ItemReport lostReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "found_report_id", nullable = false)
    private ItemReport foundReport;

    @Column(name = "similarity_score", nullable = false)
    private Double similarityScore;

    @Column(name = "match_reason", nullable = false, columnDefinition = "TEXT")
    private String matchReason;

    @Column(name = "notification_sent", nullable = false)
    @Builder.Default
    private boolean notificationSent = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
