package com.lis.mobile.domain

import com.lis.mobile.data.Interpretation

object CalculationEngine {
    fun mcv(hct: Double, rbc: Double): Double = (hct * 10.0) / rbc
    fun mch(hb: Double, rbc: Double): Double = (hb * 10.0) / rbc
    fun mchc(hb: Double, hct: Double): Double = (hb * 100.0) / hct

    fun morphology(mcv: Double, mchc: Double): String = when {
        mcv < 80 || mchc < 32 -> "Microcytic hypochromic"
        mcv > 100 -> "Macrocytic anemia"
        else -> "Normocytic normochromic"
    }

    fun inrInterpretation(inr: Double): String = when {
        inr < 1 -> "Clotting risk"
        inr <= 3 -> "Therapeutic range"
        inr > 4 -> "Bleeding risk"
        else -> "Monitor closely"
    }

    fun aiPatterns(values: Map<String, Double>): List<Interpretation> {
        val list = mutableListOf<Interpretation>()
        if ((values["SGPT"] ?: 0.0) > 120 && (values["SGOT"] ?: 0.0) > 120 && (values["Bilirubin"] ?: 0.0) > 2.0) {
            list += Interpretation("Liver Pattern", "Possible hepatitis pattern", "high")
        }
        if ((values["Creatinine"] ?: 0.0) > 1.4 && (values["Urea"] ?: 0.0) > 45) {
            list += Interpretation("Renal Pattern", "Possible kidney dysfunction", "medium")
        }
        return if (list.isEmpty()) listOf(Interpretation("No major pattern", "No strong AI alerts", "low")) else list
    }

    fun criticalAlerts(values: Map<String, Double>): List<String> {
        val alerts = mutableListOf<String>()
        if ((values["Hb"] ?: 99.0) < 5.0) alerts += "Critical Hb value"
        if ((values["Potassium"] ?: 0.0) > 6.5) alerts += "Critical Potassium value"
        return alerts
    }
}
