# Data Quality Framework with Apache Spark

## Overview

This comprehensive data quality framework implements automated quality checks using Apache Spark for real-time and batch processing, ensuring data accuracy across all inference modes.

## 🎯 Data Quality Dimensions

### The Four Pillars of Data Quality

1. **Completeness**: All required fields are populated
2. **Validity**: Data conforms to expected formats and business rules
3. **Consistency**: Data is consistent across sources and time
4. **Uniqueness**: No duplicate records exist

## 🔧 Apache Spark Data Quality Engine

### Core Quality Engine Implementation

```scala
package com.fintech.quality

import org.apache.spark.sql.{DataFrame, SparkSession}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._
import org.apache.spark.sql.expressions.Window
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

case class QualityResult(
  recordId: String,
  completenessScore: Double,
  validityScore: Double,
  consistencyScore: Double,
  uniquenessScore: Double,
  overallScore: Double,
  issues: List[String],
  recommendations: List[String]
)

case class QualityMetrics(
  totalRecords: Long,
  passedRecords: Long,
  failedRecords: Long,
  qualityScore: Double,
  completenessRate: Double,
  validityRate: Double,
  consistencyRate: Double,
  uniquenessRate: Double,
  processingTimestamp: String
)

class DataQualityEngine(spark: SparkSession) {
  
  import spark.implicits._
  
  private val QUALITY_THRESHOLD = 0.8
  private val timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
  
  def assessQuality(df: DataFrame, rules: QualityRules): DataFrame = {
    var qualityDF = df
    
    // Add quality assessment columns
    qualityDF = addCompletenessChecks(qualityDF, rules)
    qualityDF = addValidityChecks(qualityDF, rules)
    qualityDF = addConsistencyChecks(qualityDF, rules)
    qualityDF = addUniquenessChecks(qualityDF, rules)
    
    // Calculate overall quality score
    qualityDF = calculateOverallScore(qualityDF)
    
    // Add quality metadata
    qualityDF = addQualityMetadata(qualityDF)
    
    qualityDF
  }
  
  private def addCompletenessChecks(df: DataFrame, rules: QualityRules): DataFrame = {
    var resultDF = df
    
    // Check required fields
    val requiredFields = rules.requiredFields
    val completenessChecks = requiredFields.map { field =>
      when(col(field).isNull or col(field) === "" or col(field) === "null", 0.0)
        .otherwise(1.0)
        .alias(s"${field}_complete")
    }
    
    resultDF = resultDF.select(col("*") +: completenessChecks: _*)
    
    // Calculate completeness score
    val completenessColumns = requiredFields.map(field => col(s"${field}_complete"))
    val completenessScore = completenessColumns.reduce(_ + _) / lit(requiredFields.length)
    
    resultDF.withColumn("completeness_score", completenessScore)
  }
  
  private def addValidityChecks(df: DataFrame, rules: QualityRules): DataFrame = {
    var resultDF = df
    var validityChecks = List[Column]()
    
    // Amount validation
    if (df.columns.contains("amount")) {
      val amountValid = when(
        col("amount").isNull, 0.0
      ).when(
        col("amount") >= 0 and col("amount") <= rules.maxAmount, 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("amount_valid", amountValid)
      validityChecks = validityChecks :+ col("amount_valid")
    }
    
    // Currency validation
    if (df.columns.contains("currency")) {
      val currencyValid = when(
        col("currency").isin(rules.validCurrencies: _*), 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("currency_valid", currencyValid)
      validityChecks = validityChecks :+ col("currency_valid")
    }
    
    // Email validation
    if (df.columns.contains("email")) {
      val emailValid = when(
        col("email").rlike(rules.emailPattern), 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("email_valid", emailValid)
      validityChecks = validityChecks :+ col("email_valid")
    }
    
    // Phone validation
    if (df.columns.contains("phone")) {
      val phoneValid = when(
        col("phone").rlike(rules.phonePattern), 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("phone_valid", phoneValid)
      validityChecks = validityChecks :+ col("phone_valid")
    }
    
    // Timestamp validation
    if (df.columns.contains("timestamp")) {
      val timestampValid = when(
        col("timestamp").between(
          unix_timestamp() - rules.maxAgeSeconds,
          unix_timestamp() + rules.futureToleranceSeconds
        ), 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("timestamp_valid", timestampValid)
      validityChecks = validityChecks :+ col("timestamp_valid")
    }
    
    // Calculate validity score
    if (validityChecks.nonEmpty) {
      val validityScore = validityChecks.reduce(_ + _) / lit(validityChecks.length)
      resultDF = resultDF.withColumn("validity_score", validityScore)
    } else {
      resultDF = resultDF.withColumn("validity_score", lit(1.0))
    }
    
    resultDF
  }
  
  private def addConsistencyChecks(df: DataFrame, rules: QualityRules): DataFrame = {
    var resultDF = df
    
    // Cross-field consistency checks
    var consistencyChecks = List[Column]()
    
    // Transaction type vs amount consistency
    if (df.columns.contains("transaction_type") && df.columns.contains("amount")) {
      val typeAmountConsistent = when(
        (col("transaction_type") === "refund" and col("amount") < 0) or
        (col("transaction_type") === "deposit" and col("amount") > 0) or
        (col("transaction_type") === "withdrawal" and col("amount") < 0) or
        (col("transaction_type") === "transfer" and col("amount") =!= 0), 1.0
      ).otherwise(0.0)
      
      resultDF = resultDF.withColumn("type_amount_consistent", typeAmountConsistent)
      consistencyChecks = consistencyChecks :+ col("type_amount_consistent")
    }
    
    // Geographic consistency
    if (df.columns.contains("country") && df.columns.contains("currency")) {
      val geoConsistent = when(
        (col("country") === "US" and col("currency") === "USD") or
        (col("country") === "UK" and col("currency") === "GBP") or
        (col("country") === "DE" and col("currency") === "EUR") or
        (col("country") === "JP" and col("currency") === "JPY") or
        col("country").isNull or col("currency").isNull, 1.0
      ).otherwise(0.8) // Partial credit for valid but mismatched geo-currency
      
      resultDF = resultDF.withColumn("geo_consistent", geoConsistent)
      consistencyChecks = consistencyChecks :+ col("geo_consistent")
    }
    
    // Historical consistency (user behavior patterns)
    if (df.columns.contains("user_id") && df.columns.contains("amount")) {
      val userWindow = Window.partitionBy("user_id").orderBy("timestamp").rowsBetween(-10, -1)
      
      val avgUserAmount = avg("amount").over(userWindow)
      val stdDevUserAmount = stddev("amount").over(userWindow)
      
      val historicalConsistent = when(
        abs(col("amount") - avgUserAmount) <= (stdDevUserAmount * 2), 1.0
      ).when(
        abs(col("amount") - avgUserAmount) <= (stdDevUserAmount * 3), 0.7
      ).otherwise(0.3)
      
      resultDF = resultDF.withColumn("avg_user_amount", avgUserAmount)
                        .withColumn("historical_consistent", 
                          coalesce(historicalConsistent, lit(1.0)))
      consistencyChecks = consistencyChecks :+ col("historical_consistent")
    }
    
    // Calculate consistency score
    if (consistencyChecks.nonEmpty) {
      val consistencyScore = consistencyChecks.reduce(_ + _) / lit(consistencyChecks.length)
      resultDF = resultDF.withColumn("consistency_score", consistencyScore)
    } else {
      resultDF = resultDF.withColumn("consistency_score", lit(1.0))
    }
    
    resultDF
  }
  
  private def addUniquenessChecks(df: DataFrame, rules: QualityRules): DataFrame = {
    // Identify duplicates based on key columns
    val keyColumns = rules.uniquenessKeys
    
    val duplicateWindow = Window.partitionBy(keyColumns.map(col): _*)
    val duplicateCount = count("*").over(duplicateWindow)
    
    val uniquenessScore = when(duplicateCount === 1, 1.0).otherwise(0.0)
    
    df.withColumn("duplicate_count", duplicateCount)
      .withColumn("uniqueness_score", uniquenessScore)
  }
  
  private def calculateOverallScore(df: DataFrame): DataFrame = {
    // Weighted average of quality dimensions
    val weights = Map(
      "completeness" -> 0.3,
      "validity" -> 0.3,
      "consistency" -> 0.2,
      "uniqueness" -> 0.2
    )
    
    val overallScore = (
      col("completeness_score") * lit(weights("completeness")) +
      col("validity_score") * lit(weights("validity")) +
      col("consistency_score") * lit(weights("consistency")) +
      col("uniqueness_score") * lit(weights("uniqueness"))
    )
    
    df.withColumn("overall_quality_score", round(overallScore, 3))
      .withColumn("quality_passed", overallScore >= lit(QUALITY_THRESHOLD))
  }
  
  private def addQualityMetadata(df: DataFrame): DataFrame = {
    df.withColumn("quality_check_timestamp", lit(timestamp))
      .withColumn("quality_engine_version", lit("1.0.0"))
      .withColumn("quality_threshold", lit(QUALITY_THRESHOLD))
  }
  
  def generateQualityReport(df: DataFrame): QualityMetrics = {
    val totalRecords = df.count()
    val passedRecords = df.filter(col("quality_passed") === true).count()
    val failedRecords = totalRecords - passedRecords
    
    val avgScores = df.agg(
      avg("overall_quality_score").alias("overall"),
      avg("completeness_score").alias("completeness"),
      avg("validity_score").alias("validity"),
      avg("consistency_score").alias("consistency"),
      avg("uniqueness_score").alias("uniqueness")
    ).collect()(0)
    
    QualityMetrics(
      totalRecords = totalRecords,
      passedRecords = passedRecords,
      failedRecords = failedRecords,
      qualityScore = avgScores.getAs[Double]("overall"),
      completenessRate = avgScores.getAs[Double]("completeness"),
      validityRate = avgScores.getAs[Double]("validity"),
      consistencyRate = avgScores.getAs[Double]("consistency"),
      uniquenessRate = avgScores.getAs[Double]("uniqueness"),
      processingTimestamp = timestamp
    )
  }
  
  def identifyQualityIssues(df: DataFrame): DataFrame = {
    df.withColumn("quality_issues", 
      array_compact(array(
        when(col("completeness_score") < 0.8, lit("INCOMPLETE_DATA")).otherwise(lit(null)),
        when(col("validity_score") < 0.8, lit("INVALID_FORMAT")).otherwise(lit(null)),
        when(col("consistency_score") < 0.8, lit("INCONSISTENT_DATA")).otherwise(lit(null)),
        when(col("uniqueness_score") < 1.0, lit("DUPLICATE_RECORD")).otherwise(lit(null))
      ))
    ).withColumn("quality_recommendations",
      array_compact(array(
        when(col("completeness_score") < 0.8, lit("Fill missing required fields")).otherwise(lit(null)),
        when(col("validity_score") < 0.8, lit("Validate data formats")).otherwise(lit(null)),
        when(col("consistency_score") < 0.8, lit("Check business logic consistency")).otherwise(lit(null)),
        when(col("uniqueness_score") < 1.0, lit("Remove duplicate records")).otherwise(lit(null))
      ))
    )
  }
}

case class QualityRules(
  requiredFields: List[String],
  validCurrencies: List[String],
  maxAmount: Double,
  emailPattern: String,
  phonePattern: String,
  maxAgeSeconds: Long,
  futureToleranceSeconds: Long,
  uniquenessKeys: List[String]
)

object QualityRules {
  def default: QualityRules = QualityRules(
    requiredFields = List("user_id", "timestamp", "transaction_id"),
    validCurrencies = List("USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"),
    maxAmount = 1000000.0,
    emailPattern = "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$",
    phonePattern = "^\\+?[1-9]\\d{1,14}$",
    maxAgeSeconds = 86400 * 30, // 30 days
    futureToleranceSeconds = 3600, // 1 hour
    uniquenessKeys = List("transaction_id")
  )
}
```

