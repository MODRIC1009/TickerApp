import unittest

from portfolio_analytics import PortfolioValidationError, build_portfolio_summary, normalise_weights


def holding(ticker, risk_score, beta, vol_30, vol_60, vol_90):
    return {
        "Ticker": ticker,
        "Risk Score": risk_score,
        "Beta": beta,
        "Historical Volatility 30D": vol_30,
        "Historical Volatility 60D": vol_60,
        "Historical Volatility 90D": vol_90,
    }


class PortfolioAnalyticsTests(unittest.TestCase):
    def test_normalise_weights(self):
        self.assertEqual(normalise_weights([25, 75]), [0.25, 0.75])

    def test_summary_uses_weighted_metrics(self):
        result = build_portfolio_summary(
            [holding("AAA", 0.2, 0.8, 10, 12, 14), holding("BBB", 0.6, 1.2, 20, 24, 28)],
            [75, 25],
        )
        self.assertEqual(result["risk_score"], 0.3)
        self.assertEqual(result["risk_group"], "Stable")
        self.assertEqual(result["beta"], 0.9)
        self.assertEqual(result["effective_holdings"], 1.6)

    def test_rejects_invalid_weights(self):
        with self.assertRaises(PortfolioValidationError):
            normalise_weights([100, 0])

    def test_rejects_single_holding(self):
        with self.assertRaises(PortfolioValidationError):
            build_portfolio_summary([holding("AAA", 0.2, 0.8, 10, 12, 14)], [100])


if __name__ == "__main__":
    unittest.main()
