package com.lis.mobile.data

import kotlinx.coroutines.flow.Flow

class LisRepository(private val dao: LisDao) {
    fun patients(): Flow<List<Patient>> = dao.observePatients()
    fun searchPatients(query: String): Flow<List<Patient>> = dao.searchPatients(query)
    fun patientTests(patientId: String): Flow<List<TestOrder>> = dao.observeTests(patientId)

    suspend fun registerPatient(patient: Patient) = dao.savePatient(patient)
    suspend fun saveResults(results: List<TestOrder>) = dao.saveTests(results)
    suspend fun createBill(bill: Bill) = dao.saveBill(bill)

    fun departmentTestCatalog() = mapOf(
        Department.HEMATOLOGY to listOf("CBC", "ESR", "Hemoglobin", "Peripheral smear"),
        Department.BIOCHEMISTRY to listOf("Blood glucose", "LFT", "KFT", "Lipid profile", "Uric acid"),
        Department.SEROLOGY to listOf("Widal", "CRP", "RA factor", "Dengue"),
        Department.HORMONES to listOf("T3", "T4", "TSH", "HbA1c"),
        Department.COAGULATION to listOf("PT", "INR")
    )
}