## 🚀 Real-time Quality Processing

### Structured Streaming Implementation

```scala
package com.fintech.streaming

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.streaming.{OutputMode, Trigger}
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

class RealTimeQualityProcessor(spark: SparkSession) {
  
  import spark.implicits._
  
  private val qualityEngine = new DataQualityEngine(spark)
  private val qualityRules = QualityRules.default
  
  def startQualityStream(): Unit = {
    // Define schema for incoming financial transactions
    val transactionSchema = StructType(Array(
      StructField("transaction_id", StringType, false),
      StructField("user_id", StringType, false),
      StructField("amount", DoubleType, false),
      StructField("currency", StringType, false),
      StructField("transaction_type", StringType, false),
      StructField("timestamp", LongType, false),
      StructField("country", StringType, true),
      StructField("email", StringType, true),
      StructField("phone", StringType, true),
      StructField("metadata", MapType(StringType, StringType), true)
    ))
    
    // Read from Kafka
    val rawStream = spark
      .readStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "kafka-cluster:9092")
      .option("subscribe", "financial-transactions")
      .option("startingOffsets", "latest")
      .option("failOnDataLoss", "false")
      .load()
    
    // Parse JSON and apply schema
    val parsedStream = rawStream
      .selectExpr("CAST(value AS STRING) as json_data")
      .select(from_json(col("json_data"), transactionSchema).as("data"))
      .select("data.*")
      .withColumn("processing_timestamp", current_timestamp())
    
    // Apply quality checks
    val qualityStream = qualityEngine.assessQuality(parsedStream, qualityRules)
    val qualityWithIssues = qualityEngine.identifyQualityIssues(qualityStream)
    
    // Split stream based on quality
    val highQualityStream = qualityWithIssues.filter(col("quality_passed") === true)
    val lowQualityStream = qualityWithIssues.filter(col("quality_passed") === false)
    
    // Write high-quality data to main topic
    val highQualityQuery = highQualityStream
      .selectExpr("to_json(struct(*)) AS value")
      .writeStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "kafka-cluster:9092")
      .option("topic", "high-quality-transactions")
      .option("checkpointLocation", "/tmp/checkpoints/high-quality")
      .outputMode(OutputMode.Append())
      .trigger(Trigger.ProcessingTime("5 seconds"))
      .start()
    
    // Write low-quality data to quarantine topic
    val lowQualityQuery = lowQualityStream
      .selectExpr("to_json(struct(*)) AS value")
      .writeStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "kafka-cluster:9092")
      .option("topic", "quarantine-transactions")
      .option("checkpointLocation", "/tmp/checkpoints/low-quality")
      .outputMode(OutputMode.Append())
      .trigger(Trigger.ProcessingTime("5 seconds"))
      .start()
    
    // Quality metrics stream
    val metricsQuery = qualityWithIssues
      .withWatermark("processing_timestamp", "10 minutes")
      .groupBy(
        window(col("processing_timestamp"), "5 minutes"),
        col("currency")
      )
      .agg(
        count("*").alias("total_records"),
        sum(when(col("quality_passed"), 1).otherwise(0)).alias("passed_records"),
        avg("overall_quality_score").alias("avg_quality_score"),
        avg("completeness_score").alias("avg_completeness"),
        avg("validity_score").alias("avg_validity"),
        avg("consistency_score").alias("avg_consistency"),
        avg("uniqueness_score").alias("avg_uniqueness")
      )
      .selectExpr("to_json(struct(*)) AS value")
      .writeStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "kafka-cluster:9092")
      .option("topic", "quality-metrics")
      .option("checkpointLocation", "/tmp/checkpoints/metrics")
      .outputMode(OutputMode.Append())
      .trigger(Trigger.ProcessingTime("30 seconds"))
      .start()
    
    // Wait for all streams to terminate
    highQualityQuery.awaitTermination()
    lowQualityQuery.awaitTermination()
    metricsQuery.awaitTermination()
  }
}
```

