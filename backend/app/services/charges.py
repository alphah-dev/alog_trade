class SEBIChargesCalculator:
    BROKERAGE_RATE = 0.0003
    MAX_BROKERAGE = 20.0

    STT_DELIVERY_BUY = 0.001
    STT_DELIVERY_SELL = 0.001
    STT_INTRADAY_SELL = 0.00025

    NSE_TRANSACTION_CHARGE = 0.0000345
    BSE_TRANSACTION_CHARGE = 0.0000030

    GST_RATE = 0.18

    SEBI_TURNOVER_FEE = 0.000001

    STAMP_DUTY_BUY = 0.00015
    STAMP_DUTY_SELL = 0.0

    @classmethod
    def calculate(cls, side: str, product_type: str, price: float, quantity: float) -> dict:
        turnover = price * quantity

        brokerage = min(turnover * cls.BROKERAGE_RATE, cls.MAX_BROKERAGE)

        if product_type == "DELIVERY":
            stt = turnover * cls.STT_DELIVERY_BUY if side == "BUY" else turnover * cls.STT_DELIVERY_SELL
        else:
            stt = turnover * cls.STT_INTRADAY_SELL if side == "SELL" else 0.0

        transaction_charges = turnover * cls.NSE_TRANSACTION_CHARGE

        gst = (brokerage + transaction_charges) * cls.GST_RATE

        sebi_fee = turnover * cls.SEBI_TURNOVER_FEE

        stamp_duty = turnover * cls.STAMP_DUTY_BUY if side == "BUY" else 0.0

        total = round(brokerage + stt + transaction_charges + gst + sebi_fee + stamp_duty, 2)

        return {
            "brokerage": round(brokerage, 2),
            "stt": round(stt, 2),
            "transaction_charges": round(transaction_charges, 2),
            "gst": round(gst, 2),
            "sebi_fee": round(sebi_fee, 4),
            "stamp_duty": round(stamp_duty, 2),
            "total": total,
        }


class USChargesCalculator:
    """US market charges: SEC fee + FINRA TAF (zero commission model)."""
    SEC_FEE_RATE = 0.000008          # $8 per $1,000,000 of sale proceeds
    FINRA_TAF_PER_SHARE = 0.000166   # per share sold
    FINRA_TAF_MAX = 8.30             # max per trade

    @classmethod
    def calculate(cls, side: str, product_type: str, price: float, quantity: float) -> dict:
        turnover = price * quantity
        commission = 0.0  # zero commission

        sec_fee = turnover * cls.SEC_FEE_RATE if side == "SELL" else 0.0

        finra_taf = min(quantity * cls.FINRA_TAF_PER_SHARE, cls.FINRA_TAF_MAX) if side == "SELL" else 0.0

        total = round(commission + sec_fee + finra_taf, 4)

        return {
            "commission": round(commission, 2),
            "sec_fee": round(sec_fee, 4),
            "finra_taf": round(finra_taf, 4),
            "total": round(total, 4),
        }
