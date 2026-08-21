package com.shopmanager.repository;

import com.shopmanager.dto.ReportItemDTO;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * MongoDB aggregation pipeline replacements for the JPQL aggregate queries.
 * Uses $toDouble conversion to handle both String (legacy) and Decimal128
 * (new MongoConfig) storage of BigDecimal fields.
 */
@Repository
public class SaleAggregationRepository {

    private final MongoTemplate mongoTemplate;

    public SaleAggregationRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    // ── Revenue (SUM totalPrice) ───────────────────────────────────────────────

    public Optional<BigDecimal> sumTotalBySaleDate(LocalDate date) {
        return sumTotalBetween(date, date);
    }

    public Optional<BigDecimal> sumTotalBetween(LocalDate start, LocalDate end) {
        MatchOperation match = Aggregation.match(
                Criteria.where("saleDate").gte(start).lte(end));

        // $addFields converts both String and Decimal128 → Double for $sum
        AggregationOperation addFields = context -> new org.bson.Document("$addFields",
                new org.bson.Document("totalPriceNum",
                        new org.bson.Document("$toDouble", "$totalPrice")));

        GroupOperation group = Aggregation.group().sum("totalPriceNum").as("total");
        Aggregation agg = Aggregation.newAggregation(match, addFields, group);
        AggregationResults<SumResult> results =
                mongoTemplate.aggregate(agg, "sales", SumResult.class);
        SumResult result = results.getUniqueMappedResult();
        if (result == null || result.total == null) return Optional.empty();
        return Optional.of(BigDecimal.valueOf(result.total));
    }

    // ── Quantity KG (SUM quantityKg) ──────────────────────────────────────────

    public Optional<BigDecimal> sumQuantityKgBySaleDate(LocalDate date) {
        return sumQuantityKgBetween(date, date);
    }

    public Optional<BigDecimal> sumQuantityKgBetween(LocalDate start, LocalDate end) {
        MatchOperation match = Aggregation.match(
                Criteria.where("saleDate").gte(start).lte(end));

        AggregationOperation addFields = context -> new org.bson.Document("$addFields",
                new org.bson.Document("quantityKgNum",
                        new org.bson.Document("$toDouble", "$quantityKg")));

        GroupOperation group = Aggregation.group().sum("quantityKgNum").as("total");
        Aggregation agg = Aggregation.newAggregation(match, addFields, group);
        AggregationResults<SumResult> results =
                mongoTemplate.aggregate(agg, "sales", SumResult.class);
        SumResult result = results.getUniqueMappedResult();
        if (result == null || result.total == null) return Optional.empty();
        return Optional.of(BigDecimal.valueOf(result.total));
    }

    // ── Count ─────────────────────────────────────────────────────────────────

    public long countBySaleDate(LocalDate date) {
        return countBetween(date, date);
    }

    public long countBetween(LocalDate start, LocalDate end) {
        MatchOperation match = Aggregation.match(
                Criteria.where("saleDate").gte(start).lte(end));
        GroupOperation group = Aggregation.group().count().as("total");
        Aggregation agg = Aggregation.newAggregation(match, group);
        AggregationResults<CountResult> results =
                mongoTemplate.aggregate(agg, "sales", CountResult.class);
        CountResult result = results.getUniqueMappedResult();
        return result == null ? 0L : result.total;
    }

    // ── Top Items by KG (GROUP BY itemName) ───────────────────────────────────

    public List<ReportItemDTO> findTopItemsBetween(LocalDate start, LocalDate end) {
        return findReportBetween(start, end, "totalKg");
    }

    // ── Item-wise Report (revenue ordered) ────────────────────────────────────

    public List<ReportItemDTO> findReportBetween(LocalDate start, LocalDate end) {
        return findReportBetween(start, end, "revenue");
    }

    private List<ReportItemDTO> findReportBetween(LocalDate start, LocalDate end, String sortField) {
        MatchOperation match = Aggregation.match(
                Criteria.where("saleDate").gte(start).lte(end));

        // Convert String/Decimal128 → Double for both sum fields
        AggregationOperation addFields = context -> new org.bson.Document("$addFields",
                new org.bson.Document("quantityKgNum",
                        new org.bson.Document("$toDouble", "$quantityKg"))
                        .append("totalPriceNum",
                                new org.bson.Document("$toDouble", "$totalPrice")));

        GroupOperation group = Aggregation.group("itemName")
                .sum("quantityKgNum").as("totalKg")
                .count().as("transactions")
                .sum("totalPriceNum").as("revenue");

        SortOperation sort = Aggregation.sort(
                org.springframework.data.domain.Sort.Direction.DESC, sortField);

        ProjectionOperation project = Aggregation.project()
                .and("_id").as("itemName")
                .and("totalKg").as("totalKg")
                .and("transactions").as("transactions")
                .and("revenue").as("revenue");

        Aggregation agg = Aggregation.newAggregation(match, addFields, group, sort, project);
        AggregationResults<ReportItemDTO> results =
                mongoTemplate.aggregate(agg, "sales", ReportItemDTO.class);
        return results.getMappedResults();
    }

    // ── Internal result classes ───────────────────────────────────────────────

    private static class SumResult {
        public Double total;
    }

    private static class CountResult {
        public long total;
    }
}