## 📊 Batch Quality Processing

### Historical Data Quality Assessment

```scala
package com.fintech.batch

import org.apache.spark.sql.{DataFrame, SparkSession}
import org.apache.spark.sql.functions._
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class BatchQualityProcessor(spark: SparkSession) {
  
  import spark.implicits._
  
  private val qualityEngine = new DataQualityEngine(spark)
  private val qualityRules = QualityRules.default
  
  def processDailyQuality(date: LocalDate): QualityMetrics = {
    val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
    
    // Read daily data from Delta Lake
    val dailyData = spark.read
      .format("delta")
      .table("financial_data.transactions")
      .filter(col("date") === dateStr)
    
    // Apply quality assessment
    val qualityData = qualityEngine.assessQuality(dailyData, qualityRules)
    val qualityWithIssues = qualityEngine.identifyQualityIssues(qualityData)
    
    // Save quality results
    qualityWithIssues.write
      .format("delta")
      .mode("overwrite")
      .option("replaceWhere", s"date = '$dateStr'")
      .table("quality_results.daily_assessments")
    
    // Generate and save quality report
    val qualityMetrics = qualityEngine.generateQualityReport(qualityWithIssues)
    
    // Save metrics to time series table
    Seq(qualityMetrics).toDF()
      .withColumn("date", lit(dateStr))
      .write
      .format("delta")
      .mode("append")
      .table("quality_metrics.daily_summary")
    
    qualityMetrics
  }
  
  def generateQualityTrends(startDate: LocalDate, endDate: LocalDate): DataFrame = {
    spark.read
      .format("delta")
      .table("quality_metrics.daily_summary")
      .filter(col("date").between(
        startDate.format(DateTimeFormatter.ISO_LOCAL_DATE),
        endDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
      ))
      .orderBy("date")
  }
  
  def identifyDataDrift(baselineDate: LocalDate, comparisonDate: LocalDate): DataFrame = {
    val baseline = spark.read
      .format("delta")
      .table("quality_results.daily_assessments")
      .filter(col("date") === baselineDate.format(DateTimeFormatter.ISO_LOCAL_DATE))
      .agg(
        avg("completeness_score").alias("baseline_completeness"),
        avg("validity_score").alias("baseline_validity"),
        avg("consistency_score").alias("baseline_consistency"),
        avg("uniqueness_score").alias("baseline_uniqueness")
      )
    
    val comparison = spark.read
      .format("delta")
      .table("quality_results.daily_assessments")
      .filter(col("date") === comparisonDate.format(DateTimeFormatter.ISO_LOCAL_DATE))
      .agg(
        avg("completeness_score").alias("comparison_completeness"),
        avg("validity_score").alias("comparison_validity"),
        avg("consistency_score").alias("comparison_consistency"),
        avg("uniqueness_score").alias("comparison_uniqueness")
      )
    
    baseline.crossJoin(comparison)
      .withColumn("completeness_drift", 
        abs(col("comparison_completeness") - col("baseline_completeness")))
      .withColumn("validity_drift", 
        abs(col("comparison_validity") - col("baseline_validity")))
      .withColumn("consistency_drift", 
        abs(col("comparison_consistency") - col("baseline_consistency")))
      .withColumn("uniqueness_drift", 
        abs(col("comparison_uniqueness") - col("baseline_uniqueness")))
      .withColumn("max_drift", greatest(
        col("completeness_drift"), col("validity_drift"),
        col("consistency_drift"), col("uniqueness_drift")
      ))
      .withColumn("drift_alert", col("max_drift") > 0.1)
  }
}
```

