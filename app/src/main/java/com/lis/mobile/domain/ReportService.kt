package com.lis.mobile.domain

import com.lis.mobile.data.Patient

class ReportService {
    fun generatePdfPayload(patient: Patient, logoName: String, doctorSignature: String): String {
        return """
            PDF REPORT
            Lab Logo: $logoName
            Patient: ${patient.patientId} ${patient.name}
            Signature: $doctorSignature
            Includes QR verification token.
        """.trimIndent()
    }

    fun whatsappShareLink(phone: String, reportId: String): String {
        return "https://wa.me/$phone?text=Your%20LIS%20report%20$reportId"
    }
}
