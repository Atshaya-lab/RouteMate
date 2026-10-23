import 'dart:math' as math;
import 'routing_graph.dart';

class SafetyConstraintConfig {
  final bool avoidUnlitPaths;
  final bool requirePedestrianAccess;
  final bool avoidIsolatedConstruction;
  final bool blockRestrictedZones;
  final double minimumDataConfidence; // Edges below this trigger uncertainty warnings

  const SafetyConstraintConfig({
    this.avoidUnlitPaths = true,
    this.requirePedestrianAccess = true,
    this.avoidIsolatedConstruction = true,
    this.blockRestrictedZones = true,
    this.minimumDataConfidence = 0.7,
  });
}

class SafetyEvaluationResult {
  final bool isPass;
  final double effectiveCost; // Distance weighted by safety penalty
  final double safetyScore; // 0.0 to 1.0
  final String? rejectionReason;
  final String? uncertaintyWarning;

  const SafetyEvaluationResult({
    required this.isPass,
    required this.effectiveCost,
    required this.safetyScore,
    this.rejectionReason,
    this.uncertaintyWarning,
  });
}

class SafetyEvaluator {
  final SafetyConstraintConfig config;

  const SafetyEvaluator({this.config = const SafetyConstraintConfig()});

  /// Evaluates whether an edge is safe and traversable based on user safety constraints,
  /// and calculates a weighted cost penalty if the path has sub-optimal illumination or isolated conditions.
  SafetyEvaluationResult evaluateEdge(GraphEdge edge) {
    // 1. Hard Block: Blocked road/segment reported dynamically
    if (edge.isBlocked) {
      return const SafetyEvaluationResult(
        isPass: false,
        effectiveCost: double.infinity,
        safetyScore: 0.0,
        rejectionReason: 'Path is reported blocked or temporarily unavailable.',
      );
    }

    // 2. Hard Constraint: Restricted Zone
    if (config.blockRestrictedZones && edge.isRestricted) {
      return const SafetyEvaluationResult(
        isPass: false,
        effectiveCost: double.infinity,
        safetyScore: 0.0,
        rejectionReason: 'Restricted area / private security zone.',
      );
    }

    // 3. Hard Constraint: Pedestrian Accessibility
    if (config.requirePedestrianAccess && !edge.isAccessible) {
      return const SafetyEvaluationResult(
        isPass: false,
        effectiveCost: double.infinity,
        safetyScore: 0.2,
        rejectionReason: 'Path lacks pedestrian or mobility accessibility.',
      );
    }

    // 4. Hard Constraint: Construction Hazard
    if (config.avoidIsolatedConstruction &&
        edge.hazardType == HazardType.isolatedConstruction) {
      return const SafetyEvaluationResult(
        isPass: false,
        effectiveCost: double.infinity,
        safetyScore: 0.1,
        rejectionReason: 'Active isolated construction hazard detected.',
      );
    }

    // 5. Soft Constraints & Safety Penalties (e.g. poor lighting or unlit paths)
    double penaltyMultiplier = 1.0;
    double safetyScore = 1.0;

    if (config.avoidUnlitPaths && edge.hazardType == HazardType.unlitArea) {
      penaltyMultiplier += 3.5; // Steep path cost multiplier to prefer well-lit avenues
      safetyScore -= 0.4;
    } else if (edge.lightingScore < 0.5) {
      penaltyMultiplier += (1.0 - edge.lightingScore) * 2.0;
      safetyScore -= 0.25;
    }

    if (edge.hazardType == HazardType.reportedIncident) {
      penaltyMultiplier += 5.0; // Heavily penalize paths with recent incidents
      safetyScore -= 0.5;
    }

    // 6. Explicit Uncertainty Warning for sparse or low-confidence telemetry
    String? uncertaintyWarning;
    if (edge.dataConfidence < config.minimumDataConfidence) {
      uncertaintyWarning =
          'Segment [${edge.id}] has low telemetry confidence (${(edge.dataConfidence * 100).toInt()}%). Proceed with verified caution.';
    }

    return SafetyEvaluationResult(
      isPass: true,
      effectiveCost: edge.distanceMeters * penaltyMultiplier,
      safetyScore: safetyScore.clamp(0.0, 1.0),
      uncertaintyWarning: uncertaintyWarning,
    );
  }

  /// Computes the comprehensive Night Activity Score (0 to 100)
  /// Incorporates lighting, open 24/7 places, CCTV density, main road ratio,
  /// and applies an explicit dark gap penalty for long isolated stretches.
  int computeNightScore({
    required double lightingScore,
    required int openPlacesCount,
    required int cctvCount,
    required double distanceMeters,
    required double maxDarkGapMeters,
    required double mainRoadRatio,
    String transitMode = 'walking',
  }) {
    // 1. Base Lighting Score (35 points max)
    double score = lightingScore * 35.0;

    // 2. Open 24/7 Establishments Density (25 points max)
    final distKm = math.max(0.1, distanceMeters / 1000.0);
    final openDensity = (openPlacesCount / distKm);
    score += (openDensity / 5.0).clamp(0.0, 1.0) * 25.0;

    // 3. CCTV Surveillance Coverage (15 points max)
    final cctvDensity = (cctvCount / distKm);
    score += (cctvDensity / 5.0).clamp(0.0, 1.0) * 15.0;

    // 4. Main Road / Boulevard Ratio (15 points max)
    score += mainRoadRatio.clamp(0.0, 1.0) * 15.0;

    // 5. Baseline activity presence (10 points)
    if (openPlacesCount > 0 || cctvCount > 0) {
      score += 10.0;
    }

    // 6. Dark Gap Penalty (Deduction of up to 40 points)
    // A long unbroken dark gap severely penalizes walking mode
    final gapTolerance = transitMode == 'two_wheeler' ? 250.0 : 120.0;
    if (maxDarkGapMeters > gapTolerance) {
      final excessGap = maxDarkGapMeters - gapTolerance;
      final gapDeduction = (excessGap / 120.0).clamp(0.0, 1.0) * (transitMode == 'two_wheeler' ? 25.0 : 40.0);
      score -= gapDeduction;
    }

    return score.round().clamp(10, 99);
  }
}