## 🎯 Advanced Quality Rules Engine

### Custom Business Rules

```scala
package com.fintech.rules

import org.apache.spark.sql.{DataFrame, Column}
import org.apache.spark.sql.functions._

trait QualityRule {
  def apply(df: DataFrame): Column
  def description: String
  def severity: String
}

class BusinessRulesEngine {
  
  val rules: List[QualityRule] = List(
    new HighValueTransactionRule(),
    new SuspiciousPatternRule(),
    new GeographicAnomalyRule(),
    new TemporalAnomalyRule(),
    new ComplianceRule()
  )
  
  def applyBusinessRules(df: DataFrame): DataFrame = {
    var resultDF = df
    
    rules.foreach { rule =>
      val ruleColumn = rule.apply(resultDF)
      val columnName = s"rule_${rule.getClass.getSimpleName.replace("Rule", "").toLowerCase}"
      resultDF = resultDF.withColumn(columnName, ruleColumn)
    }
    
    // Aggregate rule results
    val ruleColumns = rules.map { rule =>
      val columnName = s"rule_${rule.getClass.getSimpleName.replace("Rule", "").toLowerCase}"
      col(columnName)
    }
    
    val businessRulesScore = ruleColumns.reduce(_ + _) / lit(rules.length)
    
    resultDF.withColumn("business_rules_score", businessRulesScore)
            .withColumn("business_rules_passed", businessRulesScore >= 0.8)
  }
}

class HighValueTransactionRule extends QualityRule {
  def apply(df: DataFrame): Column = {
    when(col("amount") > 100000, 0.5) // Flag but don't fail
      .otherwise(1.0)
  }
  
  def description: String = "High value transactions require additional validation"
  def severity: String = "MEDIUM"
}

class SuspiciousPatternRule extends QualityRule {
  def apply(df: DataFrame): Column = {
    // Multiple transactions in short time window
    val windowSpec = Window.partitionBy("user_id")
      .orderBy("timestamp")
      .rangeBetween(-300, 0) // 5 minute window
    
    val recentTransactionCount = count("*").over(windowSpec)
    
    when(recentTransactionCount > 5, 0.3) // Suspicious pattern
      .otherwise(1.0)
  }
  
  def description: String = "Detect suspicious transaction patterns"
  def severity: String = "HIGH"
}

class GeographicAnomalyRule extends QualityRule {
  def apply(df: DataFrame): Column = {
    // Check for rapid geographic changes
    val userWindow = Window.partitionBy("user_id")
      .orderBy("timestamp")
      .rowsBetween(-1, 0)
    
    val prevCountry = lag("country", 1).over(userWindow)
    val timeDiff = col("timestamp") - lag("timestamp", 1).over(userWindow)
    
    when(
      prevCountry.isNotNull and 
      col("country") =!= prevCountry and 
      timeDiff < 3600, // 1 hour
      0.2
    ).otherwise(1.0)
  }
  
  def description: String = "Detect impossible geographic changes"
  def severity: String = "HIGH"
}

class TemporalAnomalyRule extends QualityRule {
  def apply(df: DataFrame): Column = {
    val hour = hour(from_unixtime(col("timestamp")))
    val dayOfWeek = dayofweek(from_unixtime(col("timestamp")))
    
    // Business hours check
    when(
      (hour < 6 or hour > 22) and 
      col("amount") > 50000,
      0.6
    ).when(
      dayOfWeek.isin(1, 7) and // Weekend
      col("amount") > 25000,
      0.7
    ).otherwise(1.0)
  }
  
  def description: String = "Detect transactions outside normal business patterns"
  def severity: String = "MEDIUM"
}

class ComplianceRule extends QualityRule {
  def apply(df: DataFrame): Column = {
    // Check for required compliance fields
    when(
      col("amount") > 10000 and 
      (col("kyc_verified").isNull or col("kyc_verified") === false),
      0.0 // Compliance failure
    ).when(
      col("country").isin("US", "CA") and 
      col("tax_id").isNull,
      0.5 // Partial compliance
    ).otherwise(1.0)
  }
  
  def description: String = "Ensure compliance with regulatory requirements"
  def severity: String = "CRITICAL"
}
```

