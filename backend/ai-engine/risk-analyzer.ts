// backend/ai-engine/risk-analyzer.ts
export class RiskAnalyzer {
  private readonly riskFactors = {
    protocolAge: 0.15,
    auditScore: 0.25,
    tvlStability: 0.20,
    teamReputation: 0.15,
    codeComplexity: 0.10,
    marketConditions: 0.15
  };
  
  async analyzeProtocolRisk(
    protocol: string,
    chain: string,
    amount: number
  ): Promise<{
    riskScore: number;
    factors: RiskBreakdown;
    recommendation: string;
  }> {
    const factors = await this.calculateRiskFactors(protocol, chain);
    const weightedScore = this.calculateWeightedRisk(factors);
    
    // Adjust for amount (larger amounts = higher risk)
    const amountMultiplier = Math.log10(amount / 1000) * 0.1 + 1;
    const finalScore = Math.min(weightedScore * amountMultiplier, 100);
    
    return {
      riskScore: finalScore,
      factors,
      recommendation: this.generateRecommendation(finalScore, amount)
    };
  }
  
  private generateRecommendation(score: number, amount: number): string {
    if (score < 20) return "Low risk - Safe for large deposits";
    if (score < 40) return "Medium risk - Consider splitting across protocols";
    if (score < 60) return "High risk - Only deposit what you can afford to lose";
    return "Very high risk - Not recommended for this amount";
  }
}