## 📈 Quality Monitoring Dashboard

### Real-time Quality Metrics

```sql
-- Real-time Quality Dashboard Queries

-- Overall Quality Metrics (Last 24 Hours)
SELECT 
    DATE_TRUNC('hour', processing_timestamp) as hour,
    COUNT(*) as total_transactions,
    AVG(overall_quality_score) as avg_quality_score,
    AVG(completeness_score) as avg_completeness,
    AVG(validity_score) as avg_validity,
    AVG(consistency_score) as avg_consistency,
    AVG(uniqueness_score) as avg_uniqueness,
    SUM(CASE WHEN quality_passed THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as pass_rate,
    COUNT(DISTINCT currency) as currencies_processed,
    SUM(amount) as total_volume
FROM quality_results.real_time_assessments
WHERE processing_timestamp >= current_timestamp() - INTERVAL 24 HOURS
GROUP BY DATE_TRUNC('hour', processing_timestamp)
ORDER BY hour DESC;

-- Quality Issues Breakdown
SELECT 
    quality_issues,
    COUNT(*) as issue_count,
    AVG(overall_quality_score) as avg_score,
    SUM(amount) as affected_volume,
    COUNT(DISTINCT user_id) as affected_users
FROM quality_results.real_time_assessments
WHERE array_size(quality_issues) > 0
    AND processing_timestamp >= current_timestamp() - INTERVAL 24 HOURS
GROUP BY quality_issues
ORDER BY issue_count DESC;

-- Quality Trends by Currency
SELECT 
    currency,
    DATE_TRUNC('day', processing_timestamp) as day,
    COUNT(*) as transaction_count,
    AVG(overall_quality_score) as avg_quality_score,
    MIN(overall_quality_score) as min_quality_score,
    MAX(overall_quality_score) as max_quality_score,
    STDDEV(overall_quality_score) as quality_variance
FROM quality_results.real_time_assessments
WHERE processing_timestamp >= current_timestamp() - INTERVAL 7 DAYS
GROUP BY currency, DATE_TRUNC('day', processing_timestamp)
ORDER BY currency, day DESC;

-- Business Rules Violations
SELECT 
    business_rules_violations,
    COUNT(*) as violation_count,
    AVG(amount) as avg_amount,
    COUNT(DISTINCT user_id) as unique_users,
    STRING_AGG(DISTINCT country, ', ') as affected_countries
FROM quality_results.real_time_assessments
WHERE business_rules_passed = false
    AND processing_timestamp >= current_timestamp() - INTERVAL 24 HOURS
GROUP BY business_rules_violations
ORDER BY violation_count DESC;

-- Data Drift Detection
WITH daily_metrics AS (
    SELECT 
        DATE_TRUNC('day', processing_timestamp) as day,
        AVG(completeness_score) as avg_completeness,
        AVG(validity_score) as avg_validity,
        AVG(consistency_score) as avg_consistency,
        AVG(uniqueness_score) as avg_uniqueness
    FROM quality_results.real_time_assessments
    WHERE processing_timestamp >= current_timestamp() - INTERVAL 30 DAYS
    GROUP BY DATE_TRUNC('day', processing_timestamp)
),
drift_metrics AS (
    SELECT 
        day,
        avg_completeness,
        avg_validity,
        avg_consistency,
        avg_uniqueness,
        LAG(avg_completeness, 1) OVER (ORDER BY day) as prev_completeness,
        LAG(avg_validity, 1) OVER (ORDER BY day) as prev_validity,
        LAG(avg_consistency, 1) OVER (ORDER BY day) as prev_consistency,
        LAG(avg_uniqueness, 1) OVER (ORDER BY day) as prev_uniqueness
    FROM daily_metrics
)
SELECT 
    day,
    ABS(avg_completeness - prev_completeness) as completeness_drift,
    ABS(avg_validity - prev_validity) as validity_drift,
    ABS(avg_consistency - prev_consistency) as consistency_drift,
    ABS(avg_uniqueness - prev_uniqueness) as uniqueness_drift,
    GREATEST(
        ABS(avg_completeness - prev_completeness),
        ABS(avg_validity - prev_validity),
        ABS(avg_consistency - prev_consistency),
        ABS(avg_uniqueness - prev_uniqueness)
    ) as max_drift,
    CASE 
        WHEN GREATEST(
            ABS(avg_completeness - prev_completeness),
            ABS(avg_validity - prev_validity),
            ABS(avg_consistency - prev_consistency),
            ABS(avg_uniqueness - prev_uniqueness)
        ) > 0.1 THEN 'HIGH_DRIFT'
        WHEN GREATEST(
            ABS(avg_completeness - prev_completeness),
            ABS(avg_validity - prev_validity),
            ABS(avg_consistency - prev_consistency),
            ABS(avg_uniqueness - prev_uniqueness)
        ) > 0.05 THEN 'MEDIUM_DRIFT'
        ELSE 'LOW_DRIFT'
    END as drift_level
FROM drift_metrics
WHERE prev_completeness IS NOT NULL
ORDER BY day DESC;
```

## 🔄 Integration with AI Inference Pipeline

### Quality-Aware Model Serving

```python
from typing import Dict, Any, Optional
import pandas as pd
from dataclasses import dataclass

@dataclass
class QualityGate:
    min_quality_score: float = 0.8
    min_completeness: float = 0.9
    min_validity: float = 0.8
    min_consistency: float = 0.7
    block_on_anomaly: bool = True

class QualityAwareInferenceEngine:
    def __init__(self, quality_gate: QualityGate):
        self.quality_gate = quality_gate
        self.quality_engine = DataQualityEngine()
    
    def predict_with_quality_check(self, 
                                  data: Dict[str, Any], 
                                  model_endpoint: str) -> Dict[str, Any]:
        """Make prediction with quality validation"""
        
        # Assess data quality
        quality_result = self.quality_engine.assess_single_record(data)
        
        # Check quality gate
        if not self._passes_quality_gate(quality_result):
            return {
                'prediction': None,
                'error': 'Data quality below threshold',
                'quality_score': quality_result.overall_score,
                'quality_issues': quality_result.issues,
                'recommendations': quality_result.recommendations
            }
        
        # Proceed with inference
        try:
            prediction = self._call_model(data, model_endpoint)
            
            return {
                'prediction': prediction,
                'confidence': self._calculate_confidence(quality_result),
                'quality_score': quality_result.overall_score,
                'quality_metadata': {
                    'completeness': quality_result.completeness_score,
                    'validity': quality_result.validity_score,
                    'consistency': quality_result.consistency_score,
                    'uniqueness': quality_result.uniqueness_score
                }
            }
        except Exception as e:
            return {
                'prediction': None,
                'error': f'Model inference failed: {str(e)}',
                'quality_score': quality_result.overall_score
            }
    
    def _passes_quality_gate(self, quality_result: QualityResult) -> bool:
        """Check if data passes quality gate"""
        
        if quality_result.overall_score < self.quality_gate.min_quality_score:
            return False
        
        if quality_result.completeness_score < self.quality_gate.min_completeness:
            return False
        
        if quality_result.validity_score < self.quality_gate.min_validity:
            return False
        
        if quality_result.consistency_score < self.quality_gate.min_consistency:
            return False
        
        if self.quality_gate.block_on_anomaly and quality_result.anomaly_detected:
            return False
        
        return True
    
    def _calculate_confidence(self, quality_result: QualityResult) -> float:
        """Calculate prediction confidence based on data quality"""
        base_confidence = 0.8  # Model's base confidence
        
        # Adjust confidence based on quality score
        quality_factor = quality_result.overall_score
        
        # Penalty for detected anomalies
        anomaly_penalty = 0.2 if quality_result.anomaly_detected else 0.0
        
        adjusted_confidence = base_confidence * quality_factor - anomaly_penalty
        
        return max(0.0, min(1.0, adjusted_confidence))
    
    def _call_model(self, data: Dict[str, Any], endpoint: str) -> Dict[str, Any]:
        """Call the actual ML model endpoint"""
        # Implementation would call the actual model service
        # This is a placeholder
        return {'fraud_score': 0.23, 'risk_level': 'LOW'}
```

This comprehensive data quality framework provides:

1. **Four-Dimensional Quality Assessment**: Completeness, validity, consistency, and uniqueness checks
2. **Real-time Streaming**: Kafka Streams integration for low-latency quality validation
3. **Batch Processing**: Historical data quality analysis and trend detection
4. **Business Rules Engine**: Custom quality rules for domain-specific validation
5. **Quality Gates**: Integration with AI inference pipeline for quality-aware predictions
6. **Monitoring & Alerting**: Real-time dashboards and drift detection
7. **Remediation**: Automatic quarantine and recommendation system

The framework ensures that only high-quality data flows through your AI inference platform, maintaining accuracy and reliability across all processing modes